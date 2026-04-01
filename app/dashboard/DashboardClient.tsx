"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, LogOut, Moon, Sun, RotateCw, Send, Shield, CheckCircle2, Zap } from "lucide-react";

type ConnectionStatus = { github: boolean; gmail: boolean; slack: boolean };

// Custom GitHub icon (not in lucide)
const GitHubIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
);

// Custom Slack icon (not in lucide)
const SlackIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path fill="#E01E5A" d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313z" />
    <path fill="#36C5F0" d="M8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312z" />
    <path fill="#2EB67D" d="M18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zm-1.271 0a2.528 2.528 0 01-2.523 2.521 2.527 2.527 0 01-2.52-2.521V2.522A2.527 2.527 0 0115.162 0a2.528 2.528 0 012.523 2.522v6.312z" />
    <path fill="#ECB22E" d="M15.165 18.956a2.528 2.528 0 012.523 2.522A2.528 2.528 0 0115.165 24a2.527 2.527 0 01-2.52-2.522v-2.522h2.52zm0-1.271a2.527 2.527 0 01-2.52-2.523 2.526 2.526 0 012.52-2.52h6.313A2.527 2.527 0 0124 15.162a2.528 2.528 0 01-2.522 2.523h-6.313z" />
  </svg>
);

// Gmail icon (lucide Mail is fine but Gmail branded is better)
const GmailIcon = ({ size = 24 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size}>
    <path fill="#EA4335" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
  </svg>
);

const TeamsIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill="#5059C9" d="M10.765 6.875h3.616c.342 0 .619.276.619.617v3.288a2.272 2.272 0 01-2.274 2.27h-.01a2.272 2.272 0 01-2.274-2.27V7.199c0-.179.145-.323.323-.323zM13.21 6.225c.808 0 1.464-.655 1.464-1.462 0-.808-.656-1.463-1.465-1.463s-1.465.655-1.465 1.463c0 .807.656 1.462 1.465 1.462z" />
    <path fill="#7B83EB" d="M8.651 6.225a2.114 2.114 0 002.117-2.112A2.114 2.114 0 008.65 2a2.114 2.114 0 00-2.116 2.112c0 1.167.947 2.113 2.116 2.113zM11.473 6.875h-5.97a.611.611 0 00-.596.625v3.75A3.669 3.669 0 008.488 15a3.669 3.669 0 003.582-3.75V7.5a.611.611 0 00-.597-.625z" />
    <path fill="#000000" d="M8.814 6.875v5.255a.598.598 0 01-.596.595H5.193a3.951 3.951 0 01-.287-1.476V7.5a.61.61 0 01.597-.624h3.31z" opacity="0.1" />
    <path fill="#ffffff" d="M6.152 7.193H4.959v3.243h-.76V7.193H3.01v-.63h3.141v.63z" />
  </svg>
);

const LinkedInIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill="#0A66C2" d="M12.225 12.225h-1.778V9.44c0-.664-.012-1.519-.925-1.519-.926 0-1.068.724-1.068 1.47v2.834H6.676V6.498h1.707v.783h.024c.348-.594.996-.95 1.684-.925 1.802 0 2.135 1.185 2.135 2.728l-.001 3.14zM4.67 5.715a1.037 1.037 0 01-1.032-1.031c0-.566.466-1.032 1.032-1.032.566 0 1.031.466 1.032 1.032 0 .566-.466 1.032-1.032 1.032zm.889 6.51h-1.78V6.498h1.78v5.727zM13.11 2H2.885A.88.88 0 002 2.866v10.268a.88.88 0 00.885.866h10.226a.882.882 0 00.889-.866V2.865a.88.88 0 00-.889-.864z" />
  </svg>
);

const GitLabIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill="#FC6D26" d="M14.975 8.904L14.19 6.55l-1.552-4.67a.268.268 0 00-.255-.18.268.268 0 00-.254.18l-1.552 4.667H5.422L3.87 1.879a.267.267 0 00-.254-.179.267.267 0 00-.254.18l-1.55 4.667-.784 2.357a.515.515 0 00.193.583l6.78 4.812 6.778-4.812a.516.516 0 00.196-.583z" />
    <path fill="#E24329" d="M8 14.296l2.578-7.75H5.423L8 14.296z" />
    <path fill="#FC6D26" d="M8 14.296l-2.579-7.75H1.813L8 14.296z" />
    <path fill="#FCA326" d="M1.81 6.549l-.784 2.354a.515.515 0 00.193.583L8 14.3 1.81 6.55z" />
    <path fill="#E24329" d="M1.812 6.549h3.612L3.87 1.882a.268.268 0 00-.254-.18.268.268 0 00-.255.18L1.812 6.549z" />
    <path fill="#FC6D26" d="M8 14.296l2.578-7.75h3.614L8 14.296z" />
    <path fill="#FCA326" d="M14.19 6.549l.783 2.354a.514.514 0 01-.193.583L8 14.296l6.188-7.747h.001z" />
    <path fill="#E24329" d="M14.19 6.549H10.58l1.551-4.667a.267.267 0 01.255-.18c.115 0 .217.073.254.18l1.552 4.667z" />
  </svg>
);

const OutlookIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="#0072C6">
    <path d="M19.484,7.937v5.477L21.4,14.619a.489.489,0,0,0,.21,0l8.238-5.554a1.174,1.174,0,0,0-.959-1.128Z" />
    <path d="M19.484,15.457l1.747,1.2a.522.522,0,0,0,.543,0c-.3.181,8.073-5.378,8.073-5.378V21.345a1.408,1.408,0,0,1-1.49,1.555H19.483V15.457Z" />
    <path d="M10.44,12.932a1.609,1.609,0,0,0-1.42.838,4.131,4.131,0,0,0-.526,2.218A4.05,4.05,0,0,0,9.02,18.2a1.6,1.6,0,0,0,2.771.022,4.014,4.014,0,0,0,.515-2.2,4.369,4.369,0,0,0-.5-2.281A1.536,1.536,0,0,0,10.44,12.932Z" />
    <path d="M2.153,5.155V26.582L18.453,30V2ZM13.061,19.491a3.231,3.231,0,0,1-2.7,1.361,3.19,3.19,0,0,1-2.64-1.318A5.459,5.459,0,0,1,6.706,16.1a5.868,5.868,0,0,1,1.036-3.616A3.267,3.267,0,0,1,10.486,11.1a3.116,3.116,0,0,1,2.61,1.321,5.639,5.639,0,0,1,1,3.484A5.763,5.763,0,0,1,13.061,19.491Z" />
  </svg>
);

const ClickupIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#7B68EE">
    <path d="M8 12L12 8L16 12H14V16H10V12H8Z" />
    <path d="M8 16L12 20L16 16H14V12H10V16H8Z" />
  </svg>
);

const NotionIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="currentColor">
    <path d="M5.948 5.609c0.99 0.807 1.365 0.75 3.234 0.625l17.62-1.057c0.375 0 0.063-0.375-0.063-0.438l-2.927-2.115c-0.557-0.438-1.307-0.932-2.74-0.813l-17.057 1.25c-0.625 0.057-0.75 0.37-0.5 0.62zM7.005 9.719v18.536c0 0.995 0.495 1.37 1.615 1.307l19.365-1.12c1.12-0.063 1.25-0.745 1.25-1.557v-18.411c0-0.813-0.313-1.245-1-1.182l-20.234 1.182c-0.75 0.063-0.995 0.432-0.995 1.24zM26.12 10.708c0.125 0.563 0 1.12-0.563 1.188l-0.932 0.188v13.682c-0.813 0.438-1.557 0.688-2.177 0.688-1 0-1.25-0.313-1.995-1.245l-6.104-9.583v9.271l1.932 0.438c0 0 0 1.12-1.557 1.12l-4.297 0.25c-0.125-0.25 0-0.875 0.438-0.995l1.12-0.313v-12.255l-1.557-0.125c-0.125-0.563 0.188-1.37 1.057-1.432l4.609-0.313 6.354 9.708v-8.589l-1.62-0.188c-0.125-0.682 0.37-1.182 0.995-1.24zM2.583 1.38l17.745-1.307c2.177-0.188 2.74-0.063 4.109 0.932l5.667 3.984c0.932 0.682 1.245 0.87 1.245 1.615v21.839c0 1.37-0.5 2.177-2.24 2.302l-20.615 1.245c-1.302 0.063-1.927-0.125-2.615-0.995l-4.172-5.417c-0.745-0.995-1.057-1.74-1.057-2.609v-19.411c0-1.12 0.5-2.052 1.932-2.177z" />
  </svg>
);

const LinearIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#5E6AD2">
    <line x1="2" y1="22" x2="22" y2="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="7" cy="17" r="2" fill="currentColor" />
    <circle cx="17" cy="7" r="2" fill="currentColor" />
  </svg>
);

const SUGGESTIONS = [
  "What GitHub issues are assigned to me?",
  "Summarize my unread emails",
  "List my Slack channels",
];

const AnzenLogo = () => (
  <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="10" height="10" rx="2" fill="#A3FF12" />
    <rect x="14" y="2" width="10" height="10" rx="2" fill="#A3FF12" opacity="0.6" />
    <rect x="2" y="14" width="10" height="10" rx="2" fill="#A3FF12" opacity="0.6" />
    <rect x="14" y="14" width="10" height="10" rx="2" fill="#A3FF12" opacity="0.3" />
    <path d="M8 8L10 10M10 8L8 10" stroke="#000" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

function getMessageText(message: { role: string; content: unknown; parts?: unknown[] }): string {
  if (typeof message.content === "string") return message.content;
  if (Array.isArray(message.parts)) {
    return (message.parts as Array<{ type: string; text?: string }>)
      .filter((p) => p.type === "text").map((p) => p.text ?? "").join("");
  }
  if (Array.isArray(message.content)) {
    return (message.content as Array<{ type: string; text?: string }>)
      .filter((p) => p.type === "text").map((p) => p.text ?? "").join("");
  }
  return "";
}

export default function DashboardClient({ userName, userEmail }: { userName: string; userEmail: string }) {
  const [connStatus, setConnStatus] = useState<ConnectionStatus>({ github: false, gmail: false, slack: false });
  const [statusLoading, setStatusLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [activePage, setActivePage] = useState("dashboard");
  const [dark, setDark] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status: chatStatus, setMessages } = useChat({ api: "/api/chat" });
  const isLoading = chatStatus === "streaming" || chatStatus === "submitted";
  const isChatting = messages.length > 0;

  const fetchConnectionStatus = async () => {
    setStatusLoading(true);
    try {
      const response = await fetch("/api/status");
      if (!response.ok) throw new Error("Failed to fetch status");
      const data = await response.json();
      if (data.results) {
        setConnStatus({
          github: data.results["github"]?.success === true,
          gmail: data.results["google-oauth2"]?.success === true,
          slack: data.results["slack-oauth2"]?.success === true,
        });
      }
    } catch (error) {
      console.error("Error fetching connection status:", error);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectionStatus();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchConnectionStatus();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Load dark mode preference from localStorage
    const savedDark = localStorage.getItem("anzen-dark-mode");
    if (savedDark !== null) {
      setDark(JSON.parse(savedDark));
    }

    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Save dark mode preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("anzen-dark-mode", JSON.stringify(dark));
  }, [dark]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return;
    const text = inputValue.trim();
    setInputValue("");
    sendMessage({ text });
  };

  const handleDisconnect = async (providerKey: string) => {
    const providerMap: Record<string, string> = {
      github: "github",
      gmail: "google-oauth2",
      slack: "slack-oauth2",
    };
    try {
      const res = await fetch("/api/auth/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: providerMap[providerKey] }),
      });
      const data = await res.json();
      if (data.action === "logout") {
        window.location.href = "/auth/logout?returnTo=" + encodeURIComponent("/auth/login?returnTo=/dashboard");
      } else {
        await fetchConnectionStatus();
      }
    } catch (error) {
      console.error("Error disconnecting:", error);
    }
  };

  const connectedCount = Object.values(connStatus).filter(Boolean).length;
  const d = dark;

  const bg       = d ? "#0a0d12"                : "#f7f6f3";
  const surface  = d ? "#111620"                : "#ffffff";
  const surface2 = d ? "#181e2c"                : "#ededea";
  const border   = d ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const tx       = d ? "#f0f0ee"                : "#000000";
  const muted    = d ? "rgba(240,240,238,0.40)" : "rgba(0,0,0,0.55)";
  const subtle   = d ? "rgba(240,240,238,0.16)" : "rgba(0,0,0,0.12)";
  const accent   = "#A3FF12";
  const accentBg = d ? "rgba(163,255,18,0.10)"  : "rgba(100,180,0,0.10)";
  const accentTx = d ? accent                   : "#3d6600";

  const card: React.CSSProperties = {
    backgroundColor: surface,
    border: `1px solid ${border}`,
    borderRadius: 14,
  };

  // ── correct Auth0 v4 paths: /auth/login not /api/auth/login
  const activeProviders = [
    { key: "github", label: "GitHub", desc: "Issues, PRs & repos",  connectHref: "/auth/login?connection=github&connection_scope=repo,read:user&returnTo=/dashboard", icon: <GitHubIcon size={40} /> },
    { key: "gmail",  label: "Gmail",  desc: "Emails & drafts",       connectHref: "/auth/login?connection=google-oauth2&returnTo=/dashboard",                         icon: <GmailIcon size={40} /> },
    { key: "slack",  label: "Slack",  desc: "Channels & messages",   connectHref: "/auth/login?connection=slack-oauth2&returnTo=/dashboard",                          icon: <SlackIcon size={40} /> },
  ];

  const comingSoon = [
    { label: "Teams",   icon: <TeamsIcon size={32} /> },
    { label: "LinkedIn", icon: <LinkedInIcon size={32} /> },
    { label: "GitLab", icon: <GitLabIcon size={32} /> },
    { label: "Notion",  icon: <NotionIcon size={32} /> },
    { label: "Linear",  icon: <LinearIcon size={32} /> },
  ];

  return (
    <div style={{ backgroundColor: bg, color: tx, minHeight: "100vh", fontFamily: "'Inter', -apple-system, sans-serif", display: "flex", flexDirection: "column" }}>

      {/* ── NAVBAR ── */}
      <header style={{ backgroundColor: bg, borderBottom: `1px solid ${border}`, position: "sticky", top: 0, zIndex: 50, height: 56 }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 28px", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>

          <button onClick={() => { setActivePage("dashboard"); setMessages([]); setInputValue(""); }}
            style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}>
            <AnzenLogo />
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.03em", color: tx }}>Anzen</span>
            <span style={{ fontSize: 11, color: muted, letterSpacing: "0.02em", fontWeight: 400 }}>安全</span>
          </button>

          <nav style={{ display: "flex", gap: 2 }}>
            {[
              { id: "dashboard",   label: "Dashboard" },
              { id: "connections", label: "Connections" },
              { id: "history",     label: "History" },
            ].map(({ id, label }) => {
              const active = activePage === id;
              return (
                <button key={id} onClick={() => setActivePage(id)}
                  style={{
                    padding: "5px 15px", borderRadius: 7, fontSize: 13.5, fontWeight: active ? 600 : 400,
                    color: active ? tx : muted,
                    background: active ? (d ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)") : "transparent",
                    border: "none", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                  }}>
                  {label}
                </button>
              );
            })}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {!statusLoading && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: muted }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: connectedCount > 0 ? accent : subtle, display: "inline-block", boxShadow: connectedCount > 0 ? `0 0 5px ${accent}` : "none" }} />
                  {connectedCount}/3
                </div>
                <button onClick={fetchConnectionStatus}
                  style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${border}`, background: surface2, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: muted }}
                  title="Refresh connection status">
                  <RotateCw size={14} />
                </button>
              </>
            )}
            <button onClick={() => setDark(!d)}
              style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${border}`, background: surface2, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: muted }}>
              {d ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            {/* correct logout path for Auth0 v4 */}
            <a href="/auth/logout"
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 500, color: muted, textDecoration: "none", transition: "color 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
              onMouseLeave={(e) => (e.currentTarget.style.color = muted)}>
              <LogOut size={14} />
              Sign out
            </a>
          </div>
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

        {/* ── DASHBOARD ── */}
        {activePage === "dashboard" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "calc(100vh - 56px)" }}>

            {isChatting && (
              <div style={{ flex: 1, overflowY: "auto", padding: "32px 28px 0" }}>
                <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
                  <AnimatePresence initial={false}>
                    {messages.map((m, i) => {
                      const text = getMessageText(m);
                      if (!text.trim() && m.role !== "user") return null;
                      const isUser = m.role === "user";
                      return (
                        <motion.div key={m.id ?? i}
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}
                          style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", alignItems: "flex-start", gap: 9 }}>
                          {!isUser && (
                            <div style={{ width: 26, height: 26, borderRadius: 7, background: accentBg, border: `1px solid ${accent}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                              <AnzenLogo />
                            </div>
                          )}
                          <div style={{
                            maxWidth: "76%", fontSize: 14, lineHeight: 1.72, color: tx,
                            ...(isUser ? { background: surface2, border: `1px solid ${border}`, borderRadius: "14px 14px 3px 14px", padding: "9px 14px" } : {}),
                          }}>
                            {text.split("\n").map((line, j, arr) => (
                              <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {isLoading && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 7, background: accentBg, border: `1px solid ${accent}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <AnzenLogo />
                      </div>
                      <div style={{ display: "flex", gap: 4, padding: "9px 14px", background: surface2, border: `1px solid ${border}`, borderRadius: "14px 14px 14px 3px", alignItems: "center" }}>
                        {[0, 1, 2].map((i) => (
                          <motion.span key={i} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.1 }}
                            style={{ width: 5, height: 5, borderRadius: "50%", background: accent, opacity: 0.8, display: "block" }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}

            {!isChatting && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 28px 172px", gap: 36 }}>
                <div style={{ textAlign: "center", maxWidth: 520 }}>
                  <h1 style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.08, margin: "0 0 12px", color: tx }}>
                    What can I<br />help with?
                  </h1>
                  <p style={{ fontSize: 15, color: muted, margin: 0, lineHeight: 1.65 }}>
                    Your AI Chief of Staff — secured by Auth0 Token Vault.
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, width: "100%", maxWidth: 500 }}>
                  {activeProviders.map((p) => {
                    const connected = connStatus[p.key as keyof ConnectionStatus];
                    return (
                      <a key={p.key} href={connected ? "#" : p.connectHref}
                        onClick={(e) => connected && e.preventDefault()}
                        style={{ ...card, padding: "20px 14px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textDecoration: "none", cursor: connected ? "default" : "pointer", transition: "all 0.18s", ...(connected ? { borderColor: `${accent}30` } : { opacity: 0.52 }) }}
                        onMouseEnter={(e) => { if (!connected) { e.currentTarget.style.opacity = "0.78"; e.currentTarget.style.transform = "translateY(-2px)"; } }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = connected ? "1" : "0.52"; e.currentTarget.style.transform = "none"; }}>
                        <div style={{ width: 52, height: 52, background: surface2, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${border}` }}>{p.icon}</div>
                        <div style={{ textAlign: "center" }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: tx, margin: "0 0 2px" }}>{p.label}</p>
                          <p style={{ fontSize: 11, color: muted, margin: 0 }}>{p.desc}</p>
                        </div>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: connected ? accent : subtle, display: "block", boxShadow: connected ? `0 0 6px ${accent}` : "none" }} />
                      </a>
                    );
                  })}
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 7, maxWidth: 500 }}>
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => setInputValue(s)}
                      style={{ padding: "7px 14px", borderRadius: 999, border: `1px solid ${border}`, background: "transparent", fontSize: 12.5, color: muted, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = tx; e.currentTarget.style.borderColor = `${accent}55`; e.currentTarget.style.transform = "translateY(-1px)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = muted; e.currentTarget.style.borderColor = border; e.currentTarget.style.transform = "none"; }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ position: "sticky", bottom: 0, background: bg, padding: "13px 28px 22px", borderTop: isChatting ? `1px solid ${border}` : "none" }}>
              <div style={{ maxWidth: 680, margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: surface, border: `1px solid ${border}`, borderRadius: 13, padding: "11px 14px" }}>
                  <Zap size={16} style={{ color: accentTx, flexShrink: 0 }} />
                  <input value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder="Ask Anzen anything…"
                    style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, color: tx, fontFamily: "inherit" }} />
                  <button onClick={handleSend} disabled={!inputValue.trim() || isLoading}
                    style={{
                      width: 30, height: 30, borderRadius: 8, border: "none", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s",
                      cursor: inputValue.trim() && !isLoading ? "pointer" : "not-allowed",
                      background: inputValue.trim() && !isLoading ? accent : (d ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"),
                      color: inputValue.trim() && !isLoading ? "#000" : muted,
                      opacity: inputValue.trim() || isLoading ? 1 : 0.35,
                    }}>
                    <Send size={14} />
                  </button>
                </div>
                <p style={{ textAlign: "center", fontSize: 10.5, color: subtle, margin: "6px 0 0", letterSpacing: "0.02em" }}>
                  Anzen AI · Secured by Auth0 Token Vault
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── CONNECTIONS ── */}
        {activePage === "connections" && (
          <div style={{ maxWidth: 1080, margin: "0 auto", width: "100%", padding: "44px 28px" }}>
            <div style={{ marginBottom: 36 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em", color: tx, margin: "0 0 6px" }}>Connections</h1>
              <p style={{ fontSize: 14, color: muted, margin: 0 }}>Credentials stored in Auth0 Token Vault — Anzen never sees them.</p>
            </div>

            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: muted, margin: "0 0 12px" }}>
              Active · {statusLoading ? "…" : `${connectedCount} of 3 connected`}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 36 }}>
              {activeProviders.map((p) => {
                const connected = connStatus[p.key as keyof ConnectionStatus];
                return (
                  <div key={p.key} style={{ ...card, padding: "28px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, ...(connected ? { borderColor: `${accent}25` } : {}) }}>
                    <div style={{ width: 80, height: 80, background: surface2, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${border}` }}>
                      {p.icon}
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontSize: 15, fontWeight: 600, color: tx, margin: "0 0 3px" }}>{p.label}</p>
                      <p style={{ fontSize: 12, color: muted, margin: 0 }}>{p.desc}</p>
                    </div>
                    {connected ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, width: "100%" }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: accentTx, display: "flex", alignItems: "center", gap: 5 }}>
                          <CheckCircle2 size={14} style={{ color: accent }} />
                          Connected
                        </span>
                        <button onClick={() => handleDisconnect(p.key)}
                          style={{ padding: "8px 16px", fontSize: 13, fontWeight: 500, borderRadius: 8, background: "transparent", color: muted, border: `1px solid ${border}`, cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(248,113,113,0.08)"; e.currentTarget.style.color = "#f87171"; e.currentTarget.style.borderColor = "rgba(248,113,113,0.3)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = muted; e.currentTarget.style.borderColor = border; }}>
                          Disconnect
                        </button>
                      </div>
                    ) : (
                      <a href={p.connectHref}
                        style={{ display: "inline-block", padding: "8px 20px", fontSize: 13, fontWeight: 600, borderRadius: 8, background: accent, color: "#000", textDecoration: "none", transition: "opacity 0.2s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
                        Connect
                      </a>
                    )}
                  </div>
                );
              })}
            </div>

            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: muted, margin: "0 0 12px" }}>Coming soon</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
              {comingSoon.map((app) => (
                <div key={app.label} style={{ ...card, padding: "20px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, opacity: 0.38 }}>
                  <div style={{ width: 56, height: 56, background: surface2, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>{app.icon}</div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: tx, margin: 0 }}>{app.label}</p>
                  <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: muted, background: surface2, padding: "2px 7px", borderRadius: 4 }}>Soon</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── HISTORY ── */}
        {activePage === "history" && (
          <div style={{ maxWidth: 1080, margin: "0 auto", width: "100%", padding: "44px 28px" }}>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em", color: tx, margin: "0 0 6px" }}>Audit Logs</h1>
              <p style={{ fontSize: 14, color: muted, margin: 0 }}>Every action Anzen takes on your behalf is recorded here.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 24 }}>
              {[
                { label: "Total",       value: messages.length,                                       color: accentTx },
                { label: "Responses",   value: messages.filter((m) => m.role === "assistant").length, color: accentTx },
                { label: "Your msgs",   value: messages.filter((m) => m.role === "user").length,      color: "#60A5FA" },
                { label: "Connections", value: connectedCount,                                        color: "#60A5FA" },
              ].map((s) => (
                <div key={s.label} style={{ ...card, padding: "16px 18px" }}>
                  <p style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" as const, color: muted, margin: "0 0 8px" }}>{s.label}</p>
                  <p style={{ fontSize: 26, fontWeight: 700, color: s.color, margin: 0, letterSpacing: "-0.02em" }}>{s.value}</p>
                </div>
              ))}
            </div>

            {messages.length === 0 ? (
              <div style={{ ...card, padding: "52px 20px", textAlign: "center" }}>
                <p style={{ color: muted, fontSize: 14, margin: 0 }}>No activity yet. Start a conversation to see logs here.</p>
              </div>
            ) : (
              <div style={{ ...card, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 100px 80px", gap: 16, padding: "10px 18px", borderBottom: `1px solid ${border}`, background: surface2 }}>
                  {["Role", "Message", "Time", "Status"].map((h) => (
                    <span key={h} style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: muted }}>{h}</span>
                  ))}
                </div>
                {[...messages].reverse().map((m, i) => {
                  const text = getMessageText(m);
                  const preview = text.length > 80 ? text.slice(0, 80) + "…" : text;
                  const isUser = m.role === "user";
                  return (
                    <div key={m.id ?? i}
                      style={{ display: "grid", gridTemplateColumns: "70px 1fr 100px 80px", gap: 16, padding: "13px 18px", borderBottom: i < messages.length - 1 ? `1px solid ${border}` : "none", transition: "background 0.12s" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = d ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}>
                      <code style={{ fontSize: 11, color: isUser ? "#60A5FA" : accentTx, background: isUser ? "rgba(96,165,250,0.1)" : accentBg, padding: "2px 8px", borderRadius: 5, alignSelf: "center", whiteSpace: "nowrap" as const }}>{m.role}</code>
                      <span style={{ fontSize: 13, color: tx, alignSelf: "center" }}>{preview || "(tool call)"}</span>
                      <span style={{ fontSize: 12, color: muted, alignSelf: "center" }}>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: accentTx, background: accentBg, padding: "2px 8px", borderRadius: 5, alignSelf: "center", whiteSpace: "nowrap" as const }}>Success</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}