"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { anzenPageStyle } from "@/components/anzen-theme";
import { useAnzenTheme } from "@/components/AnzenThemeProvider";

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageContent />
    </Suspense>
  );
}

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setupRequired = searchParams.get("setup") === "required";
  const authError = searchParams.get("auth_error");
  const authErrorDescription = searchParams.get("auth_error_description");
  const [isLoading, setIsLoading] = useState(true);

  const { theme: t } = useAnzenTheme();

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        if (res.ok) {
          router.replace("/dashboard");
          return;
        }
      } catch {
        // Not authenticated, show landing page
      }
      setIsLoading(false);
    }
    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div suppressHydrationWarning className="anzen-page" style={anzenPageStyle(t)} />
    );
  }

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

      <main
        className="anzen-site-x anzen-page-y"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          maxWidth: 1080,
          margin: "0 auto",
          width: "100%",
        }}
      >
        {setupRequired && (
          <div
            className="anzen-break-anywhere"
            style={{
              marginBottom: 24,
              padding: "14px 16px",
              borderRadius: 10,
              border: "1px solid rgba(248,113,113,0.35)",
              background: "rgba(248,113,113,0.08)",
              fontSize: 13,
              lineHeight: 1.6,
              color: t.text,
            }}
          >
            Auth0 is not configured. Copy <code style={{ color: t.accentText }}>.env.example</code> to{" "}
            <code style={{ color: t.accentText }}>.env.local</code>, fill in your Auth0 credentials, then restart{" "}
            <code style={{ color: t.accentText }}>npm run dev</code>.{" "}
            <code style={{ color: t.accentText }}>AUTH0_DOMAIN</code> must be the full hostname (e.g.{" "}
            <code style={{ color: t.accentText }}>dev-xxx.us.auth0.com</code>), not just the tenant name.
          </div>
        )}

        {authError && (
          <div
            className="anzen-break-anywhere"
            style={{
              marginBottom: 24,
              padding: "14px 16px",
              borderRadius: 10,
              border: "1px solid rgba(248,113,113,0.35)",
              background: "rgba(248,113,113,0.08)",
              fontSize: 13,
              lineHeight: 1.6,
              color: t.text,
            }}
          >
            <strong>Sign-in failed ({authError}).</strong> {authErrorDescription}
            {authErrorDescription?.includes("not authorized to access resource server") && (
              <>
                {" "}
                In Auth0: <strong>Applications → APIs</strong> → open your API with identifier{" "}
                <code style={{ color: t.accentText }}>https://anzen.api</code> (create it if missing) →{" "}
                <strong>Application Access</strong> → enable your <strong>Anzen</strong> app for{" "}
                <strong>User</strong> and <strong>Client</strong>. Or: <strong>Applications → Anzen → APIs</strong> →
                authorize the Anzen API. Then try sign-in again.
              </>
            )}
            {(authError === "invalid_scope" || authError === "access_denied") && (
              <>
                {" "}
                This usually means your Auth0 app is missing Token Vault setup. In the Auth0 dashboard, authorize{" "}
                <strong>Anzen Local</strong> on the <strong>My Account API</strong> with the connected-accounts scopes,
                enable MRRT, then set <code style={{ color: t.accentText }}>AUTH0_TOKEN_VAULT_SCOPES=true</code> in{" "}
                <code style={{ color: t.accentText }}>.env.local</code> and restart the dev server.
              </>
            )}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 24 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: t.accent,
              display: "inline-block",
              boxShadow: `0 0 6px ${t.accent}`,
            }}
          />
          <span style={{ fontSize: 11, color: t.muted, letterSpacing: "0.04em", fontWeight: 500 }}>agent / ready</span>
        </div>

        <h1
          className="anzen-hero-title"
          style={{
            fontWeight: 800,
            letterSpacing: "-0.045em",
            lineHeight: 0.98,
            margin: "0 0 20px",
            color: t.text,
          }}
        >
          Monitor.
          <br />
          Decide.
          <br />
          Act.
        </h1>

        <p style={{ fontSize: 15, color: t.muted, lineHeight: 1.7, margin: "0 0 36px", maxWidth: 380 }}>
          Your AI Chief of Staff. Connects to GitHub, Gmail, and Slack — and acts on your behalf, securely.
        </p>

        <div style={{ marginBottom: 48 }}>
          <a
            href="/auth/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "10px 20px",
              borderRadius: 9,
              background: t.accent,
              color: "#000",
              fontSize: 13.5,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              textDecoration: "none",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Get started
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
        </div>

        <div className="anzen-grid-3" style={{ maxWidth: 620 }}>
          {[
            {
              label: "MONITOR",
              body: "Watch your GitHub issues, unread emails, and Slack messages in one place.",
            },
            {
              label: "DECIDE",
              body: "Review and approve before the agent takes any sensitive action on your behalf.",
            },
            {
              label: "ACT",
              body: "Close issues, send emails, post messages — with your permission, every time.",
            },
          ].map((f) => (
            <div
              key={f.label}
              style={{
                background: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: 10,
                padding: "16px 14px",
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  color: t.muted,
                  margin: "0 0 8px",
                  textTransform: "uppercase" as const,
                }}
              >
                {f.label}
              </p>
              <p style={{ fontSize: 13, color: t.muted, lineHeight: 1.6, margin: 0 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </main>

      <SiteFooter activePage="home" />
    </div>
  );
}
