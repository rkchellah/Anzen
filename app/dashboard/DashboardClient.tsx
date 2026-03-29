"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";

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
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {logo}
          <span className="text-sm font-medium text-white">{name}</span>
        </div>
        {loading ? (
          <span className="w-2 h-2 rounded-full bg-white/20 animate-pulse" />
        ) : connected ? (
          <span className="w-2 h-2 rounded-full bg-[#00ff88]" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-red-500/70" />
        )}
      </div>
      <p className="text-white/40 text-xs leading-relaxed">{description}</p>
      {connected ? (
        <span className="text-[#00ff88] text-xs font-mono">Connected ✓</span>
      ) : (
        <a
          href={`/api/auth/connect?connection=${connection}`}
          className="inline-block text-center text-xs font-medium px-3 py-2 rounded-lg text-white transition-opacity hover:opacity-80"
          style={{ backgroundColor: brandColor }}
        >
          Connect {name}
        </a>
      )}
    </div>
  );
}

const GitHubLogo = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
);

const GmailLogo = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path fill="#EA4335" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
  </svg>
);

const SlackLogo = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#E01E5A]">
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
  </svg>
);

export default function DashboardClient({ userName, userEmail }: Props) {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
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

  const firstName = (userName || "User").split(" ")[0];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-8">

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
              logo={<GmailLogo />}
              brandColor="#EA4335"
            />
            <ProviderCard
              name="Slack"
              description="Read and post messages"
              connection="slack-oauth2"
              connected={status?.slack ?? false}
              loading={statusLoading}
              logo={<SlackLogo />}
              brandColor="#4A154B"
            />
          </div>
        </section>

        {/* Chat */}
        <section className="flex flex-col gap-3">
          <p className="text-xs font-mono text-white/40 tracking-widest uppercase">Agent</p>
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">

            {/* Messages */}
            <div className="min-h-64 p-4 flex flex-col gap-3 max-h-96 overflow-y-auto">
              {messages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 py-10">
                  <p className="text-white/20 text-sm font-mono text-center">
                    What needs your attention today?
                  </p>
                  <p className="text-white/10 text-xs font-mono text-center">
                    "What GitHub issues are assigned to me?"
                  </p>
                </div>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                      m.role === "user"
                        ? "bg-white/10 text-white"
                        : "bg-white/[0.03] text-white/70 border border-white/10"
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {typeof m.content === "string" ? m.content : ""}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
                    <div className="flex gap-1 items-center">
                      <span className="w-1 h-1 rounded-full bg-[#00ff88]/60 animate-bounce [animation-delay:0ms]" />
                      <span className="w-1 h-1 rounded-full bg-[#00ff88]/60 animate-bounce [animation-delay:120ms]" />
                      <span className="w-1 h-1 rounded-full bg-[#00ff88]/60 animate-bounce [animation-delay:240ms]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="border-t border-white/10 p-3 flex gap-2 items-center"
            >
              <input
                value={input ?? ""}
                onChange={handleInputChange}
                placeholder="Ask Anzen anything..."
                disabled={isLoading}
                className="flex-1 bg-transparent text-sm outline-none placeholder-white/30 text-white disabled:opacity-40"
              />
              <button
                type="submit"
                disabled={isLoading || !(input ?? "").trim()}
                className="bg-[#00ff88] text-black text-xs font-mono font-bold px-4 py-2 rounded-lg hover:bg-[#00e67a] transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
              >
                run
              </button>
            </form>
          </div>
        </section>

        {/* Permission tiers */}
        <footer className="flex gap-6 flex-wrap pt-2">
          <span className="text-xs text-white/30 font-mono">🟢 Watch — read only</span>
          <span className="text-xs text-white/30 font-mono">🟡 Act — requires confirmation</span>
          <span className="text-xs text-white/30 font-mono">🔴 Sensitive — requires re-auth</span>
        </footer>

      </div>
    </div>
  );
}
