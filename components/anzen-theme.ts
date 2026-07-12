/** Shared theme tokens — match Dashboard light/dark modes. */
export type AnzenTheme = {
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  text: string;
  textLight: string;
  muted: string;
  caption: string;
  subtle: string;
  accent: string;
  accentBg: string;
  accentText: string;
};

export const ANZEN_LIGHT: AnzenTheme = {
  bg: "#f4f4f1",
  surface: "#ffffff",
  surface2: "#ececea",
  border: "rgba(0,0,0,0.12)",
  text: "#0a0a0a",
  textLight: "#1a1a1a",
  muted: "#4a4a4a",
  caption: "rgba(0,0,0,0.52)",
  subtle: "rgba(0,0,0,0.24)",
  accent: "#5cd400",
  accentBg: "rgba(92,212,0,0.20)",
  accentText: "#1a5c00",
};

export const ANZEN_DARK: AnzenTheme = {
  bg: "#0a0d12",
  surface: "#111620",
  surface2: "#181e2c",
  border: "rgba(255,255,255,0.07)",
  text: "#f0f0ee",
  textLight: "rgba(240,240,238,0.85)",
  muted: "rgba(240,240,238,0.40)",
  caption: "rgba(240,240,238,0.38)",
  subtle: "rgba(240,240,238,0.16)",
  accent: "#A3FF12",
  accentBg: "rgba(163,255,18,0.10)",
  accentText: "#A3FF12",
};

export const ANZEN_THEME_STORAGE_KEY = "anzen-dark-mode";

export const ANZEN_THEME_CHANGE_EVENT = "anzen-theme-change";

const THEME_CSS_VAR_MAP: Record<keyof AnzenTheme, string> = {
  bg: "--anzen-bg",
  surface: "--anzen-surface",
  surface2: "--anzen-surface-2",
  border: "--anzen-border",
  text: "--anzen-text",
  textLight: "--anzen-text-light",
  muted: "--anzen-muted",
  caption: "--anzen-caption",
  subtle: "--anzen-subtle",
  accent: "--anzen-accent",
  accentBg: "--anzen-accent-bg",
  accentText: "--anzen-accent-text",
};

export function getAnzenTheme(isDark: boolean): AnzenTheme {
  return isDark ? ANZEN_DARK : ANZEN_LIGHT;
}

export function readStoredDarkMode(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const saved = localStorage.getItem(ANZEN_THEME_STORAGE_KEY);
    if (saved !== null) return JSON.parse(saved) as boolean;
  } catch {
    // ignore malformed storage
  }
  return true;
}

export function writeStoredDarkMode(isDark: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ANZEN_THEME_STORAGE_KEY, JSON.stringify(isDark));
  window.dispatchEvent(
    new CustomEvent(ANZEN_THEME_CHANGE_EVENT, { detail: { isDark } })
  );
}

/** Apply theme tokens to the document root so every page shares the same palette. */
export function applyDocumentTheme(isDark: boolean): void {
  if (typeof document === "undefined") return;

  const theme = getAnzenTheme(isDark);
  const root = document.documentElement;

  root.dataset.anzenTheme = isDark ? "dark" : "light";
  root.classList.toggle("dark", isDark);
  root.style.colorScheme = isDark ? "dark" : "light";
  root.style.backgroundColor = theme.bg;
  document.body.style.backgroundColor = theme.bg;
  document.body.style.color = theme.text;

  // Map Anzen palette → shadcn semantic tokens (chatbot kit)
  root.style.setProperty("--background", theme.bg);
  root.style.setProperty("--foreground", theme.text);
  root.style.setProperty("--card", theme.surface);
  root.style.setProperty("--card-foreground", theme.text);
  root.style.setProperty("--popover", theme.surface);
  root.style.setProperty("--popover-foreground", theme.text);
  root.style.setProperty("--primary", theme.accent);
  root.style.setProperty("--primary-foreground", "#000000");
  root.style.setProperty("--secondary", theme.surface2);
  root.style.setProperty("--secondary-foreground", theme.text);
  root.style.setProperty("--muted", theme.surface2);
  root.style.setProperty("--muted-foreground", theme.muted);
  root.style.setProperty("--accent", theme.accentBg);
  root.style.setProperty("--accent-foreground", theme.accentText);
  root.style.setProperty("--border", theme.border);
  root.style.setProperty("--input", theme.border);
  root.style.setProperty("--ring", theme.accent);
  root.style.setProperty("--sidebar", theme.surface);
  root.style.setProperty("--sidebar-foreground", theme.text);
  root.style.setProperty("--sidebar-primary", theme.accent);
  root.style.setProperty("--sidebar-primary-foreground", "#000000");
  root.style.setProperty("--sidebar-accent", theme.surface2);
  root.style.setProperty("--sidebar-accent-foreground", theme.text);
  root.style.setProperty("--sidebar-border", theme.border);
  root.style.setProperty("--sidebar-ring", theme.accent);

  for (const [token, cssVar] of Object.entries(THEME_CSS_VAR_MAP) as Array<
    [keyof AnzenTheme, string]
  >) {
    root.style.setProperty(cssVar, theme[token]);
  }
}

export function anzenPageStyle(theme: AnzenTheme): {
  minHeight: string;
  width: string;
  backgroundColor: string;
  color: string;
} {
  return {
    minHeight: "100vh",
    width: "100%",
    backgroundColor: theme.bg,
    color: theme.text,
  };
}
