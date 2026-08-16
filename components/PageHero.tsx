import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The header block from the get-started page, factored out so every page wears
 * the same one: status line → display title → lede → actions, all flush left.
 *
 * `size="hero"` is the landing page's full-bleed cut; `size="page"` is one step
 * down for interior pages, which need a title rather than a statement.
 */
export function PageHero({
  status,
  title,
  lede,
  actions,
  size = "page",
  className,
}: {
  /** Lowercase machine-ish label beside the live dot, e.g. `agent / ready`. */
  status: string;
  title: ReactNode;
  lede?: ReactNode;
  actions?: ReactNode;
  size?: "hero" | "page";
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col items-start", className)}>
      <div className="anzen-status-line">
        <span className="anzen-status-dot" />
        <span className="anzen-status-text">{status}</span>
      </div>

      <h1 className={size === "hero" ? "anzen-display" : "anzen-display-sm"}>{title}</h1>

      {lede && <p className="anzen-lede">{lede}</p>}

      {actions && <div className="mt-8 flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}

/** The arrow that trails every primary call to action. */
export function CtaArrow() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
