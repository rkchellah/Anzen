import { NoSuchToolError } from "ai";
import type { AiProviderId } from "@/lib/ai-provider";

const READ_TOOL_NAMES = new Set([
  "listAssignedIssues",
  "listRepoIssues",
  "listUnreadEmails",
  "listChannels",
]);

/** Some models embed JSON in the tool name, e.g. listRepoIssues({"owner":"x"}). */
function parseEmbeddedToolCall(toolName: string): { name: string; input: unknown } | null {
  const match = toolName.match(/^([a-zA-Z]+)\s*\((\{[\s\S]*\})\)\s*$/);
  if (!match?.[1] || !match[2]) return null;
  try {
    return { name: match[1], input: JSON.parse(match[2]) as unknown };
  } catch {
    return null;
  }
}

export async function repairMalformedToolCall({
  toolCall,
  tools,
  error,
}: {
  toolCall: { toolCallId: string; toolName: string; input: unknown };
  tools: Record<string, unknown>;
  error: unknown;
}) {
  if (!NoSuchToolError.isInstance(error)) return null;

  const parsed = parseEmbeddedToolCall(toolCall.toolName);
  if (!parsed || !(parsed.name in tools)) return null;

  const input =
    typeof toolCall.input === "string" && toolCall.input.trim().length > 0
      ? toolCall.input
      : JSON.stringify(parsed.input);

  return {
    type: "tool-call" as const,
    toolCallId: toolCall.toolCallId,
    toolName: parsed.name,
    input,
  };
}

/** After a read-only tool step, force a text reply — Groq/Llama often malforms follow-up tool calls. */
export function prepareReadOnlyFollowUpStep({
  stepNumber,
  steps,
}: {
  stepNumber: number;
  steps: Array<{ toolCalls?: Array<{ toolName: string }> }>;
}) {
  if (stepNumber === 0) return {};

  const previous = steps[stepNumber - 1];
  const calls = previous?.toolCalls ?? [];
  const readOnly =
    calls.length > 0 && calls.every((call) => READ_TOOL_NAMES.has(call.toolName));

  if (readOnly) {
    return { toolChoice: "none" as const };
  }

  return {};
}

function errorMessageText(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "";
}

export function chatStreamErrorMessage(
  error: unknown,
  provider: AiProviderId
): string {
  console.error(`[chat] ${provider} stream error:`, error);

  const message = errorMessageText(error);
  const lower = message.toLowerCase();

  if (
    lower.includes("rate limit") ||
    lower.includes("rate_limit") ||
    lower.includes("too many requests")
  ) {
    return "The AI provider rate limit was reached. Please wait a few minutes and try again, or switch AI_PROVIDER in your environment.";
  }

  if (
    message.includes("tool_use_failed") ||
    message.includes("Failed to call a function")
  ) {
    return "The assistant hit a tool-calling error from the model provider. Please try again or rephrase your request.";
  }

  if (lower.includes("api key") || lower.includes("authentication")) {
    return "The AI provider rejected the request (API key issue). Check GROQ_API_KEY or DEEPSEEK_API_KEY in your environment.";
  }

  return "Something went wrong while generating a response. Please try again.";
}
