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

function StatusDot({ connected }: { connected: boolean }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${
        connected ? "bg-[#00ff88]" : "bg-red-500"
      }`}
    />
  );
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
    <div className="flex flex-col gap-3 bg-slate-900 border border-slate-800 rounded-xl p-5 flex-1">
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm text-slate-400 uppercase tracking-widest">{name}</span>
        {loading ? (
          <span className="inline-block w-2 h-2 rounded-full bg-slate-600 animate-pulse" />
        ) : (
          <StatusDot connected={connected} />
        )}
      </div>
      <p className="text-slate-400 text-sm">{description}</p>
      {connected ? (
        <span className="text-[#00ff88] text-xs font-mono mt-auto">● Connected</span>
      ) : (
        <a
          href={`/auth/login?connection=${connection}&access_type=offline&returnTo=/dashboard`}
          className="mt-auto inline-block text-center text-xs font-mono px-3 py-2 rounded-lg border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black transition-colors duration-150"
        >
          Connect {name}
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

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-mono text-xl font-bold tracking-tight">
            Anzen <span className="text-slate-500">安全</span>
          </h1>
          <p className="text-slate-500 text-xs mt-0.5 font-mono">Your AI Chief of Staff</p>
        </div>
        <a
          href="/auth/logout"
          className="text-slate-500 hover:text-slate-300 text-xs font-mono transition-colors"
        >
          sign out
        </a>
      </header>

      <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-6 py-8 gap-8">
        {/* Greeting */}
        <div>
          <h2 className="text-2xl font-semibold text-white">
            {getGreeting()},{" "}
            <span className="text-[#00ff88]">{(userName || "User").split(" ")[0]}</span>
          </h2>
          <p className="text-slate-500 text-sm mt-1">{userEmail}</p>
        </div>

        {/* Provider status cards */}
        <section>
          <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3">
            Connected Accounts
          </h3>
          <div className="flex gap-4">
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
        <section className="flex flex-col flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
            <span className="text-xs font-mono text-slate-400">Anzen Agent</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4 min-h-[300px] max-h-[400px]">
            {messages.length === 0 && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-slate-600 text-sm font-mono text-center">
                  Ask Anzen to check your issues, emails, or messages.
                  <br />
                  <span className="text-xs text-slate-700 mt-1 block">
                    "What GitHub issues are assigned to me?"
                  </span>
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
                      ? "bg-slate-700 text-white"
                      : "bg-slate-800 text-slate-200 border border-slate-700"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5">
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-slate-800 px-4 py-3 flex gap-3 items-center"
          >
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask Anzen anything..."
              disabled={isThinking}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#00ff88] transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isThinking || !input.trim()}
              className="bg-[#00ff88] text-black text-sm font-mono font-bold px-4 py-2.5 rounded-lg hover:bg-[#00e67a] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
        </section>

        {/* Permission tier legend */}
        <footer className="border-t border-slate-800 pt-5">
          <p className="text-xs font-mono text-slate-600 uppercase tracking-widest mb-3">
            Permission Tiers
          </p>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00ff88]" />
              <span className="text-xs text-slate-500">
                <span className="text-slate-300 font-medium">Watch</span> — read only
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs text-slate-500">
                <span className="text-slate-300 font-medium">Act</span> — requires your confirmation
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-xs text-slate-500">
                <span className="text-slate-300 font-medium">Sensitive</span> — requires re-authentication
              </span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
