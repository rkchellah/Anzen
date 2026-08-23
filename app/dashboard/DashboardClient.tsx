"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, RefreshCw, ShieldQuestion } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses } from "ai";
import { findPendingManualApprovals, hasPendingManualApprovals } from "@/agent/pending-approvals";
import {
  chatErrorMessage,
  errorMessage,
  isAbortError,
  requestJson,
} from "@/lib/client-api";
import {
  deriveChatTitle,
  loadChats,
  newChatId,
  removeChat,
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
import { AnzenOnboarding } from "@/components/AnzenOnboarding";
import { emptyProfile, isProfileComplete, type UserProfile } from "@/lib/profile";
import { GitHubIcon, GmailIcon, SlackIcon } from "@/components/provider-icons";
import { connectionKeyForToolName } from "@/lib/tool-errors";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
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

const HEADER_TITLE: Record<DashboardPage, string> = {
  chat: "Chat",
  connections: "Apps",
  activity: "Activity",
  privacy: "Privacy",
};

const PAGE_COPY: Record<
  Exclude<DashboardPage, "chat">,
  { title: string; subtitle: string; status: string }
> = {
  connections: {
    title: "Apps",
    subtitle: "Install apps Anzen can use. Writes still need your confirmation.",
    status: "agent / apps",
  },
  activity: {
    title: "Activity",
    subtitle: "Write actions you confirmed.",
    status: "agent / activity",
  },
  privacy: {
    title: "Privacy",
    subtitle: "How Anzen handles your data.",
    status: "agent / privacy",
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
  // Same skeleton as the marketing pages — status line, tight display title,
  // lede — one step smaller so it sits under the 56px app bar rather than
  // competing with it.
  return (
    <div className="flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 flex-col">
        <div className="anzen-status-line mb-4">
          <span className="anzen-status-dot" />
          <span className="anzen-status-text">{copy.status}</span>
        </div>
        <h1 className="m-0 text-2xl leading-[1.05] font-extrabold tracking-[-0.04em] text-foreground">
          {copy.title}
        </h1>
        <p className="anzen-lede mt-2.5 text-sm">{copy.subtitle}</p>
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  );
}

// The label is the source, not a restatement of the prompt — it sits in the
// empty state's left gutter so the three rows scan as GitHub / Gmail / Slack.
/**
 * An audit row's icon is the service the action touched — the real GitHub,
 * Gmail or Slack mark — because that is the one thing about the row a glance
 * should tell you. A generic tick/cross in a coloured square said only what the
 * word beside it already said.
 */
function ToolMark({ toolName }: { toolName: string }) {
  const key = connectionKeyForToolName(toolName);
  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40">
      {key === "github" ? (
        <GitHubIcon size={17} />
      ) : key === "gmail" ? (
        <GmailIcon size={17} />
      ) : key === "slack" ? (
        <SlackIcon size={17} />
      ) : (
        // Unmapped tool — its own initial rather than a stand-in logo.
        <span className="font-mono text-[12px] text-muted-foreground">
          {toolName.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}

const SUGGESTIONS = [
  { label: "GitHub", prompt: "What issues are assigned to me?" },
  { label: "Gmail", prompt: "Summarize my unread emails" },
  { label: "Slack", prompt: "List my channels" },
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
  const [chats, setChats] = useState<StoredChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>(emptyProfile());
  // `null` = not loaded yet, so the dialog can't flash before we know whether
  // this user has already been through it.
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [editingName, setEditingName] = useState(false);
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
        // Omit `model` entirely until one is selected — sending `null` before
        // /api/models resolves fails the route's string check, and the server
        // already falls back to its default when the field is absent.
        prepareSendMessagesRequest: ({ messages, body }) => ({
          body: {
            messages,
            ...(selectedModelRef.current
              ? { model: selectedModelRef.current }
              : {}),
            ...body,
          },
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

  // The dashboard always opens on a new, empty chat. Prior conversations stay
  // in browser storage (lib/chat-history) and are read here only so the next
  // save merges against them instead of overwriting the list.
  useEffect(() => {
    setChats(loadChats());
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProfile() {
      try {
        const data = await requestJson<{ profile?: UserProfile }>("/api/profile", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (data.profile) setProfile(data.profile);
      } catch (error) {
        if (isAbortError(error)) return;
        // Treated as "not onboarded yet": the dialog is recoverable, a wrong
        // name in the agent's prompt is not.
        console.error("[profile]", error);
      } finally {
        if (!controller.signal.aborted) setProfileLoaded(true);
      }
    }

    void loadProfile();
    return () => controller.abort();
  }, []);

  // Persisting on every render would re-serialize the whole thread on each
  // streamed token. Coalesce into one write once output settles.
  useEffect(() => {
    if (messages.length === 0) return;
    const id = activeChatId ?? newChatId();
    if (!activeChatId) setActiveChatId(id);

    const timer = window.setTimeout(() => {
      setChats((previous) => {
        // Opening a past thread re-runs this effect. Without this guard it
        // would rewrite the chat with a fresh `updatedAt` and jump it to the
        // top of the sidebar for having been read.
        const stored = previous.find((chat) => chat.id === id);
        if (
          stored &&
          stored.messages.length === messages.length &&
          stored.messages.at(-1)?.id === messages.at(-1)?.id
        ) {
          return previous;
        }

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
      const next = removeChat(previous, id);
      saveChats(next);
      return next;
    });
    // Deleting the thread you are reading leaves you on an empty new one
    // rather than on a transcript that no longer exists anywhere.
    if (id === activeChatId) {
      setActiveChatId(null);
      setMessages([]);
      setApprovalGateError(null);
    }
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
  // What the user told us beats what the identity provider guessed.
  const preferredName = profile.preferredName || identity.first || "";
  const fullName = profile.fullName || identity.full;
  const needsOnboarding = profileLoaded && !isProfileComplete(profile);

  const modelPicker = (
    <AnzenModelPicker
      models={models}
      value={selectedModelId}
      onChange={handleSelectModel}
      disabled={isLoading}
    />
  );

  return (
    // Starts collapsed to the icon rail: the app is a chat, and a first-time
    // visitor should meet the composer, not a column of navigation. The user's
    // own choice is remembered in the `sidebar_state` cookie from then on.
    <SidebarProvider
      suppressHydrationWarning
      defaultOpen={false}
      className="h-screen overflow-hidden"
    >
      <AnzenSidebar
        activePage={activePage}
        onNavigate={setActivePage}
        onNewChat={handleNewChat}
        isDark={d}
        onToggleDarkMode={toggleDarkMode}
        preferredName={preferredName}
        fullName={fullName}
        onEditName={() => setEditingName(true)}
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
      />

      <SidebarInset className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
        <header className="anzen-appbar">
          <div className="anzen-appbar-inner">
            <SidebarTrigger className="-ml-1.5 size-8 rounded-lg text-muted-foreground hover:text-foreground" />
            <Separator orientation="vertical" className="h-4" />
            <div className="min-w-0 flex-1">
              {/* On chat, name the thread rather than repeating the word "Chat" —
                  the title is already derived for the history store. The account
                  email used to sit underneath; it is already in the sidebar
                  footer, and restating it here made the bar a two-line block
                  that said nothing about where you are. */}
              <p className="truncate text-sm font-semibold tracking-tight text-foreground">
                {activePage === "chat" && messages.length > 0
                  ? deriveChatTitle(messages)
                  : HEADER_TITLE[activePage]}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {/* Connection count doubles as the shortcut into Apps. */}
              <button
                type="button"
                onClick={() => setActivePage("connections")}
                className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground sm:inline-flex"
              >
                <span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    statusLoading
                      ? "bg-muted-foreground/40"
                      : connectedCount > 0
                        ? "bg-primary shadow-[0_0_6px_var(--anzen-accent)]"
                        : "bg-muted-foreground/40"
                  )}
                />
                {statusLoading ? "Checking…" : `${connectedCount} of 3 apps`}
              </button>
              {activePage === "chat" ? modelPicker : null}
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">
          {!tokenVaultScopesEnabled && (
            <div className="anzen-page-col !py-4">
              <Alert variant="destructive" className="rounded-2xl">
                <AlertTriangle />
                <AlertTitle>Connections disabled</AlertTitle>
                <AlertDescription>
                  Set <code className="font-mono">AUTH0_TOKEN_VAULT_SCOPES=true</code> to enable
                  account connections.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* CHAT — the transcript centres itself in a narrow reading column
              (`.anzen-read-col`), so this wrapper only owns the gutters. */}
          {activePage === "chat" && (
            <div className="flex min-h-0 w-full flex-1 flex-col px-4 md:px-8">
              <AnzenChatPanel
                className="h-full"
                userName={preferredName || undefined}
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
                composerNotice={
                  <>
                    {chatError && (
                      <Alert variant="destructive">
                        <AlertTriangle />
                        <AlertTitle>Anzen couldn&apos;t answer</AlertTitle>
                        <AlertDescription className="flex flex-col items-start gap-2">
                          <span>
                            {chatErrorMessage(
                              chatError,
                              "Something went wrong while generating a response."
                            )}
                          </span>
                          <Button size="sm" variant="outline" onClick={() => clearError()}>
                            Dismiss
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}
                    {statusError && (
                      <Alert variant="destructive">
                        <AlertDescription className="flex flex-wrap items-center gap-2">
                          <span>{statusError}</span>
                          <Button size="sm" variant="outline" onClick={() => void fetchConnectionStatus()}>
                            Retry
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}
                    {pendingApprovals.length > 0 && (
                      <Alert>
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
                      <Alert variant="destructive">
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
            <div className="anzen-scroll flex-1 overflow-y-auto">
              <div className="anzen-page-col">
                <PageIntro
                  page="activity"
                  trailing={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchAuditLogs}
                      disabled={auditLoading}
                      className="h-9 rounded-full border-border bg-card px-4 text-xs font-medium hover:bg-muted"
                    >
                      <RefreshCw className={cn("mr-2 size-3.5", auditLoading && "animate-spin")} />
                      {auditLoading ? "Loading…" : "Refresh"}
                    </Button>
                  }
                />

                {/* Counts read as one sentence of fact. Three coloured capsules
                    made three small claims compete for the same glance. */}
                <div className="mt-6 mb-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  {auditLoading && auditEntries.length === 0 ? (
                    <span>Loading audit history…</span>
                  ) : (
                    <>
                      <span>
                        <span className="tabular-nums font-medium text-foreground">
                          {auditEntries.length}
                        </span>{" "}
                        {auditEntries.length === 1 ? "action" : "actions"}
                      </span>
                      {auditEntries.length > 0 && (
                        <span className="flex items-center gap-1.5">
                          <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                          <span className="tabular-nums font-medium text-foreground">
                            {auditEntries.filter((e) => e.outcome === "success").length}
                          </span>{" "}
                          succeeded
                        </span>
                      )}
                      {auditEntries.some((e) => e.outcome === "failure") && (
                        <span className="flex items-center gap-1.5">
                          <span className="size-1.5 shrink-0 rounded-full bg-destructive" />
                          <span className="tabular-nums font-medium text-foreground">
                            {auditEntries.filter((e) => e.outcome === "failure").length}
                          </span>{" "}
                          failed
                        </span>
                      )}
                    </>
                  )}
                </div>

                {auditError && (
                  <Alert variant="destructive" className="mb-8 rounded-2xl border-destructive/20 bg-destructive/5">
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
                  <div className="anzen-surface-card p-6">
                    <p className="text-sm font-medium">No recent activity yet.</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      Actions requiring your confirmation are logged here.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
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
                          className="anzen-surface-card anzen-surface-card-hover flex items-start gap-3.5 p-4"
                        >
                          <ToolMark toolName={entry.toolName} />

                          <div className="min-w-0 flex-1">
                            <p className="anzen-break-anywhere text-sm leading-snug font-medium tracking-tight">
                              {entry.message}
                            </p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span className="font-mono text-[11px]">{entry.toolName}</span>
                              <span className="text-muted-foreground/40">•</span>
                              <span className="tabular-nums">{time}</span>
                            </div>
                          </div>

                          {/* Outcome is a dot, not a word — the message already
                              says what happened, and "Failed" printed beside a
                              failure message states it twice. */}
                          <span
                            className={cn(
                              "mt-1.5 size-2 shrink-0 rounded-full",
                              ok
                                ? "bg-primary shadow-[0_0_6px_var(--anzen-accent)]"
                                : "bg-destructive"
                            )}
                          />
                          <span className="sr-only">{ok ? "Succeeded" : "Failed"}</span>
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
            <div className="anzen-scroll flex-1 overflow-y-auto">
              <div className="anzen-page-col">
                <PageIntro page="privacy" />
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {PRIVACY_SECTIONS.map((section) => (
                    <article
                      key={section.id}
                      className="anzen-surface-card anzen-surface-card-hover overflow-hidden"
                    >
                      <div className="border-b border-border px-5 py-3.5">
                        <h2 className="text-sm font-semibold tracking-tight">{section.title}</h2>
                      </div>
                      <div className="px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                        {section.body}
                      </div>
                    </article>
                  ))}
                </div>

                <div className="mt-10 flex items-center gap-5 border-t border-border pt-6">
                  <a
                    href="/privacy"
                    className="text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
                  >
                    Privacy Policy
                  </a>
                  <a
                    href="/terms"
                    className="text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
                  >
                    Terms of Service
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
