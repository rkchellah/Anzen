"use client"

import React, { useMemo, useState } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"
import { Ban, ChevronRight, Code2, Loader2, Terminal, Info, MoreHorizontal } from "lucide-react"
import { AnzenLogo } from "@/components/AnzenLogo"
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { FilePreview } from "@/components/ui/file-preview"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"

import { resolveDisplayName } from "@/lib/display-name"

const chatBubbleVariants = cva(
  "group/message relative w-full break-words text-[15px] leading-[1.65]",
  {
    variants: {
      isUser: {
        true:
          "w-fit max-w-[92%] rounded-2xl rounded-tr-md border border-border bg-surface-2 px-4 py-2.5 text-left text-foreground",
        false: "text-foreground/90",
      },
      isSystem: {
        true: "text-blue-500/90 italic",
        false: "",
      },
      animation: {
        none: "",
        slide: "duration-300 animate-in fade-in-0",
        scale: "duration-300 animate-in fade-in-0 zoom-in-75",
        fade: "duration-500 animate-in fade-in-0",
      },
    },
    defaultVariants: {
      animation: "fade",
    }
  }
)

type Animation = VariantProps<typeof chatBubbleVariants>["animation"]

/**
 * Structural shapes for the parts this component renders. The AI SDK no longer
 * exports these as standalone types, so they're declared locally.
 */
export type Attachment = {
  name?: string
  contentType?: string
  url: string
}

export type ToolInvocation = {
  state: string
  toolName: string
  args?: Record<string, unknown>
  result?: Record<string, unknown> & { __cancelled?: boolean }
}

export type ReasoningPart = {
  type: string
  text?: string
  reasoning?: string
}

export type MessagePart = {
  type: string
  text?: string
  reasoning?: string
  toolInvocation?: ToolInvocation
}

export interface Message {
  id: string
  role: "user" | "assistant" | "system" | (string & {})
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
  userName?: string
  userEmail?: string
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  createdAt,
  showTimeStamp = false,
  animation = "fade",
  actions,
  experimental_attachments,
  toolInvocations,
  parts,
  userName,
  userEmail,
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
  const isSystem = role === "system"

  const identity = resolveDisplayName(isUser ? userName : "Anzen", isUser ? userEmail : undefined)

  const formattedTime = createdAt?.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })

  const Avatar = () => {
    if (isSystem) {
      return (
        <div className="size-8 rounded-full bg-blue-500/5 border border-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
          <Info size={14} />
        </div>
      )
    }
    return (
      <div className={cn(
        "size-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border border-border/50 transition-colors",
        isUser ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground border-primary/20"
      )}>
        {isUser ? identity.initials : <AnzenLogo size={12} className="text-current" />}
      </div>
    )
  }

  const MessageHeader = () => (
    <div className={cn("mb-1.5 flex items-center gap-2", isUser && "flex-row-reverse")}>
      <span className="text-[14px] font-semibold tracking-[-0.01em] text-foreground">
        {isUser ? (identity.first ?? identity.full) : isSystem ? "System" : "Anzen"}
      </span>
      <span className="text-[12px] tabular-nums text-muted-foreground">{formattedTime}</span>
    </div>
  )

  const renderContent = (text: string) => (
    <div className="relative group/content">
      <MarkdownRenderer>{text}</MarkdownRenderer>
      {actions && (
        <div className="absolute -right-2 top-0 flex space-x-1 rounded-lg border border-border/50 bg-background p-1 text-foreground opacity-0 transition-opacity group-hover/content:opacity-100 shadow-sm">
          {actions}
        </div>
      )}
    </div>
  )

  return (
    <div
      className={cn(
        "mb-7 flex w-full gap-3.5",
        // User turns mirror to the right so the thread reads as a conversation
        // instead of one long left-aligned column.
        isUser && "flex-row-reverse",
        isSystem && "opacity-80"
      )}
    >
      <Avatar />

      <div className={cn("min-w-0 flex-1", isUser && "flex flex-col items-end")}>
        <MessageHeader />
        
        <div className={cn(chatBubbleVariants({ isUser, isSystem, animation }))}>
          {files && files.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {files.map((file, index) => (
                <FilePreview file={file} key={index} />
              ))}
            </div>
          )}

          {parts && parts.length > 0 ? (
            <div className="space-y-4">
              {parts.map((part, index) => {
                if (part.type === "text") {
                  return <div key={`text-${index}`}>{renderContent(part.text ?? "")}</div>
                } else if (part.type === "reasoning") {
                  return <ReasoningBlock key={`reasoning-${index}`} part={part} />
                } else if (part.type === "tool-invocation" && part.toolInvocation) {
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
          ) : toolInvocations && toolInvocations.length > 0 ? (
            <ToolCall toolInvocations={toolInvocations} />
          ) : (
            renderContent(content)
          )}
        </div>
      </div>
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
    <div className="flex flex-col items-start w-full">
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="group w-full overflow-hidden rounded-lg border border-border/40 bg-card/30 transition-colors"
      >
        <div className="flex items-center p-2">
          <CollapsibleTrigger render={<button className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground/40 hover:text-foreground/60 transition-colors" />}>
            <ChevronRight className="h-2.5 w-2.5 transition-transform group-data-[state=open]:rotate-90" />
            <span>Thought Process</span>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="border-t border-border/20 p-3 text-[12px] text-muted-foreground/70 whitespace-pre-wrap leading-relaxed">
            {part.reasoning}
          </div>
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
    <div className="flex flex-col items-start gap-2 mt-2">
      {toolInvocations.map((invocation, index) => {
        const isCancelled =
          invocation.state === "result" &&
          invocation.result?.__cancelled === true

        if (isCancelled) {
          return (
            <div
              key={index}
              className="flex items-center gap-2 rounded-lg border border-border bg-muted/10 px-3 py-1.5 font-mono text-[11px] text-muted-foreground/50"
            >
              <Ban className="h-3 w-3" />
              <span>
                CANCELLED <code className="font-mono">{invocation.toolName}</code>
              </span>
            </div>
          )
        }

        switch (invocation.state) {
          case "partial-call":
          case "call":
            return (
              <div
                key={index}
                className="flex items-center gap-2 rounded-lg border border-border bg-muted/10 px-3 py-1.5 font-mono text-[11px] text-muted-foreground/50"
              >
                <Terminal className="h-3 w-3" />
                <span>
                  RUNNING <code className="font-mono">{invocation.toolName}</code>
                </span>
                <Loader2 className="h-3 w-3 animate-spin" />
              </div>
            )
          case "result":
            return (
              <div
                key={index}
                className="flex flex-col gap-1.5 rounded-lg border border-border bg-card/40 px-3 py-2 text-[12px] w-full"
              >
                <div className="flex items-center gap-2 text-muted-foreground/40 border-b border-border/10 pb-1 mb-1">
                  <Code2 className="h-3 w-3" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest">
                    {invocation.toolName} Output
                  </span>
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap text-foreground/70 font-mono text-[11px] leading-relaxed">
                  {JSON.stringify(invocation.result, null, 2)}
                </pre>
              </div>
            )
          default:
            return null
        }
      })}
    </div>
  )
}
