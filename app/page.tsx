"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CtaArrow, PageHero } from "@/components/PageHero";
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

      <main className="anzen-site-x anzen-page-y anzen-shell flex flex-1 flex-col">
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

        <PageHero
          size="hero"
          status="agent / ready"
          title={
            <>
              Monitor.
              <br />
              Decide.
              <br />
              Act.
            </>
          }
          lede="Your AI Chief of Staff. Connects to GitHub, Gmail, and Slack — and acts on your behalf, securely."
          actions={
            <a href="/auth/login" className="anzen-cta">
              Get started
              <CtaArrow />
            </a>
          }
        />

        <div className="anzen-grid-3 mt-12" style={{ maxWidth: 620 }}>
          {[
            {
              label: "Monitor",
              body: "Watch your GitHub issues, unread emails, and Slack messages in one place.",
            },
            {
              label: "Decide",
              body: "Review and approve before the agent takes any sensitive action on your behalf.",
            },
            {
              label: "Act",
              body: "Close issues, send emails, post messages — with your permission, every time.",
            },
          ].map((f) => (
            <div key={f.label} className="anzen-tile">
              <p className="anzen-tile-label">{f.label}</p>
              <p className="anzen-tile-body">{f.body}</p>
            </div>
          ))}
        </div>
      </main>

      <SiteFooter activePage="home" />
    </div>
  );
}
