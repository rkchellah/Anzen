"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, Moon, Sun, X } from "lucide-react";
import { AnzenLogo } from "@/components/AnzenLogo";
import { useAnzenTheme } from "@/components/AnzenThemeProvider";

type NavLink = { href: string; label: string };

type SessionState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "authenticated"; name: string | null };

export type InitialAuthState =
  | { status: "authenticated"; name: string | null }
  | { status: "guest" };

export function SiteHeader({
  homeHref = "/",
  navLinks = [],
  signInHref = "/auth/login",
  initialAuth,
}: {
  homeHref?: string;
  navLinks?: NavLink[];
  signInHref?: string;
  initialAuth?: InitialAuthState;
}) {
  const { theme: t, isDark, toggleDarkMode } = useAnzenTheme();
  const [session, setSession] = useState<SessionState>(
    initialAuth
      ? initialAuth.status === "authenticated"
        ? { status: "authenticated", name: initialAuth.name }
        : { status: "guest" }
      : { status: "loading" }
  );
  const [menuOpen, setMenuOpen] = useState(false);

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

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, [menuOpen]);

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

  const themeButton = (
    <button
      type="button"
      onClick={toggleDarkMode}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      style={{
        width: 32,
        height: 32,
        borderRadius: 6,
        border: "none",
        background: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: t.text,
        flexShrink: 0,
        padding: 0,
        transition: "opacity 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );

  const authLinkEl = (
    <Link
      href={authLink.href}
      onClick={() => setMenuOpen(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        fontSize: 13.5,
        fontWeight: 600,
        color: t.text,
        textDecoration: "none",
        padding: "5px 10px",
        transition: "opacity 0.15s",
        visibility: session.status === "loading" ? "hidden" : "visible",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      aria-hidden={session.status === "loading"}
      tabIndex={session.status === "loading" ? -1 : undefined}
    >
      {session.status === "loading" ? "Sign in" : authLink.label}
    </Link>
  );

  return (
    <header
      style={{
        backgroundColor: "transparent",
        borderBottom: "none",
        position: "sticky",
        top: 0,
        zIndex: 50,
        height: 56,
      }}
    >
      <div
        className="anzen-site-x"
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <Link
          href={homeHref}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            textDecoration: "none",
            flexShrink: 0,
            minWidth: 0,
          }}
        >
          <AnzenLogo size={35} />
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.03em", color: t.text }}>
            Anzen
          </span>
          <span style={{ fontSize: 11, color: t.muted, letterSpacing: "0.02em", fontWeight: 400 }}>
            安全
          </span>
        </Link>

        <div className="anzen-header-nav">
          {visibleNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                padding: "10px 15px",
                borderRadius: 7,
                fontSize: 13.5,
                fontWeight: 400,
                color: t.muted,
                textDecoration: "none",
                fontFamily: "inherit",
                minHeight: 44,
                display: "flex",
                alignItems: "center",
              }}
            >
              {link.label}
            </Link>
          ))}
          {themeButton}
          {authLinkEl}
        </div>

        <div className="anzen-header-mobile-tools">
          {themeButton}
          <button
            type="button"
            className="anzen-header-menu-btn anzen-touch-target"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 7,
              border: `1px solid ${t.border}`,
              background: t.surface2,
              cursor: "pointer",
              color: t.muted,
            }}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <div
        className="anzen-header-mobile-panel"
        data-open={menuOpen ? "true" : "false"}
        style={{ backgroundColor: t.bg, borderBottomColor: t.border }}
      >
        {visibleNavLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="anzen-header-mobile-link"
            onClick={() => setMenuOpen(false)}
            style={{ color: t.muted }}
          >
            {link.label}
          </Link>
        ))}
        {authLinkEl}
      </div>
    </header>
  );
}
