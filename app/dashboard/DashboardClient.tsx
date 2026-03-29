"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Sparkles } from "lucide-react";

type ConnectionStatus = { github: boolean; gmail: boolean; slack: boolean };

const SUGGESTIONS = [
  "What GitHub issues are assigned to me?",
  "Summarize my unread emails",
  "List my Slack channels",
];

export default function DashboardClient({ userName, userEmail }: { userName: string; userEmail: string }) {
  const [status, setStatus] = useState<ConnectionStatus>({ github: false, gmail: false, slack: false });
  const [inputValue, setInputValue] = useState("");
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

  return (
    <div className="relative min-h-screen bg-[#050505] text-white overflow-hidden flex flex-col items-center">
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <clipPath id="squircleClip" clipPathUnits="objectBoundingBox">
            <path d="M 0,0.5 C 0,0 0,0 0.5,0 S 1,0 1,0.5 1,1 0.5,1 0,1 0,0.5"></path>
          </clipPath>
        </defs>
      </svg>

      {/* 1. AMBIENT GLOW */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] pointer-events-none opacity-50"
        style={{ background: "radial-gradient(circle at 50% 0%, rgba(16,185,129,0.15) 0%, transparent 70%)" }}
      />

      {/* 2. TOP NAV */}
      <nav className="relative z-50 w-full max-w-5xl mx-auto px-6 pt-6 pb-4 flex justify-between items-center">
        <span className="font-mono font-bold text-sm tracking-tighter opacity-80">ANZEN 安全</span>
        <div className="flex items-center gap-4 text-[10px] font-mono tracking-widest text-white/40">
          <span>{userEmail?.toUpperCase()}</span>
          <a href="/auth/logout" className="hover:text-white/80 transition-colors flex items-center gap-1.5 text-[10px] font-mono tracking-widest text-white/40">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            SIGN OUT
          </a>
        </div>
      </nav>

      {/* 3. MAIN CONTENT AREA */}
      <main className="relative flex-1 w-full max-w-3xl mx-auto px-6 flex flex-col">
        <AnimatePresence mode="wait">
          {!isChatting ? (
            /* --- LANDING STATE --- */
            <motion.div 
              key="landing"
              exit={{ opacity: 0, y: -40, filter: "blur(10px)" }}
              className="flex flex-col gap-12 pt-12"
            >
              {/* Greeting */}
              <section>
                <p className="text-[10px] font-mono text-[#00ff88] tracking-[0.3em] mb-2 uppercase">Systems Online</p>
                <h1 className="text-6xl font-bold tracking-tighter">Hello, {firstName}.</h1>
              </section>

              {/* Providers */}
              <section>
                <p className="text-[10px] font-mono text-white/20 tracking-widest mb-4">ACTIVE CONNECTIONS</p>
                <div className="flex items-end gap-3">
                  {[
                    {
                      key: "github",
                      href: "/api/auth/connect?connection=github",
                      gradient: "from-gray-700 to-gray-900",
                      border: "border-gray-600/50",
                      icon: <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-white"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    },
                    {
                      key: "gmail",
                      href: "/api/auth/connect?connection=google-oauth2",
                      gradient: "from-red-600 to-red-800",
                      border: "border-red-500/50",
                      icon: <svg viewBox="0 0 24 24" className="h-7 w-7"><path fill="white" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/></svg>
                    },
                    {
                      key: "slack",
                      href: "/api/auth/connect?connection=slack-oauth2",
                      gradient: "from-purple-700 to-purple-900",
                      border: "border-purple-500/50",
                      icon: <svg viewBox="0 0 24 24" className="h-7 w-7"><path fill="#E01E5A" d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313z"/><path fill="#36C5F0" d="M8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312z"/><path fill="#2EB67D" d="M18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zm-1.271 0a2.528 2.528 0 01-2.523 2.521 2.527 2.527 0 01-2.52-2.521V2.522A2.527 2.527 0 0115.162 0a2.528 2.528 0 012.523 2.522v6.312z"/><path fill="#ECB22E" d="M15.165 18.956a2.528 2.528 0 012.523 2.522A2.528 2.528 0 0115.165 24a2.527 2.527 0 01-2.52-2.522v-2.522h2.52zm0-1.271a2.527 2.527 0 01-2.52-2.523 2.526 2.526 0 012.52-2.52h6.313A2.527 2.527 0 0124 15.162a2.528 2.528 0 01-2.522 2.523h-6.313z"/></svg>
                    },
                  ].map(p => (
                    <a key={p.key} href={status[p.key as keyof ConnectionStatus] ? "#" : p.href} className="relative group">
                      <div
                        style={{ clipPath: "url(#squircleClip)" }}
                        className={`w-14 h-14 bg-gradient-to-br ${p.gradient} flex items-center justify-center shadow-lg border ${p.border} cursor-pointer transform transition-all duration-300 ease-out hover:scale-110 hover:-translate-y-2 hover:shadow-2xl`}
                      >
                        {p.icon}
                      </div>
                      {status[p.key as keyof ConnectionStatus] && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#00ff88] border-2 border-[#050505] shadow-[0_0_6px_#00ff88]" />
                      )}
                    </a>
                  ))}
                </div>
              </section>

              {/* Centered Empty State */}
              <div className="flex flex-col items-center py-10 text-center gap-8">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                   <Sparkles className="text-emerald-400" size={28} />
                </div>
                <div className="mb-6">
                   <h2 className="text-2xl font-semibold tracking-tight">I&apos;m Anzen. How can I assist?</h2>
                   <p className="text-white/40 text-sm mt-1">Ready to parse your issues, mail, and communications.</p>
                </div>
              </div>
            </motion.div>
          ) : (
            /* --- CHAT STATE --- */
            <motion.div 
              key="chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-8 pt-10 pb-40"
            >
              {messages.map((m, i) => (
                <div key={i} className={`flex w-full ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] flex ${m.role === "assistant" ? "gap-4" : ""}`}>
                    {m.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-1 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                        <div className="w-2 h-2 bg-emerald-400 rotate-45" />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <div className={`px-4 py-3 text-[15px] leading-relaxed
                        ${m.role === "user" 
                          ? "bg-zinc-800/80 backdrop-blur-md rounded-2xl rounded-tr-none border border-white/5 shadow-xl" 
                          : "text-zinc-200"}`}
                      >
                        {m.content}
                      </div>
                      {m.role === "assistant" && (
                        <span className="text-[9px] text-zinc-600 mt-2 ml-1 uppercase tracking-[0.2em] font-bold">
                          Anzen Agent • Composed by AI
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-1.5 px-4 py-3 bg-white/5 rounded-2xl w-fit ml-12 border border-white/5">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }} className="w-1.5 h-1.5 bg-emerald-400/60 rounded-full" />
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 4. THE FLOATING INPUT - CENTERED */}
      <div className="fixed bottom-12 left-0 right-0 w-full flex justify-center z-[100] px-6 pointer-events-none">
        <div className="w-full max-w-3xl flex flex-col items-center pointer-events-auto">
          
          {/* Suggestions - only show in landing */}
          <AnimatePresence>
            {!isChatting && (
              <motion.div exit={{ opacity: 0, y: 10 }} className="flex flex-wrap justify-center gap-3 mb-4">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => append({ role: 'user', content: s })}
                    className="px-5 py-2 rounded-full bg-[#111111]/80 border border-white/10 text-[12px] text-white/50 hover:bg-white/10 hover:text-white transition-all backdrop-blur-md"
                  >
                    {s}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Glass Input Pill */}
          <div className="w-full bg-[#111111]/80 backdrop-blur-2xl border border-white/10 rounded-full p-2 shadow-2xl flex items-center focus-within:border-emerald-500/50 transition-all">
            <input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder="Ask Anzen anything..."
              className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-white placeholder-zinc-500 px-4 py-2 text-[15px]"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-black hover:bg-zinc-100 transition-all active:scale-90 disabled:opacity-20 flex-shrink-0 mr-1"
            >
              <ArrowUp size={20} strokeWidth={3} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}