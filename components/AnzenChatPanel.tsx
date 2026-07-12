"use client";

import type { ReactNode } from "react";
import type { UIMessage } from "ai";
import {
  ChatContainer,
  ChatForm,
  ChatMessages,
} from "@/components/ui/chat";
import { Button } from "@/components/ui/button";
import { MessageInput } from "@/components/ui/message-input";
import { MessageList } from "@/components/ui/message-list";
import { toKitMessages } from "@/lib/chat-message-adapter";
import { cn } from "@/lib/utils";

type AnzenChatPanelProps = {
  messages: UIMessage[];
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  isGenerating: boolean;
  stop?: () => void;
  suggestions?: string[];
  onSuggestion?: (text: string) => void;
  emptyState?: ReactNode;
  toolApprovals?: ReactNode;
  composerNotice?: ReactNode;
  footer?: ReactNode;
  inputDisabled?: boolean;
  placeholder?: string;
  className?: string;
};

/**
 * Anzen-branded chat shell on Blazity shadcn-chatbot-kit primitives.
 * AI SDK v6 messages + Anzen approval UI; kit MessageList / MessageInput for chrome.
 */
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
  footer,
  inputDisabled = false,
  placeholder = "Ask Anzen anything…",
  className,
}: AnzenChatPanelProps) {
  const kitMessages = toKitMessages(messages);
  const isEmpty = messages.length === 0;
  const isTyping = messages.at(-1)?.role === "user" && isGenerating;

  const handleSubmit = (event?: { preventDefault?: () => void }) => {
    event?.preventDefault?.();
    if (inputDisabled || isGenerating) return;
    onSubmit();
  };

  return (
    <ChatContainer className={cn("min-h-0 flex-1 gap-0", className)}>
      {isEmpty ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {emptyState}
          {suggestions.length > 0 && onSuggestion ? (
            <div className="anzen-site-x mx-auto flex max-w-[500px] flex-wrap justify-center gap-2 pb-6">
              {suggestions.map((suggestion) => (
                <Button
                  key={suggestion}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-auto rounded-full border-border bg-transparent px-3.5 py-1.5 text-[12.5px] font-normal text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => onSuggestion(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <ChatMessages messages={kitMessages}>
          <div className="anzen-site-x mx-auto flex w-full max-w-[680px] flex-col gap-4 pt-6">
            <MessageList
              messages={kitMessages}
              isTyping={isTyping}
              showTimeStamps={false}
            />
            {toolApprovals}
          </div>
        </ChatMessages>
      )}

      <div className="anzen-site-x anzen-chat-composer shrink-0 bg-background pt-3">
        <div className="mx-auto max-w-[680px]">
          {composerNotice}
          <ChatForm
            isPending={isGenerating || inputDisabled}
            handleSubmit={handleSubmit}
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
              />
            )}
          </ChatForm>
          {footer}
        </div>
      </div>
    </ChatContainer>
  );
}
