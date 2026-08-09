"use client";

import type { ReactNode } from "react";
import type { UIMessage } from "ai";
import {
  ChatForm,
  ChatMessages,
} from "@/components/ui/chat";
import { Card, CardContent } from "@/components/ui/card";
import { MessageInput } from "@/components/ui/message-input";
import { MessageList } from "@/components/ui/message-list";
import { toKitMessages } from "@/lib/chat-message-adapter";
import { transcribeAudio } from "@/lib/transcribe-audio";
import { cn } from "@/lib/utils";

export type ChatSuggestion = {
  label: string;
  prompt: string;
};

type AnzenChatPanelProps = {
  messages: UIMessage[];
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  isGenerating: boolean;
  stop?: () => void;
  suggestions?: ChatSuggestion[];
  onSuggestion?: (text: string) => void;
  emptyState?: ReactNode;
  toolApprovals?: ReactNode;
  composerNotice?: ReactNode;
  /** Model indicator / switcher shown inside the composer. */
  modelSelector?: ReactNode;
  footer?: ReactNode;
  inputDisabled?: boolean;
  placeholder?: string;
  className?: string;
  userName?: string;
  userEmail?: string;
};

export function AnzenChatPanel({
  messages,
  input,
  onInputChange,
  onSubmit,
  isGenerating,
  stop,
  suggestions = [],
  onSuggestion,
  emptyState,
  toolApprovals,
  composerNotice,
  modelSelector,
  footer,
  inputDisabled = false,
  placeholder = "Message Anzen…",
  className,
  userName,
  userEmail,
}: AnzenChatPanelProps) {
  const kitMessages = toKitMessages(messages);
  const isEmpty = messages.length === 0;
  const isTyping = messages.at(-1)?.role === "user" && isGenerating;

  const handleSubmit = (event?: { preventDefault?: () => void }) => {
    event?.preventDefault?.();
    if (inputDisabled || isGenerating) return;
    onSubmit();
  };

  // Same measure as the Connections / Activity pages so the app reads as one grid.
  const columnWidth = "w-full max-w-4xl";

  const suggestionRow = isEmpty && !inputDisabled && !isGenerating && suggestions.length > 0 && (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion.prompt}
          type="button"
          onClick={() => onSuggestion?.(suggestion.prompt)}
          className="group cursor-pointer text-left"
        >
          <Card size="sm" className="hover:bg-muted/40 h-full transition-colors">
            <CardContent>
              <span className="text-primary mb-1.5 block text-xs font-medium tracking-wide uppercase">
                {suggestion.label}
              </span>
              <p className="text-muted-foreground group-hover:text-foreground text-sm transition-colors">
                {suggestion.prompt}
              </p>
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  );

  const composer = (
    <div className="mx-auto w-full max-w-3xl shrink-0 px-4">
      {composerNotice}
      <ChatForm
        isPending={isGenerating || inputDisabled}
        handleSubmit={handleSubmit}
        className="overflow-hidden rounded-xl border border-border/10 bg-card shadow-2xl transition-all"
      >
        {() => (
          <div className="flex flex-col">
            <MessageInput
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              allowAttachments={false}
              stop={stop}
              isGenerating={isGenerating}
              disabled={inputDisabled}
              placeholder={placeholder}
              transcribeAudio={transcribeAudio}
              minimalist={true}
              className="min-h-[70px] w-full border-none bg-transparent px-8 py-6 text-[15px] leading-relaxed shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/40"
            />
            <div className="flex items-center justify-between px-6 pb-4 pt-0">
              <div className="flex items-center gap-2">{modelSelector}</div>
            </div>
          </div>
        )}
      </ChatForm>
      
      {footer ? <div className="mt-3 text-center">{footer}</div> : null}
    </div>
  );

  return (
    <div className={cn("flex h-full w-full min-h-0 flex-1 flex-col bg-background", className)}>
      <div className="flex-1 min-h-0 flex flex-col w-full overflow-hidden">
        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6">
            <div className={cn(columnWidth, "flex flex-col items-center gap-8")}>
              {emptyState}
              <div className="w-full">{composer}</div>
              {suggestionRow && (
                <div className="mx-auto w-full max-w-3xl px-4">{suggestionRow}</div>
              )}
            </div>
          </div>
        ) : (
          <>
            <ChatMessages messages={kitMessages} className="items-start">
              <div className="flex w-full flex-col gap-2 pl-12 pr-4 pb-8 pt-12">
                <MessageList
                  messages={kitMessages}
                  isTyping={isTyping}
                  showTimeStamps={false}
                  messageOptions={(msg) => ({
                    userName: msg.role === "user" ? userName : undefined,
                    userEmail: msg.role === "user" ? userEmail : undefined,
                  })}
                />
                {toolApprovals}
              </div>
            </ChatMessages>
            <div className="flex w-full shrink-0 justify-center px-4 pb-6 pt-2">
              {composer}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
