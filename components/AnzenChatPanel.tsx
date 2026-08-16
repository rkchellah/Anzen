"use client";

import type { ReactNode } from "react";
import type { UIMessage } from "ai";
import { Chat } from "@/components/ui/chat";
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
  toolApprovals?: ReactNode;
  composerNotice?: ReactNode;
  className?: string;
  /** First name, greeted in the empty thread. */
  userName?: string;
};

/**
 * Blazity DemoChat layout — stock `Chat` filling the column.
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
  toolApprovals,
  composerNotice,
  className,
  userName,
}: AnzenChatPanelProps) {
  const kitMessages = toKitMessages(messages);

  const handleSubmit = (event?: { preventDefault?: () => void }) => {
    event?.preventDefault?.();
    onSubmit();
  };

  const handleInputChange: React.ChangeEventHandler<HTMLTextAreaElement> = (
    event
  ) => {
    onInputChange(event.target.value);
  };

  const chatProps = {
    className: "min-h-0 flex-1",
    messages: kitMessages,
    handleSubmit,
    input,
    handleInputChange,
    isGenerating,
    stop,
    transcribeAudio,
    userName,
  } as const;

  return (
    <div className={cn("flex h-full min-h-0 w-full flex-col", className)}>
      {/* Notices and approval gates share the transcript's reading column so
          nothing in the thread is left hanging at a different width. */}
      {(composerNotice || toolApprovals) && (
        <div className="anzen-read-col flex shrink-0 flex-col gap-2 pt-3">
          {composerNotice}
          {toolApprovals}
        </div>
      )}

      {onSuggestion && suggestions.length > 0 ? (
        <Chat
          {...chatProps}
          append={(message) => onSuggestion(message.content)}
          suggestions={suggestions}
        />
      ) : (
        <Chat {...chatProps} />
      )}
    </div>
  );
}
