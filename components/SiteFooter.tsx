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
      className="anzen-site-x"
      style={{
        paddingTop: 16,
        paddingBottom: 16,
        borderTop: `1px solid ${t.border}`,
        backgroundColor: t.bg,
      }}
    >
      <div className="anzen-footer-inner">
        <span style={{ fontSize: 11, color: t.caption }}>Anzen 安全 · Powered by Auth0 Token Vault</span>
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 11, color: t.caption, flexWrap: "wrap", justifyContent: "center" }}>
          <Link
            href="/privacy"
            style={{
              color: activePage === "privacy" ? t.accentText : t.caption,
              textDecoration: "none",
              padding: "4px 0",
            }}
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            style={{
              color: activePage === "terms" ? t.accentText : t.caption,
              textDecoration: "none",
              padding: "4px 0",
            }}
          >
            Terms
          </Link>
          <Link
            href="/"
            style={{
              color: activePage === "home" ? t.accentText : t.caption,
              textDecoration: "none",
              padding: "4px 0",
            }}
          >
            Home
          </Link>
        </div>
      </div>
    </footer>
  );
}
