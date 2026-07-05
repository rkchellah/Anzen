"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { anzenPageStyle } from "@/components/anzen-theme";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { useAnzenTheme } from "@/components/AnzenThemeProvider";

export type LegalSection = {
  id: string;
  title: string;
  body: ReactNode;
};

export function LegalPageShell({
  kind,
  title,
  subtitle,
  sections,
  relatedLink,
}: {
  kind: "Privacy" | "Terms";
  title: string;
  subtitle: string;
  sections: LegalSection[];
  relatedLink?: { href: string; label: string };
}) {
  const { theme: t } = useAnzenTheme();

  return (
    <div
      suppressHydrationWarning
      className="anzen-page"
      style={{
        ...anzenPageStyle(t),
        display: "flex",
        flexDirection: "column",
      }}
    >
      <SiteHeader />

      <main style={{ flex: 1, width: "100%" }}>
        <div
          style={{
            width: "100%",
            borderBottom: `1px solid ${t.border}`,
            background: t.surface,
          }}
        >
          <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 28px 36px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: t.accentText,
                  background: t.accentBg,
                  border: `1px solid ${t.accent}40`,
                  padding: "4px 10px",
                  borderRadius: 999,
                }}
              >
                Legal
              </span>
              <span style={{ fontSize: 12, color: t.muted }}>{kind}</span>
            </div>
            <h1
              style={{
                fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.12,
                margin: "0 0 12px",
                color: t.text,
              }}
            >
              {title}
            </h1>
            <p style={{ fontSize: 15, color: t.muted, margin: 0, maxWidth: 560, lineHeight: 1.65 }}>{subtitle}</p>
          </div>
        </div>

        <div
          style={{
            maxWidth: 800,
            margin: "0 auto",
            padding: "36px 28px 56px",
          }}
        >
          <nav
            aria-label="On this page"
            style={{
              marginBottom: 28,
              padding: "14px 18px",
              borderRadius: 12,
              border: `1px solid ${t.border}`,
              background: t.surface,
            }}
          >
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: t.muted,
                margin: "0 0 10px",
              }}
            >
              On this page
            </p>
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexWrap: "wrap",
                gap: "8px 20px",
              }}
            >
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} style={{ fontSize: 13, color: t.muted, textDecoration: "none" }}>
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                style={{
                  padding: "24px 24px 22px",
                  borderRadius: 14,
                  border: `1px solid ${t.border}`,
                  background: t.surface,
                  scrollMarginTop: 80,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <span
                    aria-hidden
                    style={{
                      flexShrink: 0,
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      color: t.accentText,
                      background: t.accentBg,
                      border: `1px solid ${t.accent}33`,
                    }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2
                      style={{
                        fontSize: 18,
                        fontWeight: 600,
                        letterSpacing: "-0.02em",
                        margin: "0 0 10px",
                        color: t.text,
                      }}
                    >
                      {section.title}
                    </h2>
                    <div style={{ fontSize: 15, lineHeight: 1.75, color: t.muted }}>{section.body}</div>
                  </div>
                </div>
              </section>
            ))}
          </div>

          {relatedLink && (
            <p style={{ marginTop: 28, fontSize: 14, color: t.muted }}>
              See also{" "}
              <Link href={relatedLink.href} style={{ color: t.accentText, textDecoration: "none", fontWeight: 500 }}>
                {relatedLink.label}
              </Link>
            </p>
          )}
        </div>
      </main>

      <SiteFooter activePage={kind === "Privacy" ? "privacy" : "terms"} />
    </div>
  );
}
