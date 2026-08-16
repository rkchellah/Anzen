import { AnzenLogo } from "@/components/AnzenLogo"

/**
 * Sits on the same left rail as an assistant turn, so the answer doesn't jump
 * sideways the moment the first token lands.
 */
export function TypingIndicator() {
  return (
    <div className="flex w-full gap-3.5 sm:gap-4">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-card shadow-[var(--anzen-elev-1)]">
        <AnzenLogo size={18} className="size-[18px]" />
      </div>
      <div className="flex items-center gap-1.5 pt-3">
        {[0, 120, 240].map((delay) => (
          <span
            key={delay}
            className="size-1.5 rounded-full bg-muted-foreground/60 animate-typing-dot-bounce"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  )
}
