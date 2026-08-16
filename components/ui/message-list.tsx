import {
  ChatMessage,
  type ChatMessageProps,
  type Message,
} from "@/components/ui/chat-message"
import { TypingIndicator } from "@/components/ui/typing-indicator"

type AdditionalMessageOptions = Omit<ChatMessageProps, keyof Message>

interface MessageListProps {
  messages: Message[]
  showTimeStamps?: boolean
  isTyping?: boolean
  messageOptions?:
    | AdditionalMessageOptions
    | ((message: Message) => AdditionalMessageOptions)
}

export function MessageList({
  messages,
  showTimeStamps = true,
  isTyping = false,
  messageOptions,
}: MessageListProps) {
  return (
    <div className="space-y-7 overflow-visible sm:space-y-8">
      {messages.map((message, index) => {
        const additionalOptions =
          typeof messageOptions === "function"
            ? messageOptions(message)
            : messageOptions

        return (
          // `group/turn` scopes the hover reveal of the timestamp to one turn.
          <div key={index} className="group/turn">
            <ChatMessage
              showTimeStamp={showTimeStamps}
              {...message}
              {...additionalOptions}
            />
          </div>
        )
      })}
      {isTyping && <TypingIndicator />}
    </div>
  )
}
