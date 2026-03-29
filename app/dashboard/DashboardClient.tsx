"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import Image from "next/image";

type ConnectionStatus = {
  github: boolean;
  gmail: boolean;
  slack: boolean;
};

type Props = {
  userName: string;
  userEmail: string;
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "GOOD MORNING";
  if (hour < 17) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}

const GitHubLogo = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
);

type ProviderCardProps = {
  name: string;
  description: string;
  connection: string;
  connected: boolean;
  loading: boolean;
  logo: React.ReactNode;
  brandColor: string;
};

function ProviderCard({ name, description, connection, connected, loading, logo, brandColor }: ProviderCardProps) {
  const connectHref = "/api/auth/connect?connection=" + connection;
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col gap-3 hover:border-white/20 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {logo}
          <span className="text-sm font-medium text-white">{name}</span>
        </div>
        {loading ? (
          <span className="w-2 h-2 rounded-full bg-white/20 animate-pulse" />
        ) : connected ? (
          <span className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_6px_rgba(0,255,136,0.4)]" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-red-500/70" />
        )}
      </div>
      <p className="text-white/40 text-xs leading-relaxed">{description}</p>
      {connected ? (
        <span className="text-[#00ff88] text-xs font-mono">Connected ✓</span>
      ) : (
        <a
          href={connectHref}
          className="inline-block text-center text-xs font-medium px-3 py-2 rounded-lg text-white transition-opacity hover:opacity-80"
          style={{ backgroundColor: brandColor }}
        >
          Connect {name}
        </a>
      )}
    </div>
  );
}

const SUGGESTIONS = [
  "What GitHub issues are assigned to me?",
  "Summarize my unread emails",
  "List my Slack channels",
];

export default function DashboardClient({ userName, userEmail }: Props) {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } = useChat({
    api: "/api/agent",
  });

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((data) => {
        setStatus(data);
        setStatusLoading(false);
      })
      .catch(() => setStatusLoading(false));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isLoading && (input ?? "").trim()) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  const firstName = (userName || "User").split(" ")[0];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex justify-center">
      <div className="w-full max-w-3xl px-6 py-8 flex flex-col gap-8">

        {/* Header */}
        <header className="flex items-center justify-between pb-6 border-b border-white/10">
          <span className="font-mono text-lg font-bold tracking-tight">
            Anzen <span className="text-white/30">安全</span>
          </span>
          <div className="flex items-center gap-4">
            <span className="text-white/30 text-xs font-mono hidden sm:block">{userEmail}</span>
            <a
              href="/auth/logout"
              className="text-white/40 hover:text-white/70 text-xs font-mono transition-colors"
            >
              sign out
            </a>
          </div>
        </header>

        {/* Greeting */}
        <section className="flex flex-col gap-1">
          <p className="text-xs font-mono text-[#00ff88] tracking-widest">
            {getGreeting()}
          </p>
          <h1 className="text-5xl font-bold tracking-tight">{firstName}</h1>
        </section>

        {/* Connected accounts */}
        <section className="flex flex-col gap-3">
          <p className="text-xs font-mono text-white/40 tracking-widest uppercase">
            Connected Accounts
          </p>
          <div className="grid grid-cols-3 gap-4">
            <ProviderCard
              name="GitHub"
              description="Manage issues and repos"
              connection="github"
              connected={status?.github ?? false}
              loading={statusLoading}
              logo={<GitHubLogo />}
              brandColor="#24292e"
            />
            <ProviderCard
              name="Gmail"
              description="Read and send emails"
              connection="google-oauth2"
              connected={status?.gmail ?? false}
              loading={statusLoading}
              logo={<Image src="/logos/gmail.png" alt="Gmail" width={24} height={24} />}
              brandColor="#EA4335"
            />
            <ProviderCard
              name="Slack"
              description="Read and post messages"
              connection="slack-oauth2"
              connected={status?.slack ?? false}
              loading={statusLoading}
              logo={<Image src="/logos/slack.png" alt="Slack" width={24} height={24} />}
              brandColor="#4A154B"
            />
          </div>
        </section>

        {/* Chat — Intercom Fin style */}
        <section className="flex flex-col gap-3">
          <p className="text-xs font-mono text-white/40 tracking-widest uppercase">Agent</p>
          <div className="bg-[#111111] border border-white/10 rounded-2xl overflow-hidden flex flex-col" style={{ minHeight: "420px" }}>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3" style={{ maxHeight: "400px" }}>
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 py-10 text-center">
                  {/* Bot avatar */}
                  <div className="w-12 h-12 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#00ff88]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-white/70 text-base font-medium">What can I help you with?</p>
                    <p className="text-white/30 text-sm">Ask me anything about your GitHub, Gmail, or Slack.</p>
                  </div>
                  {/* Suggestion pills */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setInput(s)}
                        className="text-xs px-4 py-2 rounded-full border border-white/15 text-white/50 hover:border-white/30 hover:text-white/80 transition-all bg-white/[0.03] hover:bg-white/[0.06]"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={"flex " + (m.role === "user" ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={
                        "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm " +
                        (m.role === "user"
                          ? "bg-white/10 text-white rounded-br-sm"
                          : "bg-white/[0.04] text-white/75 border border-white/10 rounded-bl-sm")
                      }
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {typeof m.content === "string" ? m.content : ""}
                      </p>
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/[0.04] border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88]/60 animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88]/60 animate-bounce [animation-delay:120ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88]/60 animate-bounce [animation-delay:240ms]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar — pill shaped */}
            <div className="p-4 border-t border-white/[0.07]">
              <form
                onSubmit={handleSubmit}
                className="flex items-center gap-3 bg-white/[0.06] border border-white/10 rounded-full px-4 py-2.5 focus-within:border-white/25 transition-colors"
              >
                <input
                  value={input ?? ""}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Anzen anything..."
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-sm outline-none placeholder-white/25 text-white disabled:opacity-40"
                />
                <button
                  type="submit"
                  disabled={isLoading || !(input ?? "").trim()}
                  className="w-7 h-7 rounded-full bg-[#00ff88] flex items-center justify-center flex-shrink-0 hover:bg-[#00e67a] transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <svg className="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                  </svg>
                </button>
              </form>
            </div>

          </div>
        </section>

        {/* Permission tiers */}
        <footer className="flex gap-6 flex-wrap pt-2">
          <span className="flex items-center gap-2 text-xs text-white/30 font-mono">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00ff88]" />
            Watch — read only
          </span>
          <span className="flex items-center gap-2 text-xs text-white/30 font-mono">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-400" />
            Act — requires confirmation
          </span>
          <span className="flex items-center gap-2 text-xs text-white/30 font-mono">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
            Sensitive — requires re-auth
          </span>
        </footer>

      </div>
    </div>
  );
}
