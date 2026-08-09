"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { errorMessage, isAbortError, requestJson } from "@/lib/client-api";
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
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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
  const [statusError, setStatusError] = useState<string | null>(null);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [disconnectingKey, setDisconnectingKey] = useState<string | null>(null);
  const [disconnectError, setDisconnectError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [approvalGateError, setApprovalGateError] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<DashboardPage>("chat");
  // Held only so persistence can merge against previously stored chats; the
  // 60px rail has no chat list to render, so the value itself is never read.
  const [, setChats] = useState<StoredChat[]>([]);
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

  const { messages, sendMessage, status: chatStatus, setMessages, addToolApprovalResponse, error: chatError, clearError } = useChat({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    onError: (error) => {
      // Surfaced in the composer notice below; logged for diagnosis.
      console.error("[chat]", error);
    },
  });
  const isLoading = chatStatus === "streaming" || chatStatus === "submitted";
  const pendingApprovals = findPendingManualApprovals(messages);

  // One controller per concern so a refresh supersedes its own in-flight
  // request and unmount cancels everything, instead of setting state on a
  // component that is gone.
  const statusAbort = useRef<AbortController | null>(null);
  const permissionsAbort = useRef<AbortController | null>(null);
  const auditAbort = useRef<AbortController | null>(null);

  const fetchPermissions = useCallback(async () => {
    permissionsAbort.current?.abort();
    const controller = new AbortController();
    permissionsAbort.current = controller;

    setPermissionsLoading(true);
    setPermissionsError(null);
    try {
      const data = await requestJson<{ permissions?: AccessModes }>(
        "/api/permissions",
        { signal: controller.signal }
      );
      if (data.permissions) setAccessModes(data.permissions);
    } catch (error) {
      if (isAbortError(error)) return;
      setPermissionsError(
        errorMessage(error, "Couldn't load your access settings.")
      );
    } finally {
      if (permissionsAbort.current === controller) setPermissionsLoading(false);
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    auditAbort.current?.abort();
    const controller = new AbortController();
    auditAbort.current = controller;

    setAuditLoading(true);
    setAuditError(null);
    try {
      const data = await requestJson<{ entries?: AuditEntry[] }>("/api/audit", {
        signal: controller.signal,
      });
      setAuditEntries(data.entries ?? []);
    } catch (error) {
      if (isAbortError(error)) return;
      setAuditError(errorMessage(error, "Couldn't load your activity."));
    } finally {
      if (auditAbort.current === controller) setAuditLoading(false);
    }
  }, []);

  const fetchConnectionStatus = useCallback(async () => {
    statusAbort.current?.abort();
    const controller = new AbortController();
    statusAbort.current = controller;

    setStatusLoading(true);
    setStatusError(null);
    try {
      const data = await requestJson<{
        results?: Record<string, { success?: boolean }>;
      }>("/api/status", { signal: controller.signal });
      const results = data.results ?? {};
      setConnStatus({
        github: results["github"]?.success === true,
        gmail: results["google-oauth2"]?.success === true,
        slack: results["sign-in-with-slack"]?.success === true,
      });
    } catch (error) {
      if (isAbortError(error)) return;
      setStatusError(errorMessage(error, "Couldn't check your connections."));
    } finally {
      if (statusAbort.current === controller) setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchConnectionStatus();
    void fetchPermissions();

    // Re-check after the user returns from an OAuth connect flow in another tab.
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void fetchConnectionStatus();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      statusAbort.current?.abort();
      permissionsAbort.current?.abort();
      auditAbort.current?.abort();
    };
  }, [fetchConnectionStatus, fetchPermissions]);

  useEffect(() => {
    if (activePage === "activity") {
      void fetchAuditLogs();
    }
  }, [activePage, fetchAuditLogs]);

  // Chat history lives in the browser (lib/chat-history). Restore the most
  // recent conversation so a reload doesn't silently drop the thread.
  useEffect(() => {
    const stored = loadChats();
    setChats(stored);

    const latest = stored[0];
    if (!latest || latest.messages.length === 0) return;

    // A confirmation gate saved mid-flight can't be answered after a reload —
    // its run is gone server-side — so restore the thread up to that point.
    const upToApproval = latest.messages.findIndex((message) =>
      hasPendingManualApprovals([message])
    );
    const restorable =
      upToApproval === -1
        ? latest.messages
        : latest.messages.slice(0, upToApproval);
    if (restorable.length === 0) return;

    setActiveChatId(latest.id);
    setMessages(restorable);
  }, [setMessages]);

  // Persisting on every render would re-serialize the whole thread on each
  // streamed token. Coalesce into one write once output settles.
  useEffect(() => {
    if (messages.length === 0) return;
    const id = activeChatId ?? newChatId();
    if (!activeChatId) setActiveChatId(id);

    const timer = window.setTimeout(() => {
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
    }, 400);

    return () => window.clearTimeout(timer);
  }, [messages, activeChatId]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadModels() {
      try {
        const data = await requestJson<{
          models?: AnzenModelOption[];
          defaultModelId?: string | null;
        }>("/api/models", { cache: "no-store", signal: controller.signal });

        const available = data.models ?? [];
        setModels(available);

        let stored: string | null = null;
        try {
          stored = window.localStorage.getItem(MODEL_STORAGE_KEY);
        } catch {
          // Private mode — fall through to the server default.
        }
        setSelectedModelId(
          (stored && available.some((model) => model.id === stored) && stored) ||
            data.defaultModelId ||
            available[0]?.id ||
            null
        );
      } catch (error) {
        if (isAbortError(error)) return;
        // Picker stays hidden; chat still works on the server default model.
        console.error("[models]", error);
      }
    }

    void loadModels();
    return () => controller.abort();
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

  /** Shared guard: a queued write must be resolved before the thread moves on. */
  const blockedByPendingApproval = () => {
    if (!hasPendingManualApprovals(messages)) return false;
    setApprovalGateError(
      "Confirm or cancel the pending action above before sending a new message."
    );
    return true;
  };

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading || blockedByPendingApproval()) return;
    setApprovalGateError(null);
    clearError();
    setInputValue("");
    void sendMessage({ text: trimmed });
  };

  const handleSend = () => send(inputValue);
  const handleSuggestion = (text: string) => send(text);

  const handleAccessModeChange = async (
    providerKey: ConnectionKey,
    mode: ProviderAccessMode
  ) => {
    // Optimistic so the select doesn't lag; reverted below if the save fails.
    const previous = accessModes;
    setAccessModes({ ...previous, [providerKey]: mode });
    setPermissionsSaving(providerKey);
    setPermissionsError(null);
    try {
      const data = await requestJson<{ permissions?: AccessModes }>(
        "/api/permissions",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: providerKey, mode }),
        }
      );
      if (!data.permissions) throw new Error("Server returned no permissions.");
      setAccessModes(data.permissions);
    } catch (error) {
      setAccessModes(previous);
      setPermissionsError(
        errorMessage(error, "Couldn't save that access setting. Try again.")
      );
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
    const provider = providerMap[providerKey];
    if (!provider) {
      setDisconnectError(`Unknown provider: ${providerKey}`);
      return;
    }

    setDisconnectError(null);
    setDisconnectingKey(providerKey);
    try {
      const data = await requestJson<{ success?: boolean }>(
        "/api/auth/disconnect",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider }),
        }
      );
      if (!data.success) throw new Error("Disconnect did not complete.");
      await fetchConnectionStatus();
    } catch (error) {
      setDisconnectError(
        errorMessage(error, "Couldn't disconnect that account. Try again.")
      );
    } finally {
      setDisconnectingKey(null);
    }
  };

  const connectedCount = Object.values(connStatus).filter(Boolean).length;
  const identity = resolveDisplayName(userName, userEmail);

  return (
    <SidebarProvider suppressHydrationWarning className="h-screen overflow-hidden" style={{ "--sidebar-width": "60px" } as React.CSSProperties}>
      <AnzenSidebar
        activePage={activePage}
        onNavigate={setActivePage}
        onNewChat={handleNewChat}
        isDark={d}
        onToggleDarkMode={toggleDarkMode}
        userName={identity.full}
        userEmail={userEmail}
      />

      <SidebarInset className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
        {/* Top Header */}
        <header className="flex h-14 shrink-0 items-center justify-center border-b border-border/5 px-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground/80 tracking-tight">{userEmail}</span>
            <button
              type="button"
              onClick={() => setActivePage("connections")}
              className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary uppercase tracking-widest transition-opacity hover:opacity-80"
            >
              {statusLoading
                ? "checking…"
                : `${connectedCount} of 3 connected`}
            </button>
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
                    {chatError && (
                      <Alert variant="destructive" className="mb-3">
                        <AlertTriangle />
                        <AlertTitle>Anzen couldn&apos;t answer</AlertTitle>
                        <AlertDescription className="flex flex-col items-start gap-2">
                          <span>
                            {chatError.message ||
                              "Something went wrong while generating a response."}
                          </span>
                          <Button size="sm" variant="outline" onClick={() => clearError()}>
                            Dismiss
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}
                    {statusError && (
                      <Alert variant="destructive" className="mb-3">
                        <AlertDescription className="flex flex-wrap items-center gap-2">
                          <span>{statusError}</span>
                          <Button size="sm" variant="outline" onClick={() => void fetchConnectionStatus()}>
                            Retry
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}
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
              disconnectError={disconnectError ?? permissionsError ?? statusError}
              onRetryStatus={() => void fetchConnectionStatus()}
              tokenVaultScopesEnabled={tokenVaultScopesEnabled}
              isDark={d}
              onAccessModeChange={handleAccessModeChange}
              onDisconnect={handleDisconnect}
            />
          )}

          {/* ACTIVITY */}
          {activePage === "activity" && (
            <div className="flex-1 overflow-y-auto bg-background">
              <div className="mx-auto w-full max-w-3xl px-4 pt-12 pb-16 md:px-8">
                <PageIntro
                  page="activity"
                  trailing={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchAuditLogs}
                      disabled={auditLoading}
                      className="h-9 rounded-full border-border/10 bg-card px-5 text-[11px] font-bold uppercase tracking-wider hover:bg-muted/50"
                    >
                      <RefreshCw className={cn("size-3.5 mr-2", auditLoading && "animate-spin")} />
                      {auditLoading ? "Loading…" : "Refresh"}
                    </Button>
                  }
                />

                <div className="mt-8 mb-10 flex flex-wrap items-center justify-center gap-3">
                  <Badge variant="outline" className="rounded-full border-border/10 bg-card px-3.5 py-1 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
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

                {auditError && (
                  <Alert variant="destructive" className="mb-8 rounded-2xl">
                    <AlertDescription className="flex flex-wrap items-center gap-2">
                      <span>{auditError}</span>
                      <Button size="sm" variant="outline" onClick={() => void fetchAuditLogs()}>
                        Retry
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {auditLoading && auditEntries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : auditEntries.length === 0 ? (
                  <div className="rounded-3xl border border-border/20 bg-card/50 p-12 text-center">
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
                        <Card key={entry.id} className="overflow-hidden rounded-2xl border-border/50 bg-card shadow-sm transition-all hover:border-primary/20">
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
                                  <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 border border-border/5">
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
            <div className="flex-1 overflow-y-auto bg-background">
              <div className="mx-auto w-full max-w-3xl px-4 pt-12 pb-16 md:px-8">
                <PageIntro page="privacy" />
                <div className="mt-12 flex flex-col gap-6">
                  {PRIVACY_SECTIONS.map((section) => (
                    <Card key={section.id} className="overflow-hidden rounded-2xl border-border/50 bg-card shadow-sm">
                      <CardHeader className="border-b border-border/5 bg-muted/30 p-5">
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
