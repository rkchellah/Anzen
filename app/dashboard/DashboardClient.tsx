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
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

type ProviderCardProps = {
  name: string;
  description: string;
  connection: string;
  connected: boolean;
  loading: boolean;
};

function ProviderCard({ name, description, connection, connected, loading }: ProviderCardProps) {
  return (
    <div className="flex flex-col gap-4 bg-white/[0.03] border border-white/10 rounded-lg p-5 flex-1 hover:border-white/20 transition-colors">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-white/40 uppercase tracking-[0.15em]">{name}</span>
        {loading ? (
          <span className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse" />
        ) : connected ? (
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88]" />
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-red-500/70" />
        )}
      </div>
      <p className="text-white/40 text-xs leading-relaxed">{description}</p>
      {connected ? (
        <span className="text-[#00ff88] text-xs font-mono mt-auto">connected</span>
      ) : (
        <a
          href={`/auth/login?connection=${connection}&access_type=offline&returnTo=/dashboard`}
          className="mt-auto inline-block text-center text-xs font-mono px-3 py-1.5 rounded border border-amber-500/50 text-amber-500 hover:border-amber-400 hover:text-amber-400 transition-colors"
        >
          connect →
        </a>
      )}
    </div>
  );
}

export default function DashboardClient({ userName, userEmail }: Props) {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, status: chatStatus } = useChat({
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

  const isThinking = chatStatus === "submitted" || chatStatus === "streaming";
  const firstName = (userName || "User").split(" ")[0];

  return (
    <div className="min-h-screen bg-[#08060D] text-white flex flex-col">

      {/* Header */}
      <header className="border-b border-white/[0.06] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-bold tracking-tight text-white">
            Anzen
          </span>
          <span className="text-white/20 font-mono text-sm">安全</span>
          <span className="hidden sm:inline-block text-white/20 text-xs font-mono">|</span>
          <span className="hidden sm:inline-block text-white/30 text-xs font-mono">
            Your AI Chief of Staff
          </span>
        </div>
        <a
          href="/auth/logout"
          className="text-white/30 hover:text-white/60 text-xs font-mono transition-colors"
        >
          sign out
        </a>
      </header>

      <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-8 py-10 gap-10">

        {/* Greeting */}
        <div className="flex items-end justify-between border-b border-white/[0.06] pb-6">
          <div>
            <p className="text-white/30 text-xs font-mono mb-1 uppercase tracking-widest">
              {getGreeting()}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-white">
              {firstName}
            </h2>
          </div>
          <p className="text-white/20 text-xs font-mono">{userEmail}</p>
        </div>

        {/* Provider status cards */}
        <section>
          <p className="text-white/25 text-xs font-mono uppercase tracking-[0.15em] mb-4">
            Connected Accounts
          </p>
          <div className="grid grid-cols-3 gap-3">
            <ProviderCard
              name="GitHub"
              description="Read and manage your GitHub issues"
              connection="github"
              connected={status?.github ?? false}
              loading={statusLoading}
            />
            <ProviderCard
              name="Gmail"
              description="Read and send emails on your behalf"
              connection="google-oauth2"
              connected={status?.gmail ?? false}
              loading={statusLoading}
            />
            <ProviderCard
              name="Slack"
              description="Read and post messages in Slack"
              connection="slack-oauth2"
              connected={status?.slack ?? false}
              loading={statusLoading}
            />
          </div>
        </section>

        {/* Chat interface */}
        <section className="flex flex-col flex-1 border border-white/[0.07] rounded-lg overflow-hidden">

          {/* Chat header bar */}
          <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2 bg-white/[0.02]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
            <span className="text-xs font-mono text-white/40">agent</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-3 min-h-[280px] max-h-[380px] bg-transparent">
            {messages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 py-8">
                <p className="text-white/20 text-xs font-mono text-center">
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
                  className={`max-w-[78%] rounded-lg px-4 py-2.5 text-sm ${
                    m.role === "user"
                      ? "bg-white/[0.08] text-white/90"
                      : "bg-white/[0.03] text-white/70 border border-white/[0.07]"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-white/[0.03] border border-white/[0.07] rounded-lg px-4 py-3">
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
            className="border-t border-white/[0.06] px-4 py-3 flex gap-2 items-center bg-white/[0.01]"
          >
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask Anzen anything..."
              disabled={isThinking}
              className="flex-1 bg-transparent border border-white/10 rounded px-4 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00ff88]/40 transition-colors disabled:opacity-40 font-mono"
            />
            <button
              type="submit"
              disabled={isThinking || !input.trim()}
              className="bg-[#00ff88] text-black text-xs font-mono font-bold px-4 py-2 rounded hover:bg-[#00e67a] transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
            >
              run
            </button>
          </form>
        </section>

        {/* Permission tier legend */}
        <footer className="border-t border-white/[0.06] pt-5">
          <p className="text-white/20 text-xs font-mono uppercase tracking-[0.15em] mb-3">
            Permission Model
          </p>
          <div className="flex gap-8">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88]" />
              <span className="text-white/30 text-xs font-mono">
                <span className="text-white/60">Watch</span> — read only
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="text-white/30 text-xs font-mono">
                <span className="text-white/60">Act</span> — requires confirmation
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-white/30 text-xs font-mono">
                <span className="text-white/60">Sensitive</span> — requires re-auth
              </span>
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}
