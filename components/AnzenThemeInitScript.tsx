import { ANZEN_DARK, ANZEN_LIGHT } from "@/components/anzen-theme";

/** Runs before paint so the first frame matches stored light/dark preference. */
export function AnzenThemeInitScript() {
  const script = `(function(){try{var k="anzen-dark-mode";var v=localStorage.getItem(k);var dark=v===null?true:JSON.parse(v);var t=dark?${JSON.stringify(ANZEN_DARK)}:${JSON.stringify(ANZEN_LIGHT)};var r=document.documentElement;r.dataset.anzenTheme=dark?"dark":"light";r.style.colorScheme=dark?"dark":"light";r.style.backgroundColor=t.bg;r.style.setProperty("--anzen-bg",t.bg);r.style.setProperty("--anzen-surface",t.surface);r.style.setProperty("--anzen-surface-2",t.surface2);r.style.setProperty("--anzen-border",t.border);r.style.setProperty("--anzen-text",t.text);r.style.setProperty("--anzen-text-light",t.textLight);r.style.setProperty("--anzen-muted",t.muted);r.style.setProperty("--anzen-caption",t.caption);r.style.setProperty("--anzen-subtle",t.subtle);r.style.setProperty("--anzen-accent",t.accent);r.style.setProperty("--anzen-accent-bg",t.accentBg);r.style.setProperty("--anzen-accent-text",t.accentText);document.body.style.backgroundColor=t.bg;document.body.style.color=t.text;}catch(e){}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
