"use client";

import type { ReactNode } from "react";
import type { UIMessage } from "ai";
import {
  ChatForm,
  ChatMessages,
} from "@/components/ui/chat";
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

  const columnWidth = "w-full max-w-[720px] mx-auto";

  const suggestionRow = isEmpty && !inputDisabled && !isGenerating && suggestions.length > 0 && (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion.prompt}
          type="button"
          onClick={() => onSuggestion?.(suggestion.prompt)}
          className="anzen-card anzen-card-interactive group p-4 text-left"
        >
          <span className="anzen-eyebrow mb-2 block text-accent-foreground">
            {suggestion.label}
          </span>
          <p className="text-[14px] leading-[1.55] text-muted-foreground transition-colors group-hover:text-foreground">
            {suggestion.prompt}
          </p>
        </button>
      ))}
    </div>
  );

  const composer = (
    <div className={cn("mx-auto shrink-0", columnWidth)}>
      {composerNotice}
      <ChatForm
        isPending={isGenerating || inputDisabled}
        handleSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl border border-border bg-surface-2 shadow-[0_12px_40px_rgba(0,0,0,0.25)] transition-all focus-within:border-primary/40"
      >
        {() => (
          <MessageInput
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            allowAttachments={false}
            stop={stop}
            isGenerating={isGenerating}
            disabled={inputDisabled}
            placeholder={placeholder}
            transcribeAudio={transcribeAudio}
            className="min-h-[68px] rounded-none border-none bg-transparent px-5 py-4 text-[15px] leading-[1.55] shadow-none backdrop-blur-none focus-visible:border-transparent focus-visible:bg-transparent"
          />
        )}
      </ChatForm>
      {modelSelector ? (
        <div className="mt-2.5 flex justify-center">{modelSelector}</div>
      ) : null}
      {footer ? <div className="mt-3 text-center">{footer}</div> : null}
    </div>
  );

  return (
    <div className={cn("flex h-full w-full min-h-0 flex-1 flex-col bg-background", className)}>
      <div className="flex-1 min-h-0 flex flex-col w-full overflow-hidden">
        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6">
            <div className={cn(columnWidth, "flex flex-col")}>
              <div className="mb-12 text-center">{emptyState}</div>
              {suggestionRow}
            </div>
          </div>
        ) : (
          <ChatMessages messages={kitMessages} className="items-center">
            <div className={cn("flex w-full flex-col gap-2 px-4 pb-8 pt-10", columnWidth)}>
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
        )}
      </div>

      <div className="flex w-full shrink-0 justify-center px-4 pb-6 pt-2">
        {composer}
      </div>
    </div>
  );
}
