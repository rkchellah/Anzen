"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses } from "ai";
import { findPendingManualApprovals, hasPendingManualApprovals } from "@/agent/pending-approvals";
import { buildLogoutUrl } from "@/lib/auth-routes";
import {
  deriveChatTitle,
  loadChats,
  newChatId,
  saveChats,
  upsertChat,
  type StoredChat,
} from "@/lib/chat-history";
import { defaultUserPermissions, type ProviderAccessMode } from "@/lib/permissions";
import { PRIVACY_SECTIONS } from "@/lib/privacy-content";
import { useAnzenTheme } from "@/components/AnzenThemeProvider";
import { AnzenChatPanel } from "@/components/AnzenChatPanel";
import { AnzenConnectionsView } from "@/components/AnzenConnectionsView";
import { AnzenSidebar, AnzenMobileMenuButton, type DashboardPage } from "@/components/AnzenSidebar";
import { AnzenModelPicker, type AnzenModelOption } from "@/components/AnzenModelPicker";
import { AnzenToolApprovals } from "@/components/AnzenToolApprovals";
import { AI_PROVIDER_SHORT_LABEL } from "@/lib/ai-display";
import { resolveDisplayName } from "@/lib/display-name";
import { cn } from "@/lib/utils";

type ConnectionStatus = { github: boolean; gmail: boolean; slack: boolean };
type ConnectionKey = keyof ConnectionStatus;
type AccessModes = Record<ConnectionKey, ProviderAccessMode>;

type AuditEntry = {
  id: string;
  timestamp: number;
  toolName: string;
  parameters: Record<string, unknown>;
  outcome: "success" | "failure";
  message: string;
};

const MODEL_STORAGE_KEY = "anzen.model.v1";

const PAGE_COPY: Record<Exclude<DashboardPage, "chat">, { title: string; subtitle: string }> = {
  connections: {
    title: "Connections",
    subtitle: "Accounts Anzen can read. Writes still need your confirmation.",
  },
  activity: {
    title: "Activity",
    subtitle: "Write actions you confirmed.",
  },
  privacy: {
    title: "Privacy",
    subtitle: "How Anzen handles your data.",
  },
};

function PageIntro({
  page,
  trailing,
}: {
  page: Exclude<DashboardPage, "chat">;
  trailing?: React.ReactNode;
}) {
  const copy = PAGE_COPY[page];
  return (
    <div className="mb-6 flex flex-col items-center gap-3 text-center">
      <div>
        <h1 className="text-[26px] font-bold tracking-[-0.025em] text-foreground">{copy.title}</h1>
        <p className="mt-1.5 text-[15px] leading-[1.55] text-muted-foreground">{copy.subtitle}</p>
      </div>
      {trailing}
    </div>
  );
}

const SUGGESTIONS = [
  { label: "Assigned issues", prompt: "What GitHub issues are assigned to me?" },
  { label: "Unread email", prompt: "Summarize my unread emails" },
  { label: "Slack channels", prompt: "List my Slack channels" },
];

export default function DashboardClient({
  userName,
  userEmail,
  tokenVaultScopesEnabled,
}: {
  userName: string;
  userEmail: string;
  tokenVaultScopesEnabled: boolean;
}) {
  const [connStatus, setConnStatus] = useState<ConnectionStatus>({ github: false, gmail: false, slack: false });
  const [accessModes, setAccessModes] = useState<AccessModes>(defaultUserPermissions());
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [permissionsSaving, setPermissionsSaving] = useState<ConnectionKey | null>(null);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [disconnectingKey, setDisconnectingKey] = useState<string | null>(null);
  const [disconnectError, setDisconnectError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [approvalGateError, setApprovalGateError] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<DashboardPage>("chat");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [chats, setChats] = useState<StoredChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [models, setModels] = useState<AnzenModelOption[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const { isDark: d, toggleDarkMode } = useAnzenTheme();

  // Read by the transport at request time so approval auto-sends use the same
  // model the user picked, without rebuilding the transport on every change.
  const selectedModelRef = useRef<string | null>(null);
  selectedModelRef.current = selectedModelId;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages, body }) => ({
          body: { messages, model: selectedModelRef.current, ...body },
        }),
      }),
    []
  );

  const { messages, sendMessage, status: chatStatus, setMessages, addToolApprovalResponse } = useChat({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });
  const isLoading = chatStatus === "streaming" || chatStatus === "submitted";
  const pendingApprovals = findPendingManualApprovals(messages);

  const fetchPermissions = async () => {
    setPermissionsLoading(true);
    try {
      const response = await fetch("/api/permissions");
      if (!response.ok) throw new Error("Failed to fetch permissions");
      const data = (await response.json()) as { permissions?: AccessModes };
      if (data.permissions) setAccessModes(data.permissions);
    } catch (error) {
      console.error("Error fetching permissions:", error);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const response = await fetch("/api/audit");
      if (!response.ok) throw new Error("Failed to fetch audit logs");
      const data = (await response.json()) as { entries?: AuditEntry[] };
      setAuditEntries(data.entries ?? []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setAuditLoading(false);
    }
  };

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
          slack: data.results["sign-in-with-slack"]?.success === true,
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
    fetchPermissions();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchConnectionStatus();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (activePage === "activity") {
      void fetchAuditLogs();
    }
  }, [activePage]);

  // Chat history lives in the browser (lib/chat-history).
  useEffect(() => {
    setChats(loadChats());
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    const id = activeChatId ?? newChatId();
    if (!activeChatId) setActiveChatId(id);
    setChats((previous) => {
      const next = upsertChat(previous, {
        id,
        title: deriveChatTitle(messages),
        updatedAt: Date.now(),
        messages,
      });
      saveChats(next);
      return next;
    });
  }, [messages, activeChatId]);

  useEffect(() => {
    let cancelled = false;
    async function loadModels() {
      try {
        const res = await fetch("/api/models", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          models?: AnzenModelOption[];
          defaultModelId?: string | null;
        };
        if (cancelled) return;
        const available = data.models ?? [];
        setModels(available);
        const stored = window.localStorage.getItem(MODEL_STORAGE_KEY);
        const preferred =
          (stored && available.some((model) => model.id === stored) && stored) ||
          data.defaultModelId ||
          available[0]?.id ||
          null;
        setSelectedModelId(preferred);
      } catch {
        // Picker stays hidden when the model list can't be loaded.
      }
    }
    void loadModels();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelectModel = (id: string) => {
    setSelectedModelId(id);
    try {
      window.localStorage.setItem(MODEL_STORAGE_KEY, id);
    } catch {
      // Ignore storage failures (private mode / quota).
    }
  };

  const handleNewChat = () => {
    setActivePage("chat");
    setActiveChatId(null);
    setMessages([]);
    setInputValue("");
    setApprovalGateError(null);
  };

  const handleSelectChat = (id: string) => {
    const chat = chats.find((entry) => entry.id === id);
    if (!chat) return;
    setActivePage("chat");
    setActiveChatId(id);
    setMessages(chat.messages);
    setInputValue("");
    setApprovalGateError(null);
  };

  const handleDeleteChat = (id: string) => {
    setChats((previous) => {
      const next = previous.filter((chat) => chat.id !== id);
      saveChats(next);
      return next;
    });
    if (id === activeChatId) {
      setActiveChatId(null);
      setMessages([]);
    }
  };

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return;
    if (hasPendingManualApprovals(messages)) {
      setApprovalGateError("Confirm or cancel the pending action above before sending a new message.");
      return;
    }
    setApprovalGateError(null);
    const text = inputValue.trim();
    setInputValue("");
    void sendMessage({ text });
  };

  const handleSuggestion = (text: string) => {
    if (isLoading) return;
    if (hasPendingManualApprovals(messages)) {
      setApprovalGateError("Confirm or cancel the pending action above before sending a new message.");
      return;
    }
    setApprovalGateError(null);
    setInputValue("");
    void sendMessage({ text });
  };

  const handleAccessModeChange = async (providerKey: ConnectionKey, mode: ProviderAccessMode) => {
    setPermissionsSaving(providerKey);
    try {
      const res = await fetch("/api/permissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: providerKey, mode }),
      });
      const data = (await res.json()) as { permissions?: AccessModes; error?: string };
      if (!res.ok || !data.permissions) {
        console.error("Failed to update permissions:", data.error);
        return;
      }
      setAccessModes(data.permissions);
    } catch (error) {
      console.error("Error updating permissions:", error);
    } finally {
      setPermissionsSaving(null);
    }
  };

  const handleDisconnect = async (providerKey: string) => {
    const providerMap: Record<string, string> = {
      github: "github",
      gmail: "google-oauth2",
      slack: "sign-in-with-slack",
    };
    setDisconnectError(null);
    setDisconnectingKey(providerKey);
    try {
      const res = await fetch("/api/auth/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: providerMap[providerKey] }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setDisconnectError(data.error ?? "Failed to disconnect. Try again.");
        return;
      }
      await fetchConnectionStatus();
    } catch (error) {
      console.error("Error disconnecting:", error);
      setDisconnectError("Network error while disconnecting. Try again.");
    } finally {
      setDisconnectingKey(null);
    }
  };

  const connectedCount = Object.values(connStatus).filter(Boolean).length;
  const identity = resolveDisplayName(userName, userEmail);
  const greeting = identity.first
    ? `Ready when you are, ${identity.first}.`
    : "Ready when you are.";

  return (
    <div suppressHydrationWarning className="anzen-page flex h-screen overflow-hidden">
      <style>{`
        input::placeholder { color: var(--anzen-muted) !important; opacity: 1; }
        .anzen-scrollbar::-webkit-scrollbar { width: 8px; }
        .anzen-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .anzen-scrollbar::-webkit-scrollbar-thumb { background: color-mix(in oklab, var(--anzen-accent) 30%, transparent); border-radius: 4px; }
        .anzen-scrollbar::-webkit-scrollbar-thumb:hover { background: color-mix(in oklab, var(--anzen-accent) 50%, transparent); }
      `}</style>

      <AnzenSidebar
        activePage={activePage}
        onNavigate={setActivePage}
        onNewChat={handleNewChat}
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        connectedCount={connectedCount}
        statusLoading={statusLoading}
        isDark={d}
        onToggleDarkMode={toggleDarkMode}
        signOutHref={buildLogoutUrl("/")}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        userName={identity.full}
        userEmail={userEmail}
      />

      <main className="anzen-dash-main flex min-w-0 flex-1 flex-col bg-background">
        {/* No top nav bar: the sidebar is the only navigation. On mobile the
            sidebar is off-canvas, so keep a single menu affordance. */}
        <div className="flex shrink-0 items-center px-4 pt-4 md:hidden">
          <AnzenMobileMenuButton onClick={() => setMobileSidebarOpen(true)} />
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          {!tokenVaultScopesEnabled && (
            <div className="mx-4 mt-4 -mb-1 flex shrink-0 items-center justify-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-[13.5px] font-medium text-red-400 md:mx-8">
              <span className="size-1.5 shrink-0 rounded-full bg-red-500" />
              Connections disabled — set <code className="font-mono">AUTH0_TOKEN_VAULT_SCOPES=true</code> to enable them.
            </div>
          )}

          {/* CHAT */}
          {activePage === "chat" && (
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              <AnzenChatPanel
                messages={messages}
                input={inputValue}
                onInputChange={(value) => {
                  setInputValue(value);
                  if (approvalGateError) setApprovalGateError(null);
                }}
                onSubmit={handleSend}
                onSuggestion={handleSuggestion}
                isGenerating={isLoading}
                suggestions={SUGGESTIONS}
                inputDisabled={pendingApprovals.length > 0}
                placeholder={pendingApprovals.length > 0 ? "Confirm or cancel the action above first…" : "Message Anzen…"}
                userName={identity.full}
                userEmail={userEmail}
                emptyState={
                  <div className="flex flex-col items-center">
                    <h1 className="text-[clamp(28px,5vw,38px)] font-bold leading-[1.15] tracking-[-0.03em] text-foreground">
                      {greeting}
                    </h1>
                    <p className="mx-auto mt-4 max-w-[520px] text-[16px] leading-[1.6] text-muted-foreground">
                      An assistant that acts on your behalf. Securely connected to GitHub, Gmail, and
                      Slack using{" "}
                      <span className="font-semibold text-accent-foreground">Auth0 Token Vault</span>.
                    </p>
                    {tokenVaultScopesEnabled && connectedCount === 0 && !statusLoading && (
                      <div className="mt-9 flex flex-wrap items-center justify-center gap-2.5 rounded-full border border-primary/25 bg-accent px-5 py-2.5">
                        <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                        <span className="text-[13.5px] font-medium text-accent-foreground">
                          No accounts connected yet —{" "}
                          <button
                            type="button"
                            onClick={() => setActivePage("connections")}
                            className="font-semibold underline underline-offset-2 hover:no-underline"
                          >
                            open Connections
                          </button>
                        </span>
                      </div>
                    )}
                  </div>
                }
                toolApprovals={
                  <AnzenToolApprovals
                    messages={messages}
                    accessModes={accessModes}
                    onOpenConnections={() => setActivePage("connections")}
                    onApprove={(id, approved, reason) =>
                      addToolApprovalResponse(
                        approved
                          ? { id, approved: true }
                          : { id, approved: false, reason: reason ?? "User cancelled" }
                      )
                    }
                  />
                }
                modelSelector={
                  <AnzenModelPicker
                    models={models}
                    value={selectedModelId}
                    onChange={handleSelectModel}
                    disabled={isLoading}
                  />
                }
                composerNotice={
                  <>
                    {pendingApprovals.length > 0 && (
                      <div className="anzen-notice anzen-notice-accent mb-3">
                        <p className="mb-1 text-[14px] font-semibold text-accent-foreground">
                          {pendingApprovals.length === 1
                            ? "1 action waiting for your confirmation"
                            : `${pendingApprovals.length} actions waiting for your confirmation`}
                        </p>
                        <p className="text-[13.5px] leading-[1.5] text-muted-foreground">
                          Review the Confirm / Cancel cards above. New messages are paused until you respond.
                        </p>
                      </div>
                    )}
                    {approvalGateError && (
                      <p className="mb-2 text-[13.5px] leading-[1.5] text-red-400">{approvalGateError}</p>
                    )}
                  </>
                }
                footer={
                  <p className="text-[12.5px] leading-normal text-muted-foreground">
                    Processed by {AI_PROVIDER_SHORT_LABEL}.{" "}
                    <a href="/privacy" className="underline underline-offset-2 hover:text-foreground">Privacy</a>
                  </p>
                }
              />
            </div>
          )}

          {activePage === "connections" && (
            <AnzenConnectionsView
              header={<PageIntro page="connections" />}
              connStatus={connStatus}
              accessModes={accessModes}
              statusLoading={statusLoading}
              permissionsLoading={permissionsLoading}
              permissionsSaving={permissionsSaving}
              disconnectingKey={disconnectingKey}
              disconnectError={disconnectError}
              tokenVaultScopesEnabled={tokenVaultScopesEnabled}
              isDark={d}
              onAccessModeChange={handleAccessModeChange}
              onDisconnect={handleDisconnect}
            />
          )}

          {/* ACTIVITY */}
          {activePage === "activity" && (
            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-[800px] px-4 pb-16 pt-6 md:px-8">
                <PageIntro
                  page="activity"
                  trailing={
                    <button
                      type="button"
                      onClick={fetchAuditLogs}
                      disabled={auditLoading}
                      className="anzen-btn anzen-btn-secondary anzen-btn-sm"
                    >
                      {auditLoading ? "Loading…" : "Refresh"}
                    </button>
                  }
                />
                <p className="mb-5 text-center text-[14px] text-muted-foreground">
                  {auditLoading && auditEntries.length === 0
                    ? "Loading…"
                    : `${auditEntries.length} actions · ${auditEntries.filter((e) => e.outcome === "success").length} succeeded · ${auditEntries.filter((e) => e.outcome === "failure").length} failed`}
                </p>

                {auditLoading && auditEntries.length === 0 ? null : auditEntries.length === 0 ? (
                  <p className="py-14 text-center text-[15px] text-muted-foreground">
                    No recent activity yet.
                  </p>
                ) : (
                  <div className="border-t border-border">
                    {auditEntries.map((entry) => {
                      const ok = entry.outcome === "success";
                      const time = new Date(entry.timestamp).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      return (
                        <div
                          key={entry.id}
                          className="flex flex-col gap-1.5 border-b border-border py-5 md:flex-row md:items-start md:gap-8"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-[15px] leading-[1.6] text-foreground">
                              {entry.message}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                              <code className="rounded-md border border-border bg-muted/40 px-2 py-0.5 font-mono text-[12px] text-muted-foreground">
                                {entry.toolName}
                              </code>
                              <span className="anzen-meta">{time}</span>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center md:w-32 md:justify-end">
                            <span
                              className={cn(
                                "anzen-tag",
                                ok ? "anzen-tag-accent" : "anzen-tag-danger"
                              )}
                            >
                              {ok ? "Succeeded" : "Failed"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PRIVACY */}
          {activePage === "privacy" && (
            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-[720px] px-4 pb-16 pt-6 md:px-8">
                <PageIntro page="privacy" />
                <div className="flex flex-col">
                  {PRIVACY_SECTIONS.map((section) => (
                    <section key={section.id} className="border-b border-border py-7 first:pt-0">
                      <h2 className="mb-2 text-[17px] font-semibold tracking-[-0.015em] text-foreground">
                        {section.title}
                      </h2>
                      <div className="text-[15px] leading-[1.65] text-muted-foreground">
                        {section.body}
                      </div>
                    </section>
                  ))}
                </div>

                <p className="mt-8 text-center text-[14px] text-muted-foreground">
                  Full{" "}
                  <a href="/privacy" className="underline underline-offset-2 hover:text-foreground">
                    Privacy Policy
                  </a>{" "}
                  and{" "}
                  <a href="/terms" className="underline underline-offset-2 hover:text-foreground">
                    Terms of Service
                  </a>
                  .
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
