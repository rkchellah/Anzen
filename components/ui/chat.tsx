"use client"

import {
  forwardRef,
  useCallback,
  useRef,
  useState,
  type ReactElement,
} from "react"
import { ArrowDown, ThumbsDown, ThumbsUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { useAutoScroll } from "@/hooks/use-auto-scroll"
import { Button } from "@/components/ui/button"
import { type Message } from "@/components/ui/chat-message"
import { CopyButton } from "@/components/ui/copy-button"
import { MessageInput } from "@/components/ui/message-input"
import { MessageList } from "@/components/ui/message-list"
import {
  PromptSuggestions,
  type PromptSuggestion,
} from "@/components/ui/prompt-suggestions"

interface ChatPropsBase {
  handleSubmit: (
    event?: { preventDefault?: () => void },
    options?: { experimental_attachments?: FileList }
  ) => void
  messages: Array<Message>
  input: string
  className?: string
  handleInputChange: React.ChangeEventHandler<HTMLTextAreaElement>
  isGenerating: boolean
  stop?: () => void
  onRateResponse?: (
    messageId: string,
    rating: "thumbs-up" | "thumbs-down"
  ) => void
  setMessages?: (messages: any[]) => void
  transcribeAudio?: (blob: Blob) => Promise<string>
  /** Greeted in the empty state when known. */
  userName?: string
}

interface ChatPropsWithoutSuggestions extends ChatPropsBase {
  append?: never
  suggestions?: never
}

interface ChatPropsWithSuggestions extends ChatPropsBase {
  append: (message: { role: "user"; content: string }) => void
  suggestions: PromptSuggestion[]
}

type ChatProps = ChatPropsWithoutSuggestions | ChatPropsWithSuggestions

export function Chat({
  messages,
  handleSubmit,
  input,
  handleInputChange,
  stop,
  isGenerating,
  append,
  suggestions,
  className,
  onRateResponse,
  setMessages,
  transcribeAudio,
  userName,
}: ChatProps) {
  const lastMessage = messages.at(-1)
  const isEmpty = messages.length === 0
  const isTyping = lastMessage?.role === "user"

  const messagesRef = useRef(messages)
  messagesRef.current = messages

  // Enhanced stop function that marks pending tool calls as cancelled
  const handleStop = useCallback(() => {
    stop?.()

    if (!setMessages) return

    const latestMessages = [...messagesRef.current]
    const lastAssistantMessage = latestMessages.findLast(
      (m) => m.role === "assistant"
    )

    if (!lastAssistantMessage) return

    let needsUpdate = false
    let updatedMessage = { ...lastAssistantMessage }

    if (lastAssistantMessage.toolInvocations) {
      const updatedToolInvocations = lastAssistantMessage.toolInvocations.map(
        (toolInvocation) => {
          if (toolInvocation.state === "call") {
            needsUpdate = true
            return {
              ...toolInvocation,
              state: "result",
              result: {
                content: "Tool execution was cancelled",
                __cancelled: true, // Special marker to indicate cancellation
              },
            } as const
          }
          return toolInvocation
        }
      )

      if (needsUpdate) {
        updatedMessage = {
          ...updatedMessage,
          toolInvocations: updatedToolInvocations,
        }
      }
    }

    if (lastAssistantMessage.parts && lastAssistantMessage.parts.length > 0) {
      const updatedParts = lastAssistantMessage.parts.map((part: any) => {
        if (
          part.type === "tool-invocation" &&
          part.toolInvocation &&
          part.toolInvocation.state === "call"
        ) {
          needsUpdate = true
          return {
            ...part,
            toolInvocation: {
              ...part.toolInvocation,
              state: "result",
              result: {
                content: "Tool execution was cancelled",
                __cancelled: true,
              },
            },
          }
        }
        return part
      })

      if (needsUpdate) {
        updatedMessage = {
          ...updatedMessage,
          parts: updatedParts,
        }
      }
    }

    if (needsUpdate) {
      const messageIndex = latestMessages.findIndex(
        (m) => m.id === lastAssistantMessage.id
      )
      if (messageIndex !== -1) {
        latestMessages[messageIndex] = updatedMessage
        setMessages(latestMessages)
      }
    }
  }, [stop, setMessages, messagesRef])

  const messageOptions = useCallback(
    (message: Message) => ({
      actions: onRateResponse ? (
        <>
          <div className="border-r pr-1">
            <CopyButton
              content={message.content}
              copyMessage="Copied response to clipboard!"
            />
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => onRateResponse(message.id, "thumbs-up")}
          >
            <ThumbsUp className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => onRateResponse(message.id, "thumbs-down")}
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <CopyButton
          content={message.content}
          copyMessage="Copied response to clipboard!"
        />
      ),
    }),
    [onRateResponse]
  )

  return (
    <ChatContainer className={cn("gap-0", className)}>
      {isEmpty && append && suggestions ? (
        <PromptSuggestions
          append={append}
          suggestions={suggestions}
          name={userName}
        />
      ) : null}

      {messages.length > 0 ? (
        <ChatMessages messages={messages}>
          <MessageList
            messages={messages}
            isTyping={isTyping}
            messageOptions={messageOptions}
          />
        </ChatMessages>
      ) : null}

      <ChatForm
        className="relative mt-auto shrink-0 pt-3 pb-5"
        isPending={isGenerating || isTyping}
        handleSubmit={handleSubmit}
      >
        {({ files, setFiles }) => (
          <>
            {/* Transcript dissolves into the composer instead of butting against it. */}
            <div className="anzen-composer-fade" aria-hidden />
            <div className="anzen-read-col">
              <MessageInput
                value={input}
                onChange={handleInputChange}
                allowAttachments
                files={files}
                setFiles={setFiles}
                stop={handleStop}
                isGenerating={isGenerating}
                transcribeAudio={transcribeAudio}
                placeholder="Message Anzen…"
              />
            </div>
          </>
        )}
      </ChatForm>
    </ChatContainer>
  )
}
Chat.displayName = "Chat"

export function ChatMessages({
  messages,
  children,
}: React.PropsWithChildren<{
  messages: Message[]
}>) {
  const {
    containerRef,
    scrollToBottom,
    handleScroll,
    shouldAutoScroll,
    handleTouchStart,
  } = useAutoScroll([messages])

  return (
    <div
      // `safe end` keeps a short thread sitting just above the composer instead
      // of stranding it at the top of a tall scroller — and `safe` means a long
      // thread still starts from the top rather than clipping its own head.
      className="anzen-scroll grid grid-cols-1 [align-content:safe_end] overflow-y-auto px-1 pt-6 pb-6"
      ref={containerRef}
      onScroll={handleScroll}
      onTouchStart={handleTouchStart}
    >
      {/* No `max-w-full` here — as a utility it outranks the reading column's
          max-width and stretches the transcript across the whole viewport. */}
      <div className="anzen-read-col [grid-column:1/1] [grid-row:1/1]">
        {children}
      </div>

      {!shouldAutoScroll && (
        <div className="pointer-events-none flex flex-1 items-end justify-center [grid-column:1/1] [grid-row:1/1]">
          <div className="sticky bottom-2 flex w-full justify-center">
            <Button
              onClick={scrollToBottom}
              aria-label="Scroll to latest message"
              className="pointer-events-auto size-9 rounded-full border border-border bg-card text-foreground shadow-[var(--anzen-elev-2)] ease-in-out animate-in fade-in-0 slide-in-from-bottom-1 hover:bg-muted"
              size="icon"
              variant="ghost"
            >
              <ArrowDown className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export const ChatContainer = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("grid max-h-full w-full grid-rows-[1fr_auto]", className)}
      {...props}
    />
  )
})
ChatContainer.displayName = "ChatContainer"

interface ChatFormProps {
  className?: string
  isPending: boolean
  handleSubmit: (
    event?: { preventDefault?: () => void },
    options?: { experimental_attachments?: FileList }
  ) => void
  children: (props: {
    files: File[] | null
    setFiles: React.Dispatch<React.SetStateAction<File[] | null>>
  }) => ReactElement
}

export const ChatForm = forwardRef<HTMLFormElement, ChatFormProps>(
  ({ children, handleSubmit, isPending, className }, ref) => {
    const [files, setFiles] = useState<File[] | null>(null)

    const onSubmit = (event: React.FormEvent) => {
      if (!files) {
        handleSubmit(event)
        return
      }

      const fileList = createFileList(files)
      handleSubmit(event, { experimental_attachments: fileList })
      setFiles(null)
    }

    return (
      <form ref={ref} onSubmit={onSubmit} className={className}>
        {children({ files, setFiles })}
      </form>
    )
  }
)
ChatForm.displayName = "ChatForm"

function createFileList(files: File[] | FileList): FileList {
  const dataTransfer = new DataTransfer()
  for (const file of Array.from(files)) {
    dataTransfer.items.add(file)
  }
  return dataTransfer.files
}
