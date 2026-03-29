"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { ArrowUp, Shield, Zap, Plus, Bell, Settings, LogOut, HelpCircle } from "lucide-react";

type ConnectionStatus = { github: boolean; gmail: boolean; slack: boolean };

const SUGGESTIONS = [
  "Scan GitHub for exposed secrets",
  "Analyze recent Slack login activity",
  "Audit Gmail OAuth permissions",
];

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
);

const GmailIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22">
    <path fill="#EA4335" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
  </svg>
);

const SlackIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22">
    <path fill="#E01E5A" d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313z" />
    <path fill="#36C5F0" d="M8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312z" />
    <path fill="#2EB67D" d="M18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zm-1.271 0a2.528 2.528 0 01-2.523 2.521 2.527 2.527 0 01-2.52-2.521V2.522A2.527 2.527 0 0115.162 0a2.528 2.528 0 012.523 2.522v6.312z" />
    <path fill="#ECB22E" d="M15.165 18.956a2.528 2.528 0 012.523 2.522A2.528 2.528 0 0115.165 24a2.527 2.527 0 01-2.52-2.522v-2.522h2.52zm0-1.271a2.527 2.527 0 01-2.52-2.523 2.526 2.526 0 012.52-2.52h6.313A2.527 2.527 0 0124 15.162a2.528 2.528 0 01-2.522 2.523h-6.313z" />
  </svg>
);

export default function DashboardClient({ userName, userEmail }: { userName: string; userEmail: string }) {
  const [status, setStatus] = useState<ConnectionStatus>({ github: false, gmail: false, slack: false });
  const [inputValue, setInputValue] = useState("");
  const [activePage, setActivePage] = useState("dashboard");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, append, isLoading } = useChat({ api: "/api/agent" });
  const isChatting = messages.length > 0;
  const firstName = (userName || "User").split(" ")[0];

  useEffect(() => {
    fetch("/api/status").then(r => r.json()).then(setStatus).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return;
    append({ role: "user", content: inputValue });
    setInputValue("");
  };

  const connectedCount = Object.values(status).filter(Boolean).length;

  const navItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "connections", label: "Connections" },
    { id: "history", label: "Audit Logs" },
    { id: "security", label: "Account" },
  ];

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c] w-full font-sans">

      {/* ── TOP NAV (Glassmorphism) ── */}
      <nav className="fixed top-0 w-full z-50 bg-white/40 backdrop-blur-xl border-b border-black/5">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-8 py-5">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center">
              <Shield size={13} className="text-white" />
            </div>
            <span className="font-headline font-extrabold text-lg tracking-tighter text-black">Anzen</span>
          </div>

          {/* Center nav links */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map(item => (
              <button key={item.id} onClick={() => setActivePage(item.id)}
                className={`font-headline font-medium text-sm tracking-tight transition-colors ${
                  activePage === item.id
                    ? "text-black border-b-2 border-black pb-0.5"
                    : "text-gray-400 hover:text-black"
                }`}>
                {item.label}
              </button>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <button className="text-gray-400 hover:text-black transition-colors"><Bell size={16} /></button>
            <button className="text-gray-400 hover:text-black transition-colors"><Settings size={16} /></button>
            <button
              onClick={() => setActivePage("dashboard")}
              className="flex items-center gap-2 bg-black text-white px-5 py-2 rounded-full font-headline font-bold text-sm hover:opacity-80 transition-opacity active:scale-95">
              <Plus size={13} />
              New Session
            </button>
          </div>
        </div>
      </nav>

      {/* ── PAGE CONTENT ── */}
      <main className="pt-24">

        {/* ════════════════════ DASHBOARD PAGE ════════════════════ */}
        {activePage === "dashboard" && (
          <>
            {/* Hero */}
            <section className="max-w-7xl mx-auto px-8 pt-16 pb-20">
              <div className="flex flex-col items-start max-w-4xl">
                {/* Chip */}
                <div className="flex items-center gap-2 mb-8 bg-white px-4 py-1.5 rounded-full border border-black/8 shadow-sm">
                  <Shield size={13} className="text-[#00e1ab]" />
                  <span className="text-xs font-bold font-mono tracking-widest uppercase text-[#1a1c1c]">
                    AI Security Platform
                  </span>
                </div>

                {/* Headline */}
                <h1 className="font-headline text-6xl md:text-7xl font-extrabold tracking-tighter mb-6 leading-[1.05]">
                  Hello, <span className="hero-gradient-text">{firstName}.</span>
                </h1>

                {/* Sub */}
                <p className="text-lg text-gray-500 max-w-xl leading-relaxed">
                  {connectedCount === 0
                    ? "Connect your accounts below to activate your security perimeter."
                    : `Your security perimeter is active — ${connectedCount} connection${connectedCount > 1 ? "s" : ""} secured and monitored.`}
                </p>
              </div>
            </section>

            {/* ── STAT CARDS ROW ── */}
            <section className="max-w-7xl mx-auto px-8 mb-20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Active Connections — purple */}
                <div className="bg-[#F3EEFE] rounded-[2rem] p-8 flex flex-col gap-5">
                  <span className="text-xs font-bold font-mono tracking-widest uppercase text-[#6B46C1]">Active Connections</span>
                  <div className="flex gap-3">
                    {[
                      { key: "github", href: "/auth/login?connection=github&returnTo=/dashboard", icon: <GitHubIcon />, color: "text-gray-800" },
                      { key: "gmail", href: "/auth/login?connection=google-oauth2&returnTo=/dashboard", icon: <GmailIcon />, color: "" },
                      { key: "slack", href: "/auth/login?connection=slack-oauth2&returnTo=/dashboard", icon: <SlackIcon />, color: "" },
                    ].map(p => (
                      <a key={p.key} href={status[p.key as keyof ConnectionStatus] ? "#" : p.href}
                        className={`relative w-12 h-12 rounded-xl bg-white/70 flex items-center justify-center shadow-sm ${p.color} hover:bg-white transition-all`}>
                        {p.icon}
                        {status[p.key as keyof ConnectionStatus] && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#00e1ab] border-2 border-[#F3EEFE]" />
                        )}
                      </a>
                    ))}
                  </div>
                  <div>
                    <p className="font-headline text-3xl font-extrabold tracking-tight text-black">
                      {connectedCount}<span className="text-base font-normal text-gray-400"> / 3</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">nodes secured</p>
                  </div>
                  <div className={`flex items-center gap-2 mt-auto`}>
                    <div className={`w-2 h-2 rounded-full ${connectedCount > 0 ? "bg-[#00e1ab]" : "bg-gray-300"}`} />
                    <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">
                      {connectedCount > 0 ? "Perimeter Active" : "No connections"}
                    </span>
                  </div>
                </div>

                {/* Vault Status — green */}
                <div className="bg-[#F0FDF4] rounded-[2rem] p-8 flex flex-col gap-5">
                  <span className="text-xs font-bold font-mono tracking-widest uppercase text-[#15803D]">Vault Status</span>
                  <div className="w-12 h-12 rounded-xl bg-white/70 shadow-sm flex items-center justify-center">
                    <Shield size={20} className="text-[#15803D]" />
                  </div>
                  <div>
                    <p className="font-headline text-3xl font-extrabold tracking-tight text-black">Locked</p>
                    <p className="text-sm text-gray-500 mt-1">Token Vault synchronized</p>
                  </div>
                  <div className="flex items-center gap-2 mt-auto">
                    <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
                    <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">Auth0 Secured</span>
                  </div>
                </div>

                {/* Permission Model — blue */}
                <div className="bg-[#EFF6FF] rounded-[2rem] p-8 flex flex-col gap-5">
                  <span className="text-xs font-bold font-mono tracking-widest uppercase text-[#1D4ED8]">Permission Model</span>
                  <div className="flex flex-col gap-3 mt-1">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e] flex-shrink-0" />
                      <span className="text-sm text-gray-600">Watch — read only</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0" />
                      <span className="text-sm text-gray-600">Act — requires confirmation</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
                      <span className="text-sm text-gray-600">Sensitive — requires re-auth</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-auto">
                    <div className="w-2 h-2 rounded-full bg-[#1D4ED8]" />
                    <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">3-tier enforced</span>
                  </div>
                </div>
              </div>
            </section>

            {/* ── CHAT SECTION ── */}
            <section className="max-w-7xl mx-auto px-8 pb-32">
              <div className="bg-white rounded-[2rem] p-10 shadow-sm flex flex-col gap-6">

                {/* Messages */}
                {isChatting && (
                  <div className="flex flex-col gap-6 max-h-96 overflow-y-auto">
                    {messages.map((m, i) => (
                      <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] text-sm leading-relaxed ${
                          m.role === "user"
                            ? "bg-black text-white rounded-2xl rounded-tr-sm px-5 py-3.5"
                            : "text-gray-700"
                        }`}>
                          {m.role === "assistant" && (
                            <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-2">Anzen Agent</p>
                          )}
                          {m.content}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex gap-1.5 px-5 py-4 bg-gray-50 rounded-2xl w-fit">
                        {[0, 1, 2].map(i => (
                          <motion.div key={i} animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12 }}
                            className="w-1.5 h-1.5 bg-[#00e1ab] rounded-full" />
                        ))}
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}

                {/* Empty state */}
                {!isChatting && (
                  <div className="text-center py-6">
                    <p className="font-headline text-2xl font-bold text-black tracking-tight mb-2">
                      What should I analyze?
                    </p>
                    <p className="text-sm text-gray-400">Ask me to scan your connected accounts for security risks.</p>
                  </div>
                )}

                {/* Suggestion pills */}
                {!isChatting && (
                  <div className="flex gap-3 flex-wrap justify-center">
                    {SUGGESTIONS.map(s => (
                      <button key={s} onClick={() => setInputValue(s)}
                        className="px-5 py-2.5 rounded-full bg-gray-50 border border-gray-200 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-black transition-all">
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input bar */}
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 focus-within:border-black/30 transition-all">
                  <Zap size={15} className="text-[#00e1ab] flex-shrink-0" />
                  <input
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSend()}
                    placeholder="Ask Anzen to analyze your security perimeter..."
                    className="flex-1 bg-transparent outline-none text-sm text-black placeholder-gray-400"
                  />
                  <span className="text-[10px] font-mono text-gray-300 border border-gray-200 rounded px-1.5 py-0.5 hidden md:inline">⌘K</span>
                  <button onClick={handleSend} disabled={!inputValue.trim() || isLoading}
                    className="w-9 h-9 rounded-xl bg-black flex items-center justify-center disabled:opacity-20 hover:opacity-80 transition-opacity active:scale-95">
                    <ArrowUp size={14} className="text-white" strokeWidth={3} />
                  </button>
                </div>

                {/* Status line */}
                <div className="flex justify-end">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00e1ab]" />
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">System Optimal</span>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ════════════════════ CONNECTIONS PAGE ════════════════════ */}
        {activePage === "connections" && (
          <>
            <section className="max-w-7xl mx-auto px-8 pt-16 pb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-black/8 shadow-sm">
                  <span className="text-xs font-bold font-mono tracking-widest uppercase">
                    {connectedCount} nodes secure
                  </span>
                </div>
              </div>
              <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter mb-4 leading-tight">
                Your <span className="hero-gradient-text">connections.</span>
              </h1>
              <p className="text-lg text-gray-500 max-w-xl leading-relaxed">
                Manage your data pipeline and security nodes. Connect accounts to activate real-time monitoring.
              </p>
            </section>

            {/* Connection Cards — alternating layout */}
            <div className="space-y-8 max-w-7xl mx-auto px-8 pb-32">

              {/* GitHub — purple, text left / icon right */}
              <div className="bg-[#F3EEFE] rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row items-center p-10 md:p-16 gap-12">
                <div className="flex-1 space-y-5 order-2 md:order-1">
                  <span className="text-xs font-bold font-mono tracking-widest uppercase text-[#6B46C1]">Repository Security</span>
                  <h2 className="font-headline text-4xl font-extrabold tracking-tight text-black">GitHub</h2>
                  <p className="text-gray-500 leading-relaxed">
                    Monitor repository access, scan for exposed secrets, detect suspicious commit activity, and audit collaborator permissions in real time.
                  </p>
                  <div className="flex flex-wrap gap-4 pt-2">
                    <a href={status.github ? "#" : "/auth/login?connection=github&returnTo=/dashboard"}
                      className="bg-black text-white px-8 py-3 rounded-full font-headline font-bold text-sm hover:opacity-80 transition-all active:scale-95">
                      {status.github ? "Manage" : "Connect GitHub"}
                    </a>
                    {status.github && (
                      <span className="flex items-center gap-2 bg-white/60 backdrop-blur px-6 py-3 rounded-full text-sm font-bold border border-black/5">
                        <div className="w-2 h-2 rounded-full bg-[#22c55e]" /> Connected
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-1 order-1 md:order-2 flex items-center justify-center">
                  <div className="w-40 h-40 rounded-3xl bg-white/60 shadow-lg flex items-center justify-center text-gray-800">
                    <GitHubIcon />
                  </div>
                </div>
              </div>

              {/* Gmail — warm yellow, icon left / text right */}
              <div className="bg-[#FFFBEB] rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row-reverse items-center p-10 md:p-16 gap-12">
                <div className="flex-1 space-y-5">
                  <span className="text-xs font-bold font-mono tracking-widest uppercase text-[#B45309]">Communications Security</span>
                  <h2 className="font-headline text-4xl font-extrabold tracking-tight text-black">Gmail</h2>
                  <p className="text-gray-500 leading-relaxed">
                    Secure your email pipeline. Detect phishing vectors, audit OAuth app permissions, and monitor for data exfiltration patterns in attachments.
                  </p>
                  <div className="flex flex-wrap gap-4 pt-2">
                    <a href={status.gmail ? "#" : "/auth/login?connection=google-oauth2&returnTo=/dashboard"}
                      className="bg-black text-white px-8 py-3 rounded-full font-headline font-bold text-sm hover:opacity-80 transition-all active:scale-95">
                      {status.gmail ? "Manage" : "Connect Gmail"}
                    </a>
                    {status.gmail && (
                      <span className="flex items-center gap-2 bg-white/60 backdrop-blur px-6 py-3 rounded-full text-sm font-bold border border-black/5">
                        <div className="w-2 h-2 rounded-full bg-[#22c55e]" /> Connected
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-40 h-40 rounded-3xl bg-white/60 shadow-lg flex items-center justify-center">
                    <GmailIcon />
                  </div>
                </div>
              </div>

              {/* Slack — green, text left / icon right */}
              <div className="bg-[#F0FDF4] rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row items-center p-10 md:p-16 gap-12">
                <div className="flex-1 space-y-5 order-2 md:order-1">
                  <span className="text-xs font-bold font-mono tracking-widest uppercase text-[#15803D]">Workspace Security</span>
                  <h2 className="font-headline text-4xl font-extrabold tracking-tight text-black">Slack</h2>
                  <p className="text-gray-500 leading-relaxed">
                    Audit internal threads for DLP compliance, detect insider threats, monitor for credential sharing, and surface anomalous login patterns.
                  </p>
                  <div className="flex flex-wrap gap-4 pt-2">
                    <a href={status.slack ? "#" : "/auth/login?connection=slack-oauth2&returnTo=/dashboard"}
                      className="bg-black text-white px-8 py-3 rounded-full font-headline font-bold text-sm hover:opacity-80 transition-all active:scale-95">
                      {status.slack ? "Manage" : "Connect Slack"}
                    </a>
                    {status.slack && (
                      <span className="flex items-center gap-2 bg-white/60 backdrop-blur px-6 py-3 rounded-full text-sm font-bold border border-black/5">
                        <div className="w-2 h-2 rounded-full bg-[#22c55e]" /> Connected
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-1 order-1 md:order-2 flex items-center justify-center">
                  <div className="w-40 h-40 rounded-3xl bg-white/60 shadow-lg flex items-center justify-center">
                    <SlackIcon />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ════════════════════ AUDIT LOGS PAGE ════════════════════ */}
        {activePage === "history" && (
          <>
            <section className="max-w-7xl mx-auto px-8 pt-16 pb-12">
              <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter mb-4 leading-tight">
                Audit Logs.
              </h1>
              <p className="text-lg text-gray-500 leading-relaxed">Complete record of all agent actions and security events.</p>
            </section>
            <section className="max-w-7xl mx-auto px-8 pb-32">
              <div className="bg-white rounded-[2rem] p-16 flex flex-col items-center justify-center text-center gap-4 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                  <Shield size={22} className="text-gray-300" />
                </div>
                <p className="font-headline text-xl font-bold text-black tracking-tight">No audit logs yet</p>
                <p className="text-sm text-gray-400 max-w-xs">
                  Start an AI session on the Dashboard to generate your first security audit log.
                </p>
                <button onClick={() => setActivePage("dashboard")}
                  className="mt-2 bg-black text-white px-8 py-3 rounded-full font-headline font-bold text-sm hover:opacity-80 transition-opacity active:scale-95">
                  Start Session
                </button>
              </div>
            </section>
          </>
        )}

        {/* ════════════════════ ACCOUNT PAGE ════════════════════ */}
        {activePage === "security" && (
          <>
            <section className="max-w-7xl mx-auto px-8 pt-16 pb-12">
              <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter mb-4 leading-tight">
                Account.
              </h1>
              <p className="text-lg text-gray-500">{userEmail}</p>
            </section>
            <section className="max-w-7xl mx-auto px-8 pb-32 space-y-4">
              <div className="bg-white rounded-[2rem] p-8 shadow-sm flex items-center justify-between">
                <div>
                  <p className="font-headline font-bold text-black tracking-tight">Authentication</p>
                  <p className="text-sm text-gray-400 mt-1">Signed in via Auth0. Session secured.</p>
                </div>
                <div className="flex items-center gap-2 bg-[#F0FDF4] px-4 py-2 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
                  <span className="text-xs font-mono font-bold text-[#15803D] uppercase tracking-widest">Active</span>
                </div>
              </div>
              <div className="bg-white rounded-[2rem] p-8 shadow-sm flex items-center justify-between">
                <div>
                  <p className="font-headline font-bold text-black tracking-tight">Token Vault</p>
                  <p className="text-sm text-gray-400 mt-1">Auth0 Token Vault securing all OAuth credentials.</p>
                </div>
                <div className="flex items-center gap-2 bg-[#F0FDF4] px-4 py-2 rounded-full">
                  <Shield size={12} className="text-[#15803D]" />
                  <span className="text-xs font-mono font-bold text-[#15803D] uppercase tracking-widest">Locked</span>
                </div>
              </div>
              <div className="bg-white rounded-[2rem] p-8 shadow-sm flex items-center justify-between">
                <div>
                  <p className="font-headline font-bold text-black tracking-tight">Sign Out</p>
                  <p className="text-sm text-gray-400 mt-1">End your current session securely.</p>
                </div>
                <a href="/auth/logout"
                  className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-5 py-2.5 rounded-full text-sm font-bold text-gray-600 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all">
                  <LogOut size={13} />
                  Sign Out
                </a>
              </div>
            </section>
          </>
        )}

        {/* ── CTA BAND ── */}
        <section className="max-w-7xl mx-auto px-8 py-16">
          <div className="bg-black rounded-[2.5rem] p-14 md:p-20 text-center space-y-8">
            <h2 className="font-headline text-4xl md:text-5xl font-extrabold text-white tracking-tighter leading-tight max-w-2xl mx-auto">
              Secure your digital perimeter.
            </h2>
            <p className="text-white/50 text-lg max-w-md mx-auto">
              AI-native security monitoring, active 24/7 across all your connected accounts.
            </p>
            <div className="flex justify-center">
              <button onClick={() => setActivePage("connections")}
                className="bg-white text-black px-12 py-4 rounded-full font-headline font-extrabold text-base hover:bg-gray-100 transition-all active:scale-95">
                Connect Accounts
              </button>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="w-full py-16 px-8 bg-gray-50 border-t border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto">
            <div className="flex items-center gap-2.5 mb-6 md:mb-0">
              <div className="w-6 h-6 rounded-md bg-black flex items-center justify-center">
                <Shield size={11} className="text-white" />
              </div>
              <span className="text-sm text-gray-400">© 2024 Anzen AI. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="text-gray-400 hover:text-black transition-colors p-2 rounded-lg hover:bg-gray-100">
                <HelpCircle size={15} />
              </button>
              <a href="/auth/logout" className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-500 transition-colors px-4 py-2 rounded-lg hover:bg-gray-100">
                <LogOut size={14} />
                Sign Out
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
