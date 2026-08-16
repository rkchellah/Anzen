"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  GitHubIcon,
  GitLabIcon,
  GmailIcon,
  LinearIcon,
  LinkedInIcon,
  NotionIcon,
  SlackIcon,
  TeamsIcon,
} from "@/components/provider-icons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buildConnectUrl, CONNECTIONS } from "@/lib/auth-connections";
import {
  accessModeDescription,
  accessModeLabel,
  PROVIDER_ACCESS_MODES,
  type ProviderAccessMode,
} from "@/lib/permissions";
import { cn } from "@/lib/utils";

type ConnectionKey = keyof typeof CONNECTIONS;
type ConnectionStatus = Record<ConnectionKey, boolean>;
type AccessModes = Record<ConnectionKey, ProviderAccessMode>;

const NOT_YET_AVAILABLE: Array<{ label: string; icon: ReactNode }> = [
  { label: "Teams", icon: <TeamsIcon size={20} /> },
  { label: "LinkedIn", icon: <LinkedInIcon size={20} /> },
  { label: "GitLab", icon: <GitLabIcon size={20} /> },
  { label: "Notion", icon: <NotionIcon size={20} /> },
  { label: "Linear", icon: <LinearIcon size={20} /> },
];

function providerIcon(key: ConnectionKey, size = 40): ReactNode {
  if (key === "github") return <GitHubIcon size={size} />;
  if (key === "gmail") return <GmailIcon size={size} />;
  return <SlackIcon size={size} />;
}

export function AnzenConnectionsView({
  connStatus,
  accessModes,
  statusLoading,
  permissionsLoading,
  permissionsSaving,
  disconnectingKey,
  disconnectError,
  tokenVaultScopesEnabled,
  onAccessModeChange,
  onDisconnect,
  onRetryStatus,
  header,
}: {
  connStatus: ConnectionStatus;
  accessModes: AccessModes;
  statusLoading: boolean;
  permissionsLoading: boolean;
  permissionsSaving: ConnectionKey | null;
  disconnectingKey: string | null;
  disconnectError: string | null;
  tokenVaultScopesEnabled: boolean;
  isDark?: boolean;
  onAccessModeChange: (key: ConnectionKey, mode: ProviderAccessMode) => void;
  onDisconnect: (key: string) => void;
  onRetryStatus?: () => void;
  header?: ReactNode;
}) {
  const providers = useMemo(
    () =>
      (["github", "gmail", "slack"] as const).map((key) => ({
        key,
        label: CONNECTIONS[key].label,
        desc: CONNECTIONS[key].desc,
        connectHref: buildConnectUrl(key, "/dashboard"),
        connected: connStatus[key],
      })),
    [connStatus]
  );

  const connected = providers.filter((p) => p.connected);
  const available = providers.filter((p) => !p.connected);

  const [selectedKey, setSelectedKey] = useState<ConnectionKey | null>(null);
  const selected =
    connected.find((p) => p.key === (selectedKey ?? connected[0]?.key)) ?? null;

  return (
    <div className="anzen-scroll flex-1 overflow-y-auto bg-background">
      <div className="anzen-page-col">
        {header}

        {disconnectError && (
          <Alert
            variant="destructive"
            className="mt-8 rounded-2xl border-destructive/20 bg-destructive/5"
          >
            <AlertDescription className="flex flex-wrap items-center gap-3">
              <span>{disconnectError}</span>
              {onRetryStatus && (
                <Button size="sm" variant="outline" onClick={onRetryStatus}>
                  Retry
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Connected — logo tiles, with the selected app's settings beside them. */}
        <section className="mt-10">
          <p className="anzen-section-label mb-4">Connected</p>

          {statusLoading && connected.length === 0 ? (
            <div className="flex items-center gap-3 py-10">
              <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">
                Checking connections…
              </p>
            </div>
          ) : connected.length === 0 ? (
            <div className="anzen-surface-card px-5 py-8 text-sm text-muted-foreground">
              No apps connected yet. Install one below.
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[auto_minmax(0,1fr)]">
              <div className="flex flex-wrap items-start gap-3">
                {connected.map((provider) => {
                  const isActive = selected?.key === provider.key;
                  return (
                    <button
                      key={provider.key}
                      type="button"
                      onClick={() => setSelectedKey(provider.key)}
                      aria-pressed={isActive}
                      aria-label={`${provider.label} connection`}
                      className={cn(
                        "anzen-surface-card flex size-[88px] items-center justify-center",
                        isActive
                          ? "border-primary/40 ring-1 ring-primary/25"
                          : "anzen-surface-card-hover"
                      )}
                    >
                      {providerIcon(provider.key, 34)}
                    </button>
                  );
                })}
              </div>

              {/* Settings for the tile currently selected above. */}
              {selected && (
                <div className="anzen-surface-card p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                      {providerIcon(selected.key, 18)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold tracking-tight">
                        {selected.label}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {selected.desc}
                      </p>
                    </div>
                    {/* The access mode used to be repeated as a green capsule
                        here, directly above the control that sets it. */}
                  </div>

                  <div className="space-y-3 border-t border-border pt-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-medium text-muted-foreground">
                        Access mode
                      </span>
                      {/* Was a bare <select>, which the OS paints itself — a
                          white popup with a blue highlight in a dark app. */}
                      <Select
                        value={accessModes[selected.key]}
                        onValueChange={(next) => {
                          if (next === "read" || next === "read_write") {
                            onAccessModeChange(selected.key, next);
                          }
                        }}
                        disabled={
                          permissionsLoading || permissionsSaving === selected.key
                        }
                      >
                        <SelectTrigger
                          size="sm"
                          aria-label={`Access for ${selected.label}`}
                          className="w-[9.5rem] rounded-lg border-border bg-card text-xs transition-colors hover:border-primary/30"
                        >
                          <SelectValue>
                            {() => accessModeLabel(accessModes[selected.key])}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent
                          align="end"
                          alignItemWithTrigger={false}
                          sideOffset={6}
                          className="w-[17rem] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-popover p-1.5 shadow-[var(--anzen-elev-3)] ring-0"
                        >
                          {PROVIDER_ACCESS_MODES.map((mode) => (
                            <SelectItem
                              key={mode}
                              value={mode}
                              className="cursor-pointer items-start rounded-lg py-2 pr-9 pl-2.5"
                            >
                              <span className="flex min-w-0 flex-col gap-0.5">
                                <span className="text-[13px] leading-tight font-medium text-foreground">
                                  {accessModeLabel(mode)}
                                </span>
                                {/* `!` because the item's focus style recolours
                                    every descendant to the accent, which leaves
                                    the description as green-on-green. */}
                                <span className="text-[11px] leading-snug text-muted-foreground!">
                                  {mode === "read"
                                    ? "View and summarize only"
                                    : "Suggest changes; you confirm each write"}
                                </span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {accessModeDescription(
                        accessModes[selected.key],
                        selected.label
                      )}
                    </p>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDisconnect(selected.key)}
                      disabled={disconnectingKey === selected.key}
                      className="mt-1 h-8 w-full justify-center rounded-lg text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      {disconnectingKey === selected.key
                        ? "Disconnecting…"
                        : "Disconnect"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Apps to install */}
        <section className="mt-12">
          <p className="anzen-section-label mb-4">Apps</p>

          {available.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Every available app is installed.
            </p>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {available.map((provider) => (
              <article
                key={provider.key}
                className="anzen-surface-card anzen-surface-card-hover flex flex-col p-5"
              >
                <div className="mb-4 flex size-11 items-center justify-center rounded-xl border border-border bg-muted/50">
                  {providerIcon(provider.key, 24)}
                </div>
                <h3 className="text-sm font-semibold tracking-tight">
                  {provider.label}
                </h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {provider.desc}
                </p>

                {tokenVaultScopesEnabled ? (
                  <Button
                    render={<a href={provider.connectHref} />}
                    className="mt-5 h-9 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90"
                  >
                    Install
                  </Button>
                ) : (
                  <Button
                    disabled
                    title="Set AUTH0_TOKEN_VAULT_SCOPES=true to enable connections"
                    className="mt-5 h-9 w-full rounded-lg bg-muted text-sm font-medium text-muted-foreground"
                  >
                    Install
                  </Button>
                )}
              </article>
            ))}

          </div>

          {/* Unbuilt integrations: their real marks, dimmed, with no invented
              description and no dead Install button on each. */}
          <p className="anzen-tile-label mt-10 mb-3">Not available yet</p>
          <div className="flex flex-wrap gap-2">
            {NOT_YET_AVAILABLE.map((app) => (
              <span
                key={app.label}
                className="flex items-center gap-2 rounded-[10px] border border-border bg-card/50 py-1.5 pr-3 pl-2.5 text-xs text-muted-foreground"
              >
                <span className="flex size-5 shrink-0 items-center justify-center opacity-45 grayscale">
                  {app.icon}
                </span>
                {app.label}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
