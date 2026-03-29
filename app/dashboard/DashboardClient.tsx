"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";

type ConnectionStatus = { github: boolean; gmail: boolean; slack: boolean };

const SUGGESTIONS = [
  "What GitHub issues are assigned to me?",
  "Summarize my unread emails",
  "List my Slack channels",
];

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
);

const GmailIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18">
    <path fill="#EA4335" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
  </svg>
);

const SlackIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18">
    <path fill="#E01E5A" d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313z"/>
    <path fill="#36C5F0" d="M8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312z"/>
    <path fill="#2EB67D" d="M18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zm-1.271 0a2.528 2.528 0 01-2.523 2.521 2.527 2.527 0 01-2.52-2.521V2.522A2.527 2.527 0 0115.162 0a2.528 2.528 0 012.523 2.522v6.312z"/>
    <path fill="#ECB22E" d="M15.165 18.956a2.528 2.528 0 012.523 2.522A2.528 2.528 0 0115.165 24a2.527 2.527 0 01-2.52-2.522v-2.522h2.52zm0-1.271a2.527 2.527 0 01-2.52-2.523 2.526 2.526 0 012.52-2.52h6.313A2.527 2.527 0 0124 15.162a2.528 2.528 0 01-2.522 2.523h-6.313z"/>
  </svg>
);

export default function DashboardClient({ userName, userEmail }: { userName: string; userEmail: string }) {
  const [status, setStatus] = useState<ConnectionStatus>({ github: false, gmail: false, slack: false });
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const firstName = (userName || "User").split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "GOOD MORNING" : hour < 18 ? "GOOD AFTERNOON" : "GOOD EVENING";

  const { messages, append, isLoading } = useChat({ api: "/api/agent" });

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const providers = [
    { key: "github", label: "GitHub", icon: <GitHubIcon />, color: "#24292e", href: "/api/auth/connect?connection=github" },
    { key: "gmail", label: "Gmail", icon: <GmailIcon />, color: "#EA4335", href: "/api/auth/connect?connection=google-oauth2" },
    { key: "slack", label: "Slack", icon: <SlackIcon />, color: "#4A154B", href: "/api/auth/connect?connection=slack-oauth2" },
  ];

  return (
    <div className="relative min-h-screen bg-[#050505] text-white overflow-hidden flex justify-center">
      {/* Ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] pointer-events-none"
        style={{ background: "radial-gradient(circle at 50% 0%, rgba(16,185,129,0.12) 0%, transparent 65%)" }}
      />

      <div className="relative w-full max-w-3xl px-6 py-8 flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <span className="font-mono font-bold text-base tracking-tight">Anzen 安全</span>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/30">{userEmail}</span>
            <a href="/auth/logout" className="text-xs text-white/40 hover:text-white/70 transition-colors">sign out</a>
          </div>
        </div>

        {/* Greeting */}
        <div>
          <p className="text-xs font-mono text-[#00ff88] tracking-widest mb-1">{greeting}</p>
          <h1 className="text-5xl font-bold tracking-tight">{firstName}</h1>
        </div>

        {/* Provider Cards */}
        <div>
          <p className="text-xs font-mono text-white/30 tracking-widest mb-3">CONNECTED ACCOUNTS</p>
          <div className="grid grid-cols-3 gap-3">
            {providers.map(p => (
              <div key={p.key} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {p.icon}
                    <span className="text-sm font-medium">{p.label}</span>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${status[p.key as keyof ConnectionStatus] ? "bg-[#00ff88]" : "bg-red-500"}`} />
                </div>
                {!status[p.key as keyof ConnectionStatus] && (
                  <a
                    href={p.href}
                    className="block text-center text-xs font-mono font-semibold py-2 rounded-lg transition-opacity hover:opacity-80"
                    style={{ backgroundColor: p.color }}
                  >
                    Connect {p.label}
                  </a>
                )}
                {status[p.key as keyof ConnectionStatus] && (
                  <span className="text-xs text-[#00ff88] font-mono">Connected ✓</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex flex-col flex-1 min-h-[400px]">
          <p className="text-xs font-mono text-white/30 tracking-widest mb-3">AGENT</p>
          <div className="flex-1 flex flex-col">

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 min-h-[300px]">
              <AnimatePresence mode="wait">
                {messages.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center justify-center h-full gap-4 py-12"
                  >
                    <div className="w-14 h-14 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center">
                      <span className="text-[#00ff88] text-2xl">✦</span>
                    </div>
                    <div className="text-center">
                      <h2 className="text-xl font-semibold tracking-tight mb-1">I&apos;m Anzen, your AI agent.</h2>
                      <p className="text-sm text-white/40">Ask me about your GitHub issues, emails, or Slack messages.</p>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center mt-2">
                      {SUGGESTIONS.map(s => (
                        <button
                          key={s}
                          onClick={() => setInputValue(s)}
                          className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-white/50 hover:bg-white/10 hover:text-white/80 transition-all"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="messages" className="flex flex-col gap-6">
                    {messages.map((m, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 260, damping: 25 }}
                        className={`flex w-full ${m.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {m.role === "assistant" && (
                          <div className="icon-glow w-7 h-7 rounded-full bg-[#00ff88]/20 border border-[#00ff88]/30 flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                            <span className="text-[#00ff88] text-xs">✦</span>
                          </div>
                        )}
                        <div className={`max-w-[75%] ${m.role === "user"
                          ? "bg-zinc-800 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-white"
                          : "text-sm text-white/90 leading-relaxed"}`}
                        >
                          {typeof m.content === "string" ? m.content : ""}
                          {m.role === "assistant" && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.4 }}
                              className="text-[10px] text-zinc-600 mt-2 ml-1 uppercase tracking-widest font-bold block"
                            >
                              Anzen AI Agent • Composed by AI
                            </motion.span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex gap-1.5 px-4 py-3 bg-white/5 rounded-2xl w-fit ml-11 border border-white/5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                      className="w-1.5 h-1.5 bg-emerald-400 rounded-full opacity-60"
                    />
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="pt-4">
              <div className="glass-panel rounded-[22px] flex items-center p-2 focus-within:ring-1 focus-within:ring-emerald-500/50 transition-all">
                <input
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Anzen anything..."
                  className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-white placeholder-zinc-500 px-4 py-2 text-sm"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                  className="bg-white hover:bg-zinc-200 text-black p-2.5 rounded-full transition-transform active:scale-90 disabled:opacity-30 flex-shrink-0"
                >
                  <ArrowUp size={18} strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Permission Legend */}
        <div className="flex items-center gap-6 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88]" />
            <span className="text-xs font-mono text-white/30">Watch — read only</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-xs font-mono text-white/30">Act — requires confirmation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span className="text-xs font-mono text-white/30">Sensitive — requires re-auth</span>
          </div>
        </div>

      </div>
    </div>
  );
}
