import type { UIMessage } from "ai";
import type { Message } from "@/components/ui/chat-message";

/** Extract plain text from an AI SDK UIMessage. */
export function getUiMessageText(message: UIMessage): string {
  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("");
  }
  return "";
}

/**
 * Convert AI SDK v6 UIMessages into shadcn-chatbot-kit Message shapes
 * for MessageList / ChatMessage rendering.
 */
export function toKitMessages(messages: UIMessage[]): Message[] {
  const result: Message[] = [];

  for (const message of messages) {
    const content = getUiMessageText(message);
    const hasText = message.parts?.some(
      (p) => p.type === "text" && Boolean((p as { text?: string }).text?.trim())
    );

    if (!content.trim() && message.role !== "user" && !hasText) {
      continue;
    }

    const parts: Message["parts"] = [];
    for (const p of message.parts ?? []) {
      if (p.type === "text") {
        parts.push({ type: "text", text: p.text });
      } else if (p.type === "reasoning") {
        const text =
          "text" in p && typeof p.text === "string"
            ? p.text
            : "reasoning" in p && typeof (p as { reasoning?: string }).reasoning === "string"
              ? (p as { reasoning: string }).reasoning
              : "";
        parts.push({ type: "reasoning", reasoning: text });
      }
    }

    result.push({
      id: message.id,
      role: message.role,
      content,
      parts: parts.length > 0 ? parts : undefined,
    });
  }

  return result;
}
