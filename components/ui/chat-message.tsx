"use client"

import React, { useMemo, useState } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"
import { Ban, ChevronRight, Code2, Loader2, Terminal, Info, MoreHorizontal } from "lucide-react"
import { AnzenLogo } from "@/components/AnzenLogo"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
        true: "w-fit max-w-[92%] rounded-xl rounded-tr-sm bg-muted px-4 py-2.5 text-left text-foreground",
        false: "text-foreground",
      },
      isSystem: {
        true: "text-muted-foreground italic",
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

  const MessageAvatar = () => {
    if (isSystem) {
      return (
        <Avatar className="size-8 shrink-0">
          <AvatarFallback className="text-muted-foreground">
            <Info className="size-3.5" />
          </AvatarFallback>
        </Avatar>
      )
    }
    return (
      <div className="size-8 shrink-0 flex items-center justify-center">
        {isUser ? (
          <Avatar className="size-8">
            <AvatarFallback className="text-[10px] font-semibold bg-muted/40">
              {identity.initials}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="size-5 rounded-full bg-primary" />
        )}
      </div>
    )
  }

  const MessageHeader = () => (
    <div className={cn("mb-1.5 flex items-center gap-2")}>
      <span className="text-sm font-medium">
        {isUser ? (identity.first ?? identity.full) : isSystem ? "System" : "Anzen"}
      </span>
      <span className="text-muted-foreground text-xs tabular-nums">{formattedTime}</span>
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
        isSystem && "opacity-80"
      )}
    >
      <MessageAvatar />

      <div className={cn("min-w-0 flex-1")}>
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
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="bg-card ring-foreground/10 w-full overflow-hidden rounded-lg ring-1"
    >
      <CollapsibleTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground w-full justify-start rounded-none"
          />
        }
      >
        <ChevronRight className={cn("transition-transform", isOpen && "rotate-90")} />
        Thought process
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="text-muted-foreground border-t px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
          {part.reasoning}
        </div>
      </CollapsibleContent>
    </Collapsible>
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
            <Badge key={index} variant="outline" className="text-muted-foreground gap-1.5 font-normal">
              <Ban className="size-3" />
              Cancelled <code className="font-mono">{invocation.toolName}</code>
            </Badge>
          )
        }

        switch (invocation.state) {
          case "partial-call":
          case "call":
            return (
              <Badge key={index} variant="outline" className="text-muted-foreground gap-1.5 font-normal">
                <Terminal className="size-3" />
                Running <code className="font-mono">{invocation.toolName}</code>
                <Loader2 className="size-3 animate-spin" />
              </Badge>
            )
          case "result":
            return (
              <div
                key={index}
                className="bg-card ring-foreground/10 w-full overflow-hidden rounded-lg ring-1"
              >
                <div className="text-muted-foreground flex items-center gap-2 border-b px-3 py-2 text-xs font-medium">
                  <Code2 className="size-3.5" />
                  {invocation.toolName} output
                </div>
                <pre className="text-muted-foreground overflow-x-auto px-3 py-2 font-mono text-xs leading-relaxed whitespace-pre-wrap">
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
