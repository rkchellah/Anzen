"use client"

import React, { useMemo, useState } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"
import { Ban, ChevronRight, Code2, Loader2, Terminal } from "lucide-react"

import { cn } from "@/lib/utils"
import { AnzenLogo } from "@/components/AnzenLogo"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { FilePreview } from "@/components/ui/file-preview"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"

const chatBubbleVariants = cva(
  "group/message relative break-words text-[15px] leading-[1.7]",
  {
    variants: {
      isUser: {
        // Tinted accent rather than a solid block: reads as the brand colour
        // without turning every user turn into a slab of green.
        true: "max-w-[min(88%,34rem)] rounded-2xl rounded-br-sm border border-primary/25 bg-primary/12 px-4 py-2.5 text-foreground shadow-[var(--anzen-elev-1)]",
        // The assistant turn is the page's main content — no card around it, so
        // long answers read as a document instead of a boxed-in receipt.
        false: "w-full max-w-none text-foreground",
      },
      animation: {
        none: "",
        slide: "duration-300 animate-in fade-in-0",
        scale: "duration-300 animate-in fade-in-0 zoom-in-95",
        fade: "duration-500 animate-in fade-in-0",
      },
    },
    compoundVariants: [
      {
        isUser: true,
        animation: "slide",
        class: "slide-in-from-right-2",
      },
      {
        isUser: false,
        animation: "slide",
        class: "slide-in-from-left-2",
      },
      {
        isUser: true,
        animation: "scale",
        class: "origin-bottom-right",
      },
      {
        isUser: false,
        animation: "scale",
        class: "origin-bottom-left",
      },
    ],
  }
)

type Animation = VariantProps<typeof chatBubbleVariants>["animation"]

interface Attachment {
  name?: string
  contentType?: string
  url: string
}

interface PartialToolCall {
  state: "partial-call"
  toolName: string
}

interface ToolCall {
  state: "call"
  toolName: string
}

interface ToolResult {
  state: "result"
  toolName: string
  result: {
    __cancelled?: boolean
    [key: string]: any
  }
}

type ToolInvocation = PartialToolCall | ToolCall | ToolResult

interface ReasoningPart {
  type: "reasoning"
  reasoning: string
}

interface ToolInvocationPart {
  type: "tool-invocation"
  toolInvocation: ToolInvocation
}

interface TextPart {
  type: "text"
  text: string
}

// For compatibility with AI SDK types, not used
interface SourcePart {
  type: "source"
  source?: any
}

interface FilePart {
  type: "file"
  mimeType: string
  data: string
}

interface StepStartPart {
  type: "step-start"
}

type MessagePart =
  | TextPart
  | ReasoningPart
  | ToolInvocationPart
  | SourcePart
  | FilePart
  | StepStartPart

export interface Message {
  id: string
  role: "user" | "assistant" | (string & {})
  content: string
  createdAt?: Date
  experimental_attachments?: Attachment[]
  toolInvocations?: ToolInvocation[]
  parts?: MessagePart[]
}

export interface ChatMessageProps extends Message {
  showTimeStamp?: boolean
  animation?: Animation
  actions?: React.ReactNode
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  createdAt,
  showTimeStamp = false,
  animation = "scale",
  actions,
  experimental_attachments,
  toolInvocations,
  parts,
}) => {
  const files = useMemo(() => {
    return experimental_attachments?.map((attachment) => {
      const dataArray = dataUrlToUint8Array(attachment.url)
      const file = new File([dataArray], attachment.name ?? "Unknown", {
        type: attachment.contentType,
      })
      return file
    })
  }, [experimental_attachments])

  const isUser = role === "user"

  const formattedTime = createdAt?.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })

  if (isUser) {
    return (
      <div className="flex w-full flex-col items-end gap-1.5">
        {files ? (
          <div className="mb-1 flex flex-wrap justify-end gap-2">
            {files.map((file, index) => {
              return <FilePreview file={file} key={index} />
            })}
          </div>
        ) : null}

        <div className={cn(chatBubbleVariants({ isUser, animation }))}>
          <MarkdownRenderer>{content}</MarkdownRenderer>
        </div>

        {showTimeStamp && createdAt ? (
          <time
            dateTime={createdAt.toISOString()}
            className="px-1 text-[11px] tabular-nums text-muted-foreground/70 opacity-0 transition-opacity group-hover/turn:opacity-100"
          >
            {formattedTime}
          </time>
        ) : null}
      </div>
    )
  }

  if (parts && parts.length > 0) {
    return (
      <div className="flex w-full gap-3.5 sm:gap-4">
        <AssistantAvatar />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {parts.map((part, index) => {
            if (part.type === "text") {
              // Models routinely open a part with blank lines. `p` renders with
              // `whitespace-pre-wrap`, so those arrive as real vertical space —
              // strip the leading run, leave the streaming tail alone.
              const text = part.text.replace(/^\s+/, "")
              if (text === "") return null
              return (
                <div
                  className="flex flex-col items-start gap-1.5"
                  key={`text-${index}`}
                >
                  <div className={cn(chatBubbleVariants({ isUser, animation }))}>
                    <MarkdownRenderer>{text}</MarkdownRenderer>
                    {actions ? <MessageActions>{actions}</MessageActions> : null}
                  </div>
                </div>
              )
            } else if (part.type === "reasoning") {
              return <ReasoningBlock key={`reasoning-${index}`} part={part} />
            } else if (part.type === "tool-invocation") {
              return (
                <ToolCall
                  key={`tool-${index}`}
                  toolInvocations={[part.toolInvocation]}
                />
              )
            }
            return null
          })}
        </div>
      </div>
    )
  }

  if (toolInvocations && toolInvocations.length > 0) {
    return <ToolCall toolInvocations={toolInvocations} />
  }

  return (
    <div className="flex w-full gap-3.5 sm:gap-4">
      <AssistantAvatar />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className={cn(chatBubbleVariants({ isUser, animation }))}>
          <MarkdownRenderer>{content.replace(/^\s+/, "")}</MarkdownRenderer>
          {actions ? <MessageActions>{actions}</MessageActions> : null}
        </div>

        {showTimeStamp && createdAt ? (
          <time
            dateTime={createdAt.toISOString()}
            className="text-[11px] tabular-nums text-muted-foreground/70 opacity-0 transition-opacity group-hover/turn:opacity-100"
          >
            {formattedTime}
          </time>
        ) : null}
      </div>
    </div>
  )
}

/** Brand mark that anchors every assistant turn to the left rail. */
function AssistantAvatar() {
  return (
    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-card shadow-[var(--anzen-elev-1)]">
      <AnzenLogo size={18} className="size-[18px]" />
    </div>
  )
}

/**
 * Copy / rating controls. The assistant turn has no card to hang off any more,
 * so they sit inline below the text and only surface on hover.
 */
function MessageActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 flex space-x-1 rounded-lg border border-border bg-card p-1 text-foreground opacity-0 shadow-[var(--anzen-elev-1)] transition-opacity focus-within:opacity-100 group-hover/message:opacity-100">
      {children}
    </div>
  )
}

function dataUrlToUint8Array(data: string) {
  const base64 = data.split(",")[1]
  const buf = Buffer.from(base64, "base64")
  return new Uint8Array(buf)
}

const ReasoningBlock = ({ part }: { part: ReasoningPart }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="flex w-full flex-col items-start">
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="group w-full overflow-hidden rounded-xl border border-border bg-muted/40"
      >
        <div className="flex items-center px-2.5 py-2">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground">
              <ChevronRight className="size-3.5 transition-transform group-data-[state=open]:rotate-90" />
              <span>Thinking</span>
            </button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent forceMount>
          <motion.div
            initial={false}
            animate={isOpen ? "open" : "closed"}
            variants={{
              open: { height: "auto", opacity: 1 },
              closed: { height: 0, opacity: 0 },
            }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="border-t border-border"
          >
            <div className="px-3 py-2.5">
              <div className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                {part.reasoning}
              </div>
            </div>
          </motion.div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

function ToolCall({
  toolInvocations,
}: Pick<ChatMessageProps, "toolInvocations">) {
  if (!toolInvocations?.length) return null

  return (
    <div className="flex flex-col items-start gap-2">
      {toolInvocations.map((invocation, index) => {
        const isCancelled =
          invocation.state === "result" &&
          invocation.result.__cancelled === true

        if (isCancelled) {
          return (
            <div key={index} className={cn(toolChipClass, "text-muted-foreground")}>
              <Ban className="size-3.5 shrink-0" />
              <span>
                Cancelled <ToolName name={invocation.toolName} />
              </span>
            </div>
          )
        }

        switch (invocation.state) {
          case "partial-call":
          case "call":
            return (
              <div key={index} className={cn(toolChipClass, "text-muted-foreground")}>
                <Terminal className="size-3.5 shrink-0" />
                <span>
                  Calling <ToolName name={invocation.toolName} />
                </span>
                <Loader2 className="size-3 shrink-0 animate-spin text-primary" />
              </div>
            )
          case "result":
            return (
              <details
                key={index}
                className="group/tool w-full overflow-hidden rounded-xl border border-border bg-muted/40"
              >
                <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground">
                  <Code2 className="size-3.5 shrink-0" />
                  <span>
                    Result from <ToolName name={invocation.toolName} />
                  </span>
                  <ChevronRight className="ml-auto size-3.5 shrink-0 transition-transform group-open/tool:rotate-90" />
                </summary>
                <pre className="anzen-scroll max-h-72 overflow-auto border-t border-border px-3 py-2.5 text-xs leading-relaxed whitespace-pre-wrap text-foreground">
                  {JSON.stringify(invocation.result, null, 2)}
                </pre>
              </details>
            )
          default:
            return null
        }
      })}
    </div>
  )
}

/** Chip shell shared by the in-flight / cancelled tool states. */
const toolChipClass =
  "flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium"

function ToolName({ name }: { name: string }) {
  return (
    <span className="rounded-md bg-background/60 px-1.5 py-0.5 font-mono text-[11px] text-foreground">
      {name}
    </span>
  )
}
