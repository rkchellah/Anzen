"use client";

import Link from "next/link";
import { buildConnectUrl, CONNECTIONS } from "@/lib/auth-connections";
import { AI_PROVIDER_SHORT_LABEL } from "@/lib/ai-display";
import { anzenPageStyle } from "@/components/anzen-theme";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { useAnzenTheme } from "@/components/AnzenThemeProvider";

const PROVIDER_DESCRIPTIONS: Record<keyof typeof CONNECTIONS, string> = {
  github: "Allow Anzen to read and manage your GitHub issues.",
  gmail: "Allow Anzen to read and send emails on your behalf.",
  slack: "Allow Anzen to read and post messages in your Slack workspace.",
};

export function ConnectPageClient() {
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

      <main className="anzen-site-x anzen-page-y" style={{ flex: 1, maxWidth: 640, margin: "0 auto", width: "100%", lineHeight: 1.65 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 12px", color: t.text }}>
          Connect your accounts
        </h1>
        <p style={{ fontSize: 15, color: t.muted, margin: "0 0 16px" }}>
          Anzen needs access to your accounts to act on your behalf.
        </p>
        <p style={{ fontSize: 14, color: t.muted, margin: "0 0 16px" }}>
          When you connect an account, Anzen never stores your token. Auth0 Token Vault holds it securely.
          Message and issue content you ask about is processed by {AI_PROVIDER_SHORT_LABEL} (AI) to generate responses — see{" "}
          <Link href="/privacy" style={{ color: t.accentText, textDecoration: "none", fontWeight: 500 }}>
            Privacy Policy
          </Link>
          .
        </p>
        <p style={{ fontSize: 13, color: t.caption, margin: "0 0 28px" }}>
          By connecting you agree to our{" "}
          <Link href="/terms" style={{ color: t.accentText, textDecoration: "none" }}>
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" style={{ color: t.accentText, textDecoration: "none" }}>
            Privacy Policy
          </Link>
          .
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(Object.keys(CONNECTIONS) as Array<keyof typeof CONNECTIONS>).map((key) => (
            <div
              key={key}
              style={{
                padding: "18px 20px",
                border: `1px solid ${t.border}`,
                borderRadius: 12,
                background: t.surface,
              }}
            >
              <h2 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 600, color: t.text }}>
                {CONNECTIONS[key].label}
              </h2>
              <p style={{ margin: "0 0 14px", fontSize: 14, color: t.muted }}>{PROVIDER_DESCRIPTIONS[key]}</p>
              <a
                href={buildConnectUrl(key, "/connect")}
                style={{
                  display: "inline-block",
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 8,
                  background: t.accent,
                  color: "#000",
                  textDecoration: "none",
                }}
              >
                Connect {CONNECTIONS[key].label}
              </a>
            </div>
          ))}
        </div>

        <p style={{ marginTop: 32, fontSize: 14 }}>
          <Link href="/dashboard" style={{ color: t.accentText, textDecoration: "none", fontWeight: 500 }}>
            Back to Dashboard
          </Link>
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
