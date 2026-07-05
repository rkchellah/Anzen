import { NoSuchToolError } from "ai";

const READ_TOOL_NAMES = new Set([
  "listAssignedIssues",
  "listRepoIssues",
  "listUnreadEmails",
  "listChannels",
]);

/** Groq/Llama sometimes embeds JSON in the tool name, e.g. listRepoIssues({"owner":"x"}). */
function parseEmbeddedToolCall(toolName: string): { name: string; input: unknown } | null {
  const match = toolName.match(/^([a-zA-Z]+)\s*\((\{[\s\S]*\})\)\s*$/);
  if (!match?.[1] || !match[2]) return null;
  try {
    return { name: match[1], input: JSON.parse(match[2]) as unknown };
  } catch {
    return null;
  }
}

export async function repairGroqToolCall({
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

/** After a read-only tool step, force a text reply — Groq often malforms follow-up tool calls. */
export function prepareGroqChatStep({
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

export function groqChatErrorMessage(error: unknown): string {
  console.error("[chat] Groq stream error:", error);

  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message: unknown }).message);
    if (message.includes("tool_use_failed") || message.includes("Failed to call a function")) {
      return "The assistant hit a tool-calling error from the model provider. Please try again or rephrase your request.";
    }
  }

  return "Something went wrong while generating a response. Please try again.";
}
