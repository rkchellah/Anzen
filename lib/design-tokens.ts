/**
 * Anzen design scale.
 *
 * Every spacing, size and radius in the UI resolves to one of these steps so
 * values can't drift into arbitrary in-between numbers. Colours live in
 * `components/anzen-theme.ts`; this file is palette-agnostic.
 */

/** 4px baseline grid. */
export const space = {
  none: 0,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  section: 48,
} as const;

/** Type ramp. No fractional sizes — they read as accidental. */
export const fontSize = {
  micro: 11,
  caption: 12,
  small: 13,
  body: 14,
  bodyLg: 15,
  lead: 16,
  title: 20,
  heading: 26,
  display: 32,
} as const;

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  heavy: 800,
} as const;

export const radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 14,
  pill: 999,
} as const;

/** Negative tracking for headings, positive for uppercase eyebrows. */
export const tracking = {
  tighter: "-0.04em",
  tight: "-0.03em",
  snug: "-0.02em",
  normal: "-0.01em",
  wide: "0.02em",
  wider: "0.04em",
  eyebrow: "0.08em",
  eyebrowWide: "0.1em",
} as const;

export const leading = {
  display: 1,
  hero: 1.1,
  tight: 1.3,
  ui: 1.4,
  body: 1.5,
  prose: 1.6,
} as const;

/** Fixed control sizes: min 44px for anything touch-driven. */
export const control = {
  iconButton: 36,
  touchTarget: 44,
  headerHeight: 56,
  statusDot: 6,
} as const;

/** Shared content widths. */
export const layout = {
  site: 1080,
  prose: 800,
  form: 640,
  hero: 520,
  chatEmpty: 500,
  chatThread: 680,
} as const;

export const transition = {
  fast: "0.15s",
  base: "0.2s",
} as const;
