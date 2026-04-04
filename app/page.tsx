"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    async function checkAuth() {
      try {
        const res = await fetch("/api/status", { cache: "no-store" });
        if (res.ok) {
          router.replace("/dashboard");
          return;
        }
      } catch (error) {
        // Not authenticated, show landing page
      }
      setIsLoading(false);
    }
    checkAuth();
  }, [router]);

  if (isLoading) return null;

  return (
    <div style={{
      backgroundColor: "#0a0d12",
      minHeight: "100vh",
      fontFamily: "'Inter', -apple-system, sans-serif",
      color: "#f0f0ee",
      display: "flex",
      flexDirection: "column",
    }}>

      {/* Navbar */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", height: 52, display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", padding: "0 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          {/* Shield logo */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" fill="#A3FF12" opacity="0.9" />
            <path d="M9 12l2 2 4-4" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.03em", color: "#A3FF12" }}>Anzen</span>
          <span style={{ fontSize: 11, color: "#A3FF12", letterSpacing: "0.02em" }}>安全</span>
        </div>

        <a href="/auth/login"
          style={{ fontSize: 13, fontWeight: 600, color: "#f0f0ee", textDecoration: "none", transition: "color 0.15s", padding: "6px 16px", border: "1px solid rgba(163,255,18,0.35)", borderRadius: 7 }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#A3FF12"; e.currentTarget.style.borderColor = "#A3FF12"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#f0f0ee"; e.currentTarget.style.borderColor = "rgba(163,255,18,0.35)"; }}>
          Sign in
        </a>

        <div />
      </header>

      {/* Hero */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "64px 32px 40px", maxWidth: 760, margin: "0 auto", width: "100%" }}>

        {/* Status badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 28 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#A3FF12", display: "inline-block", boxShadow: "0 0 6px #A3FF12" }} />
          <span style={{ fontSize: 11, color: "rgba(240,240,238,0.45)", letterSpacing: "0.04em", fontWeight: 500 }}>agent / ready</span>
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: 58, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 0.98, margin: "0 0 20px", color: "#f0f0ee" }}>
          Monitor.<br />
          Decide.<br />
          Act.
        </h1>

        <p style={{ fontSize: 15, color: "rgba(240,240,238,0.5)", lineHeight: 1.7, margin: "0 0 36px", maxWidth: 380 }}>
          Your AI Chief of Staff. Connects to GitHub, Gmail, and Slack — and acts on your behalf, securely.
        </p>

        {/* CTA */}
        <div style={{ marginBottom: 52 }}>
          <a href="/auth/login"
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "10px 20px", borderRadius: 9,
              background: "#A3FF12", color: "#000",
              fontSize: 13.5, fontWeight: 700, letterSpacing: "-0.01em",
              textDecoration: "none", transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
            Get started
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </a>
        </div>

        {/* Feature cards — matches reference image */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, maxWidth: 620 }}>
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
            <div key={f.label} style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 10,
              padding: "16px 14px",
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(240,240,238,0.35)", margin: "0 0 8px", textTransform: "uppercase" as const }}>{f.label}</p>
              <p style={{ fontSize: 13, color: "rgba(240,240,238,0.6)", lineHeight: 1.6, margin: 0 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: "20px 32px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: "rgba(240,240,238,0.2)" }}>Anzen 安全 · Powered by Auth0 Token Vault</span>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "rgba(240,240,238,0.2)" }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Zero credentials stored
        </div>
      </footer>
    </div>
  );
}