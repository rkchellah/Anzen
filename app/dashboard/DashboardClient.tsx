"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Shield,
  ShieldQuestion,
  XCircle,
} from "lucide-react";
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
import { AnzenSidebar, type DashboardPage } from "@/components/AnzenSidebar";
import { AnzenModelPicker, type AnzenModelOption } from "@/components/AnzenModelPicker";
import { AnzenToolApprovals } from "@/components/AnzenToolApprovals";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
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
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex flex-col items-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{copy.title}</h1>
        <p className="text-muted-foreground/60 mt-3 max-w-md text-sm leading-relaxed">{copy.subtitle}</p>
      </div>
      {trailing && <div className="mt-2">{trailing}</div>}
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
    <SidebarProvider suppressHydrationWarning className="h-screen overflow-hidden" style={{ "--sidebar-width": "60px" } as React.CSSProperties}>
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
        userName={identity.full}
        userEmail={userEmail}
      />

      <SidebarInset className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#080808]">
        {/* Top Header */}
        <header className="flex h-14 shrink-0 items-center justify-center border-b border-border/5 px-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground/80 tracking-tight">{userEmail}</span>
            <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary uppercase tracking-widest">
              gmail email
            </div>
            <Avatar className="size-5 ml-1">
              <AvatarFallback className="text-[8px] bg-muted/40 text-muted-foreground">
                {identity.initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">
          {!tokenVaultScopesEnabled && (
            <Alert variant="destructive" className="mx-4 mt-4 w-auto md:mx-8">
              <AlertTriangle />
              <AlertTitle>Connections disabled</AlertTitle>
              <AlertDescription>
                Set <code className="font-mono">AUTH0_TOKEN_VAULT_SCOPES=true</code> to enable
                account connections.
              </AlertDescription>
            </Alert>
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
                placeholder={pendingApprovals.length > 0 ? "Confirm or cancel the action above first…" : "Plan, Build, / for skills, @ for context"}
                userName={identity.full}
                userEmail={userEmail}
                emptyState={null}
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
                      <Alert className="mb-3">
                        <ShieldQuestion />
                        <AlertTitle>
                          {pendingApprovals.length === 1
                            ? "1 action waiting for your confirmation"
                            : `${pendingApprovals.length} actions waiting for your confirmation`}
                        </AlertTitle>
                        <AlertDescription>
                          Review the Confirm / Cancel cards above. New messages are paused until you
                          respond.
                        </AlertDescription>
                      </Alert>
                    )}
                    {approvalGateError && (
                      <Alert variant="destructive" className="mb-3">
                        <AlertDescription>{approvalGateError}</AlertDescription>
                      </Alert>
                    )}
                  </>
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
            <div className="flex-1 overflow-y-auto bg-[#080808]">
              <div className="mx-auto w-full max-w-3xl px-4 pt-12 pb-16 md:px-8">
                <PageIntro
                  page="activity"
                  trailing={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchAuditLogs}
                      disabled={auditLoading}
                      className="h-9 rounded-full border-border/10 bg-[#121212] px-5 text-[11px] font-bold uppercase tracking-wider hover:bg-muted/50"
                    >
                      <RefreshCw className={cn("size-3.5 mr-2", auditLoading && "animate-spin")} />
                      {auditLoading ? "Loading…" : "Refresh"}
                    </Button>
                  }
                />

                <div className="mt-8 mb-10 flex flex-wrap items-center justify-center gap-3">
                  <Badge variant="outline" className="rounded-full border-border/10 bg-[#121212] px-3.5 py-1 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                    {auditLoading && auditEntries.length === 0
                      ? "Loading audit history…"
                      : `${auditEntries.length} total actions`}
                  </Badge>
                  {auditEntries.length > 0 && (
                    <>
                      <Badge className="rounded-full bg-primary/10 px-3.5 py-1 text-[10px] font-bold text-primary uppercase tracking-widest border-none">
                        {auditEntries.filter((e) => e.outcome === "success").length} succeeded
                      </Badge>
                      {auditEntries.some((e) => e.outcome === "failure") && (
                        <Badge variant="destructive" className="rounded-full bg-destructive/10 px-3.5 py-1 text-[10px] font-bold text-destructive uppercase tracking-widest border-none">
                          {auditEntries.filter((e) => e.outcome === "failure").length} failed
                        </Badge>
                      )}
                    </>
                  )}
                </div>

                {auditLoading && auditEntries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : auditEntries.length === 0 ? (
                  <div className="rounded-3xl border border-border/20 bg-[#121212]/50 p-12 text-center">
                    <p className="text-sm font-semibold tracking-tight">No recent audit activity recorded yet.</p>
                    <p className="text-muted-foreground/60 mt-2 text-sm leading-relaxed max-w-xs mx-auto">
                      Actions requiring your confirmation are logged here automatically.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {auditEntries.map((entry) => {
                      const ok = entry.outcome === "success";
                      const time = new Date(entry.timestamp).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      return (
                        <Card key={entry.id} className="overflow-hidden rounded-2xl border-border/50 bg-[#121212] shadow-sm transition-all hover:border-primary/20">
                          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 flex-1 items-start gap-4">
                              <div className={cn(
                                "flex size-8 shrink-0 items-center justify-center rounded-lg border",
                                ok ? "border-primary/20 bg-primary/5 text-primary" : "border-destructive/20 bg-destructive/5 text-destructive"
                              )}>
                                {ok ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold tracking-tight leading-tight">{entry.message}</p>
                                <div className="text-muted-foreground/50 mt-2 flex flex-wrap items-center gap-2.5 text-[10px] font-bold uppercase tracking-wider">
                                  <span className="bg-[#1A1C1E] text-muted-foreground rounded-md px-2 py-0.5 border border-border/5">
                                    {entry.toolName}
                                  </span>
                                  <span>•</span>
                                  <span>{time}</span>
                                </div>
                              </div>
                            </div>

                            <Badge
                              className={cn(
                                "shrink-0 self-start sm:self-auto rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest border-none",
                                ok ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                              )}
                            >
                              {ok ? "Succeeded" : "Failed"}
                            </Badge>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PRIVACY */}
          {activePage === "privacy" && (
            <div className="flex-1 overflow-y-auto bg-[#080808]">
              <div className="mx-auto w-full max-w-3xl px-4 pt-12 pb-16 md:px-8">
                <PageIntro page="privacy" />
                <div className="mt-12 flex flex-col gap-6">
                  {PRIVACY_SECTIONS.map((section) => (
                    <Card key={section.id} className="overflow-hidden rounded-2xl border-border/50 bg-[#121212] shadow-sm">
                      <CardHeader className="border-b border-border/5 bg-[#1A1C1E]/30 p-5">
                        <CardTitle className="flex items-center gap-3 text-base font-bold tracking-tight">
                          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Shield className="size-4" />
                          </div>
                          {section.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-muted-foreground/80 p-6 text-sm leading-relaxed">
                        {section.body}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-16 border-t border-border/5 pt-10 text-center">
                  <p className="text-muted-foreground/50 text-[11px] font-bold uppercase tracking-[0.1em]">
                    Read full legal details
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-6">
                    <a href="/privacy" className="text-muted-foreground text-sm font-medium hover:text-primary underline-offset-4 hover:underline transition-colors">
                      Privacy Policy
                    </a>
                    <a href="/terms" className="text-muted-foreground text-sm font-medium hover:text-primary underline-offset-4 hover:underline transition-colors">
                      Terms of Service
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
