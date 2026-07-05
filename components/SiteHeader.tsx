"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { AnzenLogo } from "@/components/AnzenLogo";
import { useAnzenTheme } from "@/components/AnzenThemeProvider";

type NavLink = { href: string; label: string };

type SessionState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "authenticated"; name: string | null };

export function SiteHeader({
  homeHref = "/",
  navLinks = [],
  signInHref = "/auth/login",
}: {
  homeHref?: string;
  navLinks?: NavLink[];
  signInHref?: string;
}) {
  const { theme: t, isDark, toggleDarkMode } = useAnzenTheme();
  const [session, setSession] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        if (cancelled) return;
        if (!res.ok) {
          setSession({ status: "guest" });
          return;
        }
        const data = (await res.json()) as {
          authenticated?: boolean;
          user?: { name?: string | null };
        };
        if (data.authenticated) {
          setSession({ status: "authenticated", name: data.user?.name ?? null });
        } else {
          setSession({ status: "guest" });
        }
      } catch {
        if (!cancelled) setSession({ status: "guest" });
      }
    }

    loadSession();

    const onVisibility = () => {
      if (document.visibilityState === "visible") void loadSession();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const authLink =
    session.status === "authenticated"
      ? { href: "/dashboard", label: "Dashboard" }
      : { href: signInHref, label: "Sign in" };

  const visibleNavLinks = navLinks.filter(
    (link) =>
      !(
        session.status === "authenticated" &&
        link.href.replace(/\/$/, "") === authLink.href.replace(/\/$/, "")
      )
  );

  return (
    <header
      style={{
        backgroundColor: t.bg,
        borderBottom: `1px solid ${t.border}`,
        position: "sticky",
        top: 0,
        zIndex: 50,
        height: 56,
      }}
    >
      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          padding: "0 28px",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href={homeHref}
          style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none", flexShrink: 0 }}
        >
          <AnzenLogo size={35} />
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.03em", color: t.text }}>Anzen</span>
          <span style={{ fontSize: 11, color: t.muted, letterSpacing: "0.02em", fontWeight: 400 }}>安全</span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {visibleNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                padding: "5px 15px",
                borderRadius: 7,
                fontSize: 13.5,
                fontWeight: 400,
                color: t.muted,
                textDecoration: "none",
                fontFamily: "inherit",
              }}
            >
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={toggleDarkMode}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Light mode" : "Dark mode"}
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              border: `1px solid ${t.border}`,
              background: t.surface2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: t.muted,
            }}
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          {session.status !== "loading" && (
            <Link
              href={authLink.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 13,
                fontWeight: session.status === "authenticated" ? 600 : 500,
                color: session.status === "authenticated" ? t.accentText : t.muted,
                textDecoration: "none",
                padding: "5px 12px",
                borderRadius: 7,
                border: `1px solid ${session.status === "authenticated" ? `${t.accent}55` : t.border}`,
                background: session.status === "authenticated" ? t.accentBg : t.surface2,
              }}
            >
              {authLink.label}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
