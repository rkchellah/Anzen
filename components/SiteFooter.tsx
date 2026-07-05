"use client";

import Link from "next/link";
import { useAnzenTheme } from "@/components/AnzenThemeProvider";

export function SiteFooter({
  activePage,
}: {
  activePage?: "privacy" | "terms" | "home";
}) {
  const { theme: t } = useAnzenTheme();

  return (
    <footer
      style={{
        padding: "16px 28px",
        borderTop: `1px solid ${t.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
        backgroundColor: t.bg,
      }}
    >
      <span style={{ fontSize: 11, color: t.caption }}>Anzen 安全 · Powered by Auth0 Token Vault</span>
      <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 11, color: t.caption }}>
        <Link
          href="/privacy"
          style={{
            color: activePage === "privacy" ? t.accentText : t.caption,
            textDecoration: "none",
          }}
        >
          Privacy
        </Link>
        <Link
          href="/terms"
          style={{
            color: activePage === "terms" ? t.accentText : t.caption,
            textDecoration: "none",
          }}
        >
          Terms
        </Link>
        <Link href="/" style={{ color: activePage === "home" ? t.accentText : t.caption, textDecoration: "none" }}>
          Home
        </Link>
      </div>
    </footer>
  );
}
