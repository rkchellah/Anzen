import type { CSSProperties } from "react";
import type { AnzenTheme } from "@/components/anzen-theme";
import {
  control,
  fontSize,
  fontWeight,
  leading,
  radius,
  space,
  tracking,
  transition,
} from "@/lib/design-tokens";

/**
 * Theme-aware style builders for the recurring UI primitives.
 *
 * These exist so a card, button or eyebrow label is defined once instead of
 * being re-typed at every call site (which is how the spacing drifted).
 */

/** Single danger hue, used for every failure/blocked state. */
export const danger = {
  text: "#f87171",
  border: "rgba(248,113,113,0.35)",
  surface: "rgba(248,113,113,0.10)",
} as const;

export function cardStyle(theme: AnzenTheme): CSSProperties {
  return {
    backgroundColor: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: radius.xl,
  };
}

/** Uppercase section label ("ACTIVE", "COMING SOON", "MONITOR"). */
export function eyebrowStyle(
  theme: AnzenTheme,
  color: string = theme.muted
): CSSProperties {
  return {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    letterSpacing: tracking.eyebrow,
    textTransform: "uppercase",
    color,
    margin: 0,
  };
}

export function headingStyle(theme: AnzenTheme): CSSProperties {
  return {
    fontSize: fontSize.heading,
    fontWeight: fontWeight.bold,
    letterSpacing: tracking.tight,
    lineHeight: leading.tight,
    color: theme.text,
    margin: 0,
  };
}

export function subheadingStyle(theme: AnzenTheme): CSSProperties {
  return {
    fontSize: fontSize.bodyLg,
    color: theme.muted,
    lineHeight: leading.body,
    margin: 0,
  };
}

export function bodyStyle(theme: AnzenTheme): CSSProperties {
  return {
    fontSize: fontSize.body,
    color: theme.muted,
    lineHeight: leading.prose,
    margin: 0,
  };
}

/** Solid accent action. */
export function primaryButtonStyle(theme: AnzenTheme): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: space.xs,
    height: 40,
    padding: `0 ${space.lg}px`,
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    borderRadius: radius.pill,
    background: theme.accent,
    color: "#000",
    border: "none",
    textDecoration: "none",
    fontFamily: "inherit",
    cursor: "pointer",
    transition: `opacity ${transition.fast}`,
  };
}

/** Outlined, lower-emphasis action. */
export function secondaryButtonStyle(theme: AnzenTheme): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: space.xs,
    height: 40,
    padding: `0 ${space.lg}px`,
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
    borderRadius: radius.pill,
    background: "transparent",
    color: theme.muted,
    border: `1px solid ${theme.border}`,
    textDecoration: "none",
    fontFamily: "inherit",
    cursor: "pointer",
    transition: `color ${transition.fast}`,
  };
}

/** Round 36px icon affordance used in both headers. */
export function iconButtonStyle(theme: AnzenTheme): CSSProperties {
  return {
    width: control.iconButton,
    height: control.iconButton,
    borderRadius: radius.pill,
    border: `1px solid ${theme.border}`,
    background: theme.surface2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: theme.muted,
    padding: 0,
    flexShrink: 0,
  };
}

/** Connection/status indicator dot. */
export function statusDotStyle(
  theme: AnzenTheme,
  active: boolean
): CSSProperties {
  return {
    width: control.statusDot,
    height: control.statusDot,
    borderRadius: radius.pill,
    background: active ? theme.accent : theme.subtle,
    display: "block",
    flexShrink: 0,
    boxShadow: active ? `0 0 6px ${theme.accent}` : "none",
  };
}

/** Inline notice band. `tone` picks the accent or danger palette. */
export function noticeStyle(
  theme: AnzenTheme,
  tone: "accent" | "danger"
): CSSProperties {
  const isDanger = tone === "danger";
  return {
    padding: `${space.sm}px ${space.md}px`,
    borderRadius: radius.lg,
    border: `1px solid ${isDanger ? danger.border : `${theme.accent}40`}`,
    background: isDanger ? danger.surface : theme.accentBg,
    color: isDanger ? theme.text : theme.accentText,
    fontSize: fontSize.body,
    lineHeight: leading.body,
  };
}

/** Small inline tag ("Success", "Soon", tool name). */
export function tagStyle(
  theme: AnzenTheme,
  tone: "accent" | "danger" | "neutral" = "neutral"
): CSSProperties {
  const palette =
    tone === "danger"
      ? { color: danger.text, background: danger.surface }
      : tone === "accent"
        ? { color: theme.accentText, background: theme.accentBg }
        : { color: theme.muted, background: theme.surface2 };

  return {
    ...palette,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    padding: `3px ${space.sm}px`,
    borderRadius: radius.pill,
    whiteSpace: "nowrap",
  };
}

/** Centered page column. */
export function containerStyle(maxWidth: number): CSSProperties {
  return {
    maxWidth,
    margin: "0 auto",
    width: "100%",
  };
}
