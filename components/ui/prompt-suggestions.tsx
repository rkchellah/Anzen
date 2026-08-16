export type PromptSuggestion = {
  /** Short source tag, e.g. `GitHub`. */
  label: string
  prompt: string
}

interface PromptSuggestionsProps {
  append: (message: { role: "user"; content: string }) => void
  suggestions: PromptSuggestion[]
  /** First name, when we know it — the opener is addressed, not broadcast. */
  name?: string
}

/**
 * The empty thread.
 *
 * The suggestions are sized to their own content and stacked, not stretched
 * across the reading column: a full-width row puts the source, the prompt and
 * the arrow at three distant edges with dead space between them, which is the
 * thing that reads as filler. At content width the three parts stay one object.
 */
export function PromptSuggestions({
  append,
  suggestions,
  name,
}: PromptSuggestionsProps) {
  return (
    <div className="anzen-scroll flex h-full flex-col justify-center overflow-y-auto px-1 py-8">
      <div className="anzen-read-col">
        <div className="anzen-status-line">
          <span className="anzen-status-dot" />
          <span className="anzen-status-text">agent / idle</span>
        </div>

        <h2 className="m-0 text-[1.75rem] leading-[1.05] font-extrabold tracking-[-0.04em] text-[var(--anzen-text)]">
          {name ? `Ready when you are, ${name}.` : "Ready when you are."}
        </h2>

        <p className="anzen-lede mt-3 max-w-[42ch]">
          Anzen can read your GitHub, Gmail and Slack. It asks before it writes
          anything.
        </p>

        {suggestions.length > 0 && (
          <div className="mt-8 flex flex-col items-start gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.prompt}
                type="button"
                onClick={() =>
                  append({ role: "user", content: suggestion.prompt })
                }
                className="group flex max-w-full items-center gap-2.5 rounded-[10px] border border-[var(--anzen-border)] bg-[var(--anzen-surface)] py-2 pr-3 pl-2.5 text-left transition-colors hover:border-[color-mix(in_oklab,var(--anzen-accent)_32%,var(--anzen-border))] hover:bg-[var(--anzen-surface-2)]"
              >
                <span className="anzen-ordinal shrink-0 tracking-[0.08em] uppercase transition-colors group-hover:text-[var(--anzen-accent-text)]">
                  {suggestion.label}
                </span>
                <span className="h-3.5 w-px shrink-0 bg-[var(--anzen-border)]" />
                <span className="truncate text-[13px] text-[var(--anzen-muted)] transition-colors group-hover:text-[var(--anzen-text)]">
                  {suggestion.prompt}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
