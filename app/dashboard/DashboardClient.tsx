"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { motion } from "framer-motion";
import {
  ArrowUp, Shield, ShieldCheck, Zap, Plus, Bell, Settings, LogOut, HelpCircle,
  Bot, Plug2, FileText, User, Database, Lock, ArrowRight,
} from "lucide-react";

type ConnectionStatus = { github: boolean; gmail: boolean; slack: boolean };

const SUGGESTIONS = [
  "Scan GitHub for secrets",
  "Analyze recent Slack login",
  "Audit Gmail permissions",
];

const GitHubIcon = ({ size = 22 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className="text-[#e7e5e4]">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
);

const GmailIcon = ({ size = 22 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size}>
    <path fill="#EA4335" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
  </svg>
);

const SlackIcon = ({ size = 22 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size}>
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
  const { messages, sendMessage, status: chatStatus } = useChat();
  const isLoading = chatStatus === "streaming" || chatStatus === "submitted";
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
    sendMessage({ text: inputValue });
    setInputValue("");
  };

  const connectedCount = Object.values(status).filter(Boolean).length;

  const sideNavItems = [
    { id: "dashboard", label: "AI Assistant", icon: <Bot size={18} /> },
    { id: "connections", label: "Integrations", icon: <Plug2 size={18} /> },
    { id: "history", label: "Audit Logs", icon: <FileText size={18} /> },
    { id: "security", label: "Account", icon: <User size={18} /> },
  ];

  const topNavItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "connections", label: "Connections" },
    { id: "history", label: "History" },
    { id: "security", label: "Security" },
  ];

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-[#e7e5e4] flex selection:bg-[#00e1ab]/30 font-body">
      {/* ── SIDEBAR ── */}
      <aside className="hidden md:flex sticky top-0 h-screen w-64 flex-shrink-0 flex-col bg-[#0e0e0e] border-r border-[#484848]/15 p-6 z-50">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 rounded-lg bg-[#00FFC2]/10 flex items-center justify-center border border-[#00FFC2]/20 shadow-[0_0_15px_rgba(0,255,194,0.1)]">
            <Shield size={18} className="text-[#00FFC2]" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#00FFC2] tracking-tight leading-none [font-family:var(--font-manrope)]">
              Anzen AI
            </h1>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#00FFC2]/60 mt-1.5">Intelligence</p>
          </div>
        </div>

        {/* New Session */}
        <button
          onClick={() => setActivePage("dashboard")}
          className="w-full py-3 px-4 mb-8 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-[#00e1ab] to-[#00513c] text-[#004a36] font-bold text-sm active:scale-95 duration-200"
        >
          <Plus size={15} />
          New Session
        </button>

        {/* Nav items */}
        <nav className="flex-1 space-y-1">
          {sideNavItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all hover:translate-x-1 duration-300 ${
                activePage === item.id
                  ? "bg-[#1f2020] text-[#00FFC2]"
                  : "text-[#acabaa] hover:text-[#e7e5e4] hover:bg-[#131313]"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="mt-auto pt-6 border-t border-[#484848]/15 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-[#acabaa] hover:text-[#e7e5e4] text-sm font-medium transition-all rounded-lg hover:bg-[#131313]">
            <HelpCircle size={16} />
            Support
          </button>
          <a
            href="/auth/logout"
            className="flex items-center gap-3 px-4 py-2.5 text-red-400/80 hover:text-red-400 text-sm font-medium transition-all rounded-lg hover:bg-[#131313]"
          >
            <LogOut size={16} />
            Sign Out
          </a>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">

        {/* TOP HEADER */}
        <header className="sticky top-0 bg-[#0e0e0e] z-40 border-b border-[#484848]/10">
          <div className="flex justify-between items-center w-full px-8 py-4">
            {/* Top nav links */}
            <nav className="hidden md:flex items-center gap-8">
              {topNavItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`text-sm font-medium tracking-tight transition-colors ${
                    activePage === item.id
                      ? "text-[#00FFC2] border-b-2 border-[#00FFC2] pb-1"
                      : "text-[#acabaa] hover:text-[#e7e5e4]"
                  } [font-family:var(--font-manrope)]`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-3 ml-auto">
              <button className="p-2 text-[#acabaa] hover:bg-[#1f2020] rounded-lg transition-all active:scale-95">
                <Bell size={18} />
              </button>
              <button className="p-2 text-[#acabaa] hover:bg-[#1f2020] rounded-lg transition-all active:scale-95">
                <Settings size={18} />
              </button>
              <div className="w-8 h-8 rounded-full bg-[#1f2020] border border-[#484848]/20 flex items-center justify-center text-xs font-bold text-[#00e1ab] ml-2">
                {firstName[0]}
              </div>
            </div>
          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        <div className="flex-1 overflow-y-auto">

          {/* ════ DASHBOARD PAGE ════ */}
          {activePage === "dashboard" && (
            <section className="max-w-[1200px] mx-auto w-full px-8 pt-12 pb-24 flex flex-col gap-16">

              {/* Welcome */}
              <div>
                <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight text-[#e7e5e4] mb-2 [font-family:var(--font-manrope)]">
                  Hello, {firstName}.
                </h2>
                <p className="text-[#acabaa] text-lg font-light">
                  {connectedCount === 0
                    ? "Connect your accounts to activate your security perimeter."
                    : `Your security perimeter is active. ${connectedCount} connection${connectedCount > 1 ? "s" : ""} secured.`}
                </p>
              </div>

              {/* Bento Grid */}
              <div className="grid grid-cols-12 gap-6">

                {/* Active Connections Card */}
                <div className="col-span-12 lg:col-span-4 bg-[#131313] p-8 rounded-2xl flex flex-col justify-between group hover:bg-[#191a1a] transition-colors duration-500">
                  <div>
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-[#acabaa]">Active Connections</h3>
                      <span className={`w-2 h-2 rounded-full ${connectedCount > 0 ? "bg-[#00e1ab] animate-pulse shadow-[0_0_8px_#00e1ab]" : "bg-[#484848]"}`} />
                    </div>
                    <div className="flex gap-3">
                      {[
                        { key: "github", href: "/auth/login?connection=github&returnTo=/dashboard", icon: <GitHubIcon /> },
                        { key: "gmail", href: "/auth/login?connection=google-oauth2&returnTo=/dashboard", icon: <GmailIcon /> },
                        { key: "slack", href: "/auth/login?connection=slack-oauth2&returnTo=/dashboard", icon: <SlackIcon /> },
                      ].map(p => (
                        <a
                          key={p.key}
                          href={status[p.key as keyof ConnectionStatus] ? "#" : p.href}
                          className={`relative w-12 h-12 rounded-lg bg-[#1f2020] flex items-center justify-center border transition-all group-hover:border-[#00e1ab]/20 ${
                            status[p.key as keyof ConnectionStatus]
                              ? "border-[#00e1ab]/30"
                              : "border-[#484848]/10"
                          }`}
                        >
                          {p.icon}
                          {status[p.key as keyof ConnectionStatus] && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#00e1ab] border-2 border-[#131313]" />
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                  <div className="mt-12">
                    <p className="text-2xl font-bold text-[#e7e5e4] mb-1 [font-family:var(--font-manrope)]">
                      99.9% Uptime
                    </p>
                    <p className="text-xs text-[#acabaa]">Real-time encryption monitoring enabled</p>
                  </div>
                </div>

                {/* Threat Intelligence Card */}
                <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-[#131313] p-8 rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <ShieldCheck size={64} className="text-[#00e1ab]" />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#acabaa] mb-8">Threat Intelligence</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-2 border-b border-[#484848]/10">
                        <span className="text-xs font-medium text-[#e7e5e4]">Anomaly Detection</span>
                        <span className="text-xs text-[#00e1ab] font-bold">Stable</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-[#484848]/10">
                        <span className="text-xs font-medium text-[#e7e5e4]">Network Latency</span>
                        <span className="text-xs text-[#acabaa]">24ms</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-xs font-medium text-[#e7e5e4]">Active Scans</span>
                        <span className="text-xs text-[#acabaa]">0</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vault Status Card */}
                <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-[#131313] rounded-2xl relative overflow-hidden min-h-[240px]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(0,225,171,0.18)_0%,rgba(0,81,60,0.12)_40%,transparent_70%)]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-[#131313]/40 to-transparent" />
                  <div className="absolute top-6 right-6 w-14 h-14 rounded-xl bg-[#00e1ab]/10 border border-[#00e1ab]/20 flex items-center justify-center">
                    <ShieldCheck size={24} className="text-[#00e1ab]" />
                  </div>
                  <div className="absolute bottom-0 left-0 p-8">
                    <h3 className="text-xl font-bold text-[#e7e5e4] [font-family:var(--font-manrope)]">
                      Vault Status
                    </h3>
                    <p className="text-xs text-[#00e1ab] font-bold uppercase tracking-widest mt-1">Locked &amp; Synchronized</p>
                  </div>
                </div>
              </div>

              {/* AI Interaction Area */}
              <div className="flex flex-col items-center max-w-4xl mx-auto w-full gap-6">

                {/* Chat messages */}
                {isChatting && (
                  <div className="w-full flex flex-col gap-6 max-h-80 overflow-y-auto">
                    {messages.map((m, i) => (
                      <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] text-sm leading-relaxed ${
                            m.role === "user"
                              ? "bg-[#1f2020] rounded-2xl rounded-tr-sm px-4 py-3 border border-[#484848]/20"
                              : "text-[#acabaa]"
                          }`}
                        >
                          {m.parts.filter(p => p.type === "text").map((p, j) => (
                            <span key={j}>{(p as { type: "text"; text: string }).text}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex gap-1.5 px-4 py-3 bg-[#1f2020] rounded-2xl w-fit border border-[#484848]/20">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                            className="w-1.5 h-1.5 bg-[#00e1ab]/60 rounded-full"
                          />
                        ))}
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}

                {/* Suggestion Pills */}
                {!isChatting && (
                  <div className="flex flex-wrap justify-center gap-3">
                    {SUGGESTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => setInputValue(s)}
                        className="px-5 py-2.5 rounded-full border border-[#484848]/20 hover:border-[#00e1ab]/40 hover:bg-[#1f2020] transition-all text-sm font-medium text-[#acabaa] hover:text-[#e7e5e4]"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {/* Command Bar */}
                <div className="w-full rounded-full p-2 border border-[#484848]/15 shadow-2xl bg-[#1f2020]/70 backdrop-blur-xl focus-within:border-[#00e1ab]/30 transition-all">
                  <div className="flex items-center px-4 py-2">
                    <Zap size={18} className="text-[#00e1ab] mr-4 flex-shrink-0" />
                    <input
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleSend()}
                      placeholder="Ask Anzen to analyze your security perimeter..."
                      className="flex-1 bg-transparent border-none outline-none text-[#e7e5e4] placeholder-[#acabaa]/50 text-base font-light"
                    />
                    <div className="flex items-center gap-2">
                      <span className="hidden md:inline text-[10px] px-2 py-1 bg-[#252626] rounded border border-[#484848]/30 text-[#acabaa] font-bold tracking-widest uppercase">
                        ⌘K
                      </span>
                      <button
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isLoading}
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-[#00e1ab] to-[#00513c] text-[#004a36] hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
                      >
                        <ArrowUp size={18} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ════ CONNECTIONS PAGE ════ */}
          {activePage === "connections" && (
            <div className="max-w-[1200px] mx-auto w-full px-8 lg:px-20 py-12">
              <header className="mb-16">
                <h1 className="text-5xl font-extrabold tracking-tight text-[#e7e5e4] mb-4 [font-family:var(--font-manrope)]">
                  Connections
                </h1>
                <p className="text-[#acabaa] text-lg max-w-2xl leading-relaxed">
                  Manage your enterprise data pipeline and security nodes. Authenticate new services to expand Anzen&apos;s protection layer across your stack.
                </p>
              </header>

              {/* Active Connections */}
              <section className="mb-20">
                <div className="flex justify-between items-end mb-8">
                  <h2 className="text-2xl font-bold text-[#e7e5e4] [font-family:var(--font-manrope)]">
                    Active Connections
                  </h2>
                  <span className="text-[#00e1ab] font-mono text-xs font-bold tracking-widest uppercase">
                    {connectedCount} Nodes Secure
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[
                    { key: "github", label: "GitHub", desc: "Monitoring repository access and secret leaks.", href: "/auth/login?connection=github&returnTo=/dashboard", icon: <GitHubIcon size={28} /> },
                    { key: "gmail", label: "Gmail", desc: "Securing communications and attachment vectors.", href: "/auth/login?connection=google-oauth2&returnTo=/dashboard", icon: <GmailIcon size={28} /> },
                    { key: "slack", label: "Slack", desc: "Auditing internal threads for DLP compliance.", href: "/auth/login?connection=slack-oauth2&returnTo=/dashboard", icon: <SlackIcon size={28} /> },
                  ].map(p => (
                    <div
                      key={p.key}
                      className="group bg-[#131313] p-8 rounded-2xl border border-transparent hover:border-[#00e1ab]/20 transition-all duration-500 flex flex-col justify-between gap-12"
                    >
                      <div className="flex justify-between items-start">
                        <div className="w-14 h-14 bg-[#252626] flex items-center justify-center rounded-2xl group-hover:scale-110 transition-transform duration-500">
                          {p.icon}
                        </div>
                        {status[p.key as keyof ConnectionStatus] && (
                          <div className="flex items-center gap-2 bg-[#00e1ab]/10 px-3 py-1 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-[#00e1ab]" />
                            <span className="text-[10px] font-bold text-[#00e1ab] uppercase tracking-tighter">Connected</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-1 text-[#e7e5e4] [font-family:var(--font-manrope)]">
                          {p.label}
                        </h3>
                        <p className="text-[#acabaa] text-sm mb-6">{p.desc}</p>
                        <a
                          href={status[p.key as keyof ConnectionStatus] ? "#" : p.href}
                          className="block w-full bg-[#1f2020] hover:bg-[#252626] text-[#e7e5e4] py-3 rounded-xl font-bold text-sm text-center transition-all border border-[#484848]/20"
                        >
                          {status[p.key as keyof ConnectionStatus] ? "Manage" : "Connect"}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Available Integrations */}
              <section>
                <div className="flex justify-between items-end mb-8">
                  <h2 className="text-2xl font-bold text-[#e7e5e4] [font-family:var(--font-manrope)]">
                    Available Integrations
                  </h2>
                  <button className="text-[#00d19f] hover:text-[#00e1ab] transition-colors text-sm font-bold flex items-center gap-2">
                    View Marketplace <ArrowRight size={16} />
                  </button>
                </div>
                <div className="space-y-4">
                  {[
                    { icon: <Database size={20} className="text-[#acabaa]" />, label: "Amazon S3", desc: "Cloud storage integrity monitoring" },
                    { icon: <Lock size={20} className="text-[#acabaa]" />, label: "Okta", desc: "Identity management and IAM audits" },
                    { icon: <FileText size={20} className="text-[#acabaa]" />, label: "Notion", desc: "Knowledge base protection" },
                  ].map(item => (
                    <div
                      key={item.label}
                      className="group flex items-center justify-between p-6 rounded-2xl bg-black border border-[#484848]/10 hover:bg-[#131313] transition-all"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-[#1f2020] rounded-xl flex items-center justify-center">
                          {item.icon}
                        </div>
                        <div>
                          <h4 className="font-bold text-[#e7e5e4]">{item.label}</h4>
                          <p className="text-xs text-[#acabaa]">{item.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <span className="hidden md:block text-[10px] font-bold text-[#5c5b5b] uppercase tracking-widest">Disconnected</span>
                        <button
                          className="px-6 py-2 rounded-lg font-bold text-sm bg-gradient-to-br from-[#00e1ab] to-[#00513c] text-[#004a36] transition-all active:scale-95"
                        >
                          Connect
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* ════ AUDIT LOGS PAGE ════ */}
          {activePage === "history" && (
            <div className="max-w-[1200px] mx-auto w-full px-8 py-12">
              <h1 className="text-5xl font-extrabold tracking-tight text-[#e7e5e4] mb-2 [font-family:var(--font-manrope)]">
                Audit Logs
              </h1>
              <p className="text-[#acabaa] text-lg mb-12">Complete record of all agent actions and security events.</p>
              <div className="bg-[#131313] rounded-2xl p-6 flex flex-col items-center justify-center h-48 gap-4">
                <Shield size={28} className="text-[#484848]" />
                <p className="text-[#484848] text-sm font-mono">No audit logs yet. Start a session to generate logs.</p>
              </div>
            </div>
          )}

          {/* ════ ACCOUNT PAGE ════ */}
          {activePage === "security" && (
            <div className="max-w-[1200px] mx-auto w-full px-8 py-12">
              <h1 className="text-5xl font-extrabold tracking-tight text-[#e7e5e4] mb-2 [font-family:var(--font-manrope)]">
                Account
              </h1>
              <p className="text-[#acabaa] text-lg mb-12">{userEmail}</p>
              <div className="space-y-4">
                <div className="bg-[#131313] rounded-2xl p-6 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#e7e5e4]">Authentication</p>
                    <p className="text-sm text-[#acabaa] mt-1">Signed in via Auth0. Session secured.</p>
                  </div>
                  <div className="flex items-center gap-2 bg-[#00e1ab]/10 px-4 py-1.5 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-[#00e1ab]" />
                    <span className="text-xs font-mono font-bold text-[#00e1ab] uppercase tracking-widest">Active</span>
                  </div>
                </div>
                <div className="bg-[#131313] rounded-2xl p-6 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#e7e5e4]">Token Vault</p>
                    <p className="text-sm text-[#acabaa] mt-1">Auth0 Token Vault securing all OAuth credentials.</p>
                  </div>
                  <div className="flex items-center gap-2 bg-[#00e1ab]/10 px-4 py-1.5 rounded-full">
                    <Shield size={12} className="text-[#00e1ab]" />
                    <span className="text-xs font-mono font-bold text-[#00e1ab] uppercase tracking-widest">Locked</span>
                  </div>
                </div>
                <div className="bg-[#131313] rounded-2xl p-6 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#e7e5e4]">Sign Out</p>
                    <p className="text-sm text-[#acabaa] mt-1">End your current session securely.</p>
                  </div>
                  <a
                    href="/auth/logout"
                    className="flex items-center gap-2 bg-[#1f2020] border border-[#484848]/20 px-5 py-2.5 rounded-full text-sm font-bold text-[#acabaa] hover:text-red-400 hover:border-red-400/20 transition-all"
                  >
                    <LogOut size={13} />
                    Sign Out
                  </a>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ── FLOATING BADGE ── */}
      <div className="fixed bottom-8 right-8 z-50 hidden md:block">
        <div className="flex items-center gap-3 bg-[#1f2020] px-4 py-2 rounded-full border border-[#484848]/20">
          <div className="flex -space-x-1.5">
            <div className="w-5 h-5 rounded-full bg-[#252626] border border-[#0e0e0e] flex items-center justify-center">
              <Shield size={10} className="text-[#acabaa]" />
            </div>
            <div className="w-5 h-5 rounded-full bg-[#252626] border border-[#0e0e0e] flex items-center justify-center">
              <Zap size={10} className="text-[#acabaa]" />
            </div>
          </div>
          <span className="text-[10px] font-bold tracking-widest uppercase text-[#acabaa]">System Optimal</span>
        </div>
      </div>

    </div>
  );
}
