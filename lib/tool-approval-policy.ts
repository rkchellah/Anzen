import type { ModelMessage } from "ai";
import { isWriteToolName } from "@/agent/action-descriptions";

/** Last user turn text from UI messages (client-side helpers). */
export function getLastUserMessageText(messages: Array<{ role: string; content?: unknown; parts?: unknown[] }>): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message?.role !== "user") continue;

    if (Array.isArray(message.parts)) {
      const text = message.parts
        .filter(
          (part): part is { type: string; text?: string } =>
            typeof part === "object" && part !== null && "type" in part
        )
        .filter((part) => part.type === "text")
        .map((part) => part.text ?? "")
        .join("");
      if (text.trim()) return text.trim();
    }

    if (typeof message.content === "string" && message.content.trim()) {
      return message.content.trim();
    }

    if (Array.isArray(message.content)) {
      const text = message.content
        .filter(
          (part): part is { type: string; text?: string } =>
            typeof part === "object" && part !== null && "type" in part
        )
        .filter((part) => part.type === "text")
        .map((part) => part.text ?? "")
        .join("");
      if (text.trim()) return text.trim();
    }
  }
  return "";
}

/** Extract last user text from model messages passed to tool execute / needsApproval. */
export function getLastUserMessageFromModelMessages(messages: ModelMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.role !== "user") continue;

    const { content } = message;
    if (typeof content === "string" && content.trim()) return content.trim();

    if (Array.isArray(content)) {
      const text = content
        .filter((part): part is { type: "text"; text: string } => part.type === "text")
        .map((part) => part.text)
        .join("");
      if (text.trim()) return text.trim();
    }
  }
  return "";
}

function isProhibitionOnlyMessage(text: string): boolean {
  const lower = text.toLowerCase();
  const hasRestriction =
    /\b(don'?t|do not|never|not until|wait until|stop|hold off)\b/.test(lower);
  if (!hasRestriction) return false;

  const requestsNewWrite =
    /\b(yes|please|go ahead|do it|can you|could you|i want you to|comment on|close issue|send email|post to)\b/.test(
      lower
    );
  return !requestsNewWrite;
}

function contradictsReopenBan(
  lastUserText: string,
  toolName: string,
  input: Record<string, unknown>
): string | null {
  const lower = lastUserText.toLowerCase();
  const reopenBanned = /\b(don'?t|do not|never)\b[\s\S]{0,40}\breopen\b/.test(lower);
  if (!reopenBanned) return null;

  if (toolName === "commentOnIssue") {
    const comment = String(input.comment ?? "").toLowerCase();
    if (/\breopen/.test(comment)) {
      return "The user said not to reopen the issue, but this comment mentions reopening.";
    }
  }

  if (toolName === "closeIssue") {
    return "The user asked not to reopen or change issue state in their latest message.";
  }

  return null;
}

function contradictsCloseBan(
  lastUserText: string,
  toolName: string
): string | null {
  const lower = lastUserText.toLowerCase();
  if (!/\b(don'?t|do not|never)\b[\s\S]{0,40}\bclose\b/.test(lower)) return null;
  if (toolName === "closeIssue") {
    return "The user asked not to close the issue in their latest message.";
  }
  return null;
}

/** Server-side guard: latest user message must allow this write. */
export function checkWriteContradiction(
  lastUserText: string,
  toolName: string,
  input: Record<string, unknown>
): string | null {
  if (!lastUserText.trim()) return null;

  if (isProhibitionOnlyMessage(lastUserText) && isWriteToolName(toolName)) {
    return "The user's latest message only restricts actions — no new write was requested.";
  }

  return (
    contradictsReopenBan(lastUserText, toolName, input) ??
    contradictsCloseBan(lastUserText, toolName)
  );
}
