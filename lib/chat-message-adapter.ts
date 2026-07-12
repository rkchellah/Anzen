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
  return messages
    .map((message) => {
      const content = getUiMessageText(message);
      if (!content.trim() && message.role !== "user") {
        // Skip assistant messages that are only tool/approval parts
        const hasText = message.parts?.some((p) => p.type === "text" && Boolean((p as { text?: string }).text?.trim()));
        if (!hasText) return null;
      }
      return {
        id: message.id,
        role: message.role,
        content,
        parts: message.parts
          ?.filter((p) => p.type === "text" || p.type === "reasoning")
          .map((p) => {
            if (p.type === "text") return { type: "text" as const, text: p.text };
            if (p.type === "reasoning") {
              const text =
                "text" in p && typeof p.text === "string"
                  ? p.text
                  : "reasoning" in p && typeof (p as { reasoning?: string }).reasoning === "string"
                    ? (p as { reasoning: string }).reasoning
                    : "";
              return { type: "reasoning" as const, reasoning: text };
            }
            return { type: "text" as const, text: "" };
          }),
      } satisfies Message;
    })
    .filter((m): m is Message => m !== null);
}
