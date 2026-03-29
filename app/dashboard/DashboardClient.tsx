"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { ArrowUp, Plug, History, Shield, HelpCircle, LogOut, Bell, Settings, Plus, Zap } from "lucide-react";

type ConnectionStatus = { github: boolean; gmail: boolean; slack: boolean };

const SUGGESTIONS = [
  "Scan GitHub for secrets",
  "Analyze recent Slack login",
  "Audit Gmail permissions",
];

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

  return (
    <div className="flex min-h-screen bg-[#0e0e0e] text-white w-full">

      {/* LEFT SIDEBAR */}
      <aside className="w-56 flex-shrink-0 bg-[#131313] flex flex-col py-6 px-4 gap-2">
        {/* Logo */}
        <div className="flex items-center gap-2 px-2 mb-6">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00e1ab] to-[#00513c] flex items-center justify-center">
            <Shield size={14} className="text-black" />
          </div>
          <div>
            <p className="font-bold text-sm leading-none">Anzen AI</p>
            <p className="text-[9px] text-white/30 tracking-widest font-mono">INTELLIGENCE</p>
          </div>
        </div>

        {/* New Session Button */}
        <button className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-[#00e1ab] to-[#00513c] text-black font-semibold text-sm mb-4 hover:opacity-90 transition-opacity">
          <Plus size={14} />
          New Session
        </button>

        {/* Nav Items */}
        {[
          { id: "dashboard", label: "AI Assistant", icon: <Zap size={15} /> },
          { id: "connections", label: "Integrations", icon: <Plug size={15} /> },
          { id: "history", label: "Audit Logs", icon: <History size={15} /> },
          { id: "security", label: "Account", icon: <Shield size={15} /> },
        ].map(item => (
          <button key={item.id} onClick={() => setActivePage(item.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${activePage === item.id ? "bg-[#1f2020] text-white font-medium" : "text-white/40 hover:text-white/70 hover:bg-white/5"}`}>
            {item.icon}
            {item.label}
          </button>
        ))}

        {/* Bottom */}
        <div className="mt-auto flex flex-col gap-1">
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/30 hover:text-white/60 transition-colors">
            <HelpCircle size={15} />
            Support
          </button>
          <a href="/auth/logout" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/30 hover:text-red-400 transition-colors">
            <LogOut size={15} />
            Sign Out
          </a>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Top Nav */}
        <header className="flex items-center justify-between px-8 py-4 border-b border-white/5">
          {["dashboard", "connections", "history", "security"].map((page, i) => (
            <button key={page} onClick={() => setActivePage(page)}
              className={`text-sm capitalize transition-colors ${activePage === page ? "text-white border-b-2 border-[#00e1ab] pb-1" : "text-white/30 hover:text-white/60"}`}>
              {["Dashboard", "Connections", "History", "Security"][i]}
            </button>
          ))}
          <div className="flex items-center gap-3 ml-auto">
            <button className="text-white/30 hover:text-white transition-colors"><Bell size={16} /></button>
            <button className="text-white/30 hover:text-white transition-colors"><Settings size={16} /></button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00e1ab] to-[#00513c] flex items-center justify-center text-black text-xs font-bold">
              {firstName[0]}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto px-8 py-8">

          {activePage === "dashboard" && (
            <div className="flex flex-col gap-8 max-w-4xl">

              {/* Greeting */}
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Hello, {firstName}.</h1>
                <p className="text-white/40 text-sm mt-1">
                  {connectedCount === 0 ? "Connect your accounts to get started." : `Your security perimeter is active. ${connectedCount} connection${connectedCount > 1 ? "s" : ""} secured.`}
                </p>
              </div>

              {/* Cards Row */}
              <div className="grid grid-cols-3 gap-4">

                {/* Active Connections Card */}
                <div className="bg-[#131313] rounded-2xl p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-mono text-white/30 tracking-widest">ACTIVE CONNECTIONS</p>
                    <div className={`w-2 h-2 rounded-full ${connectedCount > 0 ? "bg-[#00e1ab] shadow-[0_0_6px_#00e1ab]" : "bg-white/10"}`} />
                  </div>
                  <div className="flex gap-2">
                    {[
                      { key: "github", href: "/auth/login?connection=github&returnTo=/dashboard", bg: "bg-[#1a1a1a]", icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg> },
                      { key: "gmail", href: "/auth/login?connection=google-oauth2&returnTo=/dashboard", bg: "bg-[#1a0a0a]", icon: <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#EA4335" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/></svg> },
                      { key: "slack", href: "/auth/login?connection=slack-oauth2&returnTo=/dashboard", bg: "bg-[#0a0a1a]", icon: <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#E01E5A" d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313z"/><path fill="#36C5F0" d="M8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312z"/><path fill="#2EB67D" d="M18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zm-1.271 0a2.528 2.528 0 01-2.523 2.521 2.527 2.527 0 01-2.52-2.521V2.522A2.527 2.527 0 0115.162 0a2.528 2.528 0 012.523 2.522v6.312z"/><path fill="#ECB22E" d="M15.165 18.956a2.528 2.528 0 012.523 2.522A2.528 2.528 0 0115.165 24a2.527 2.527 0 01-2.52-2.522v-2.522h2.52zm0-1.271a2.527 2.527 0 01-2.52-2.523 2.526 2.526 0 012.52-2.52h6.313A2.527 2.527 0 0124 15.162a2.528 2.528 0 01-2.522 2.523h-6.313z"/></svg> },
                    ].map(p => (
                      <a key={p.key} href={status[p.key as keyof ConnectionStatus] ? "#" : p.href}
                        className={`relative w-10 h-10 rounded-xl ${p.bg} flex items-center justify-center border border-white/10 hover:border-white/20 transition-all`}>
                        {p.icon}
                        {status[p.key as keyof ConnectionStatus] && (
                          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#00e1ab] border-2 border-[#131313]" />
                        )}
                      </a>
                    ))}
                  </div>
                  <div>
                    <p className="text-2xl font-bold">99.9% <span className="text-sm font-normal text-white/30">Uptime</span></p>
                    <p className="text-xs text-white/30 mt-0.5">Real-time encryption monitoring enabled</p>
                  </div>
                </div>

                {/* Vault Status Card */}
                <div className="bg-[#131313] rounded-2xl p-5 flex flex-col gap-3">
                  <p className="text-xs font-mono text-white/30 tracking-widest">VAULT STATUS</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="w-10 h-10 rounded-xl bg-[#00e1ab]/10 border border-[#00e1ab]/20 flex items-center justify-center">
                      <Shield size={18} className="text-[#00e1ab]" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Token Vault</p>
                      <p className="text-[#00e1ab] text-xs font-mono">LOCKED & SYNCHRONIZED</p>
                    </div>
                  </div>
                  <p className="text-xs text-white/30 mt-auto">Auth0 Token Vault securing all OAuth credentials</p>
                </div>

                {/* Permission Tiers Card */}
                <div className="bg-[#131313] rounded-2xl p-5 flex flex-col gap-3">
                  <p className="text-xs font-mono text-white/30 tracking-widest">PERMISSION MODEL</p>
                  <div className="flex flex-col gap-2 mt-1">
                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#00e1ab]" /><span className="text-xs text-white/60">Watch — read only</span></div>
                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-400" /><span className="text-xs text-white/60">Act — requires confirmation</span></div>
                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-500" /><span className="text-xs text-white/60">Sensitive — requires re-auth</span></div>
                  </div>
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex flex-col gap-4">
                {isChatting && (
                  <div className="flex flex-col gap-6 max-h-80 overflow-y-auto">
                    {messages.map((m, i) => (
                      <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] ${m.role === "user" ? "bg-[#1f2020] rounded-2xl rounded-tr-sm px-4 py-3 text-sm" : "text-sm text-white/80"}`}>
                          {m.content}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex gap-1.5 px-4 py-3 bg-white/5 rounded-2xl w-fit">
                        {[0,1,2].map(i => (
                          <motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                            className="w-1.5 h-1.5 bg-[#00e1ab]/60 rounded-full" />
                        ))}
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}

                {/* Suggestion Pills */}
                {!isChatting && (
                  <div className="flex gap-3 flex-wrap">
                    {SUGGESTIONS.map(s => (
                      <button key={s} onClick={() => setInputValue(s)}
                        className="px-4 py-2 rounded-full bg-[#131313] border border-white/10 text-xs text-white/40 hover:text-white/70 hover:border-white/20 transition-all">
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input Bar */}
                <div className="flex items-center gap-3 bg-[#131313] border border-white/10 rounded-2xl px-4 py-3 focus-within:border-[#00e1ab]/30 transition-all">
                  <Zap size={16} className="text-[#00e1ab] flex-shrink-0" />
                  <input
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSend()}
                    placeholder="Ask Anzen to analyze your security perimeter..."
                    className="flex-1 bg-transparent outline-none text-sm text-white placeholder-white/20"
                  />
                  <span className="text-[10px] font-mono text-white/20 border border-white/10 rounded px-1.5 py-0.5">⌘K</span>
                  <button onClick={handleSend} disabled={!inputValue.trim() || isLoading}
                    className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00e1ab] to-[#00513c] flex items-center justify-center disabled:opacity-30 hover:opacity-90 transition-opacity">
                    <ArrowUp size={14} className="text-black" strokeWidth={3} />
                  </button>
                </div>

                {/* System Status */}
                <div className="flex justify-end">
                  <div className="flex items-center gap-2 bg-[#131313] border border-white/10 rounded-full px-4 py-2">
                    <Shield size={12} className="text-[#00e1ab]" />
                    <span className="text-[10px] font-mono text-white/40 tracking-widest">SYSTEM OPTIMAL</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePage === "connections" && (
            <div className="max-w-4xl flex flex-col gap-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Connections</h1>
                <p className="text-white/40 text-sm mt-1">Manage your data pipeline and security nodes.</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium">Active Connections</p>
                  <span className="text-xs font-mono text-[#00e1ab]">{connectedCount} NODES SECURE</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { key: "github", label: "GitHub", desc: "Monitoring repository access and secret leaks.", href: "/auth/login?connection=github&returnTo=/dashboard" },
                    { key: "gmail", label: "Gmail", desc: "Securing communications and attachment vectors.", href: "/auth/login?connection=google-oauth2&returnTo=/dashboard" },
                    { key: "slack", label: "Slack", desc: "Auditing internal threads for DLP compliance.", href: "/auth/login?connection=slack-oauth2&returnTo=/dashboard" },
                  ].map(p => (
                    <div key={p.key} className="bg-[#131313] rounded-2xl p-5 flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                          <span className="text-lg">{p.key === "github" ? "🐙" : p.key === "gmail" ? "✉️" : "💬"}</span>
                        </div>
                        {status[p.key as keyof ConnectionStatus] && (
                          <span className="text-[10px] font-mono text-[#00e1ab] bg-[#00e1ab]/10 px-2 py-1 rounded-full">● CONNECTED</span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{p.label}</p>
                        <p className="text-xs text-white/40 mt-1">{p.desc}</p>
                      </div>
                      <a href={status[p.key as keyof ConnectionStatus] ? "#" : p.href}
                        className="text-center text-xs font-medium py-2 rounded-xl bg-[#1f2020] hover:bg-[#252626] transition-colors">
                        {status[p.key as keyof ConnectionStatus] ? "Manage" : "Connect"}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activePage === "history" && (
            <div className="max-w-4xl">
              <h1 className="text-3xl font-bold tracking-tight mb-2">Audit Logs</h1>
              <p className="text-white/40 text-sm mb-8">Complete record of all agent actions.</p>
              <div className="bg-[#131313] rounded-2xl p-6 flex items-center justify-center h-48">
                <p className="text-white/20 text-sm font-mono">No audit logs yet. Start a session to generate logs.</p>
              </div>
            </div>
          )}

          {activePage === "security" && (
            <div className="max-w-4xl">
              <h1 className="text-3xl font-bold tracking-tight mb-2">Account</h1>
              <p className="text-white/40 text-sm mb-8">{userEmail}</p>
              <div className="bg-[#131313] rounded-2xl p-6">
                <p className="text-sm text-white/60">Signed in via Auth0. Token Vault active.</p>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
