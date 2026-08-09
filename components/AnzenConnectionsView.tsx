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
import { ConnectionAccessControl } from "@/components/ConnectionAccessControl";
import { buildConnectUrl, CONNECTIONS } from "@/lib/auth-connections";
import type { ProviderAccessMode } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type ConnectionKey = keyof typeof CONNECTIONS;
type ConnectionStatus = Record<ConnectionKey, boolean>;
type AccessModes = Record<ConnectionKey, ProviderAccessMode>;
type FilterId = "all" | "connected" | "available";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "connected", label: "Connected" },
  { id: "available", label: "Not connected" },
];

const COMING_SOON = [
  { label: "Teams", icon: <TeamsIcon size={18} /> },
  { label: "LinkedIn", icon: <LinkedInIcon size={18} /> },
  { label: "GitLab", icon: <GitLabIcon size={18} /> },
  { label: "Notion", icon: <NotionIcon size={18} /> },
  { label: "Linear", icon: <LinearIcon size={18} /> },
];

function providerIcon(key: ConnectionKey): ReactNode {
  if (key === "github") return <GitHubIcon size={18} />;
  if (key === "gmail") return <GmailIcon size={18} />;
  return <SlackIcon size={18} />;
}

function providerType(key: ConnectionKey): string {
  if (key === "github") return "CODE";
  if (key === "gmail") return "EMAIL";
  return "CHAT";
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
  header?: ReactNode;
}) {
  const [filter, setFilter] = useState<FilterId>("all");

  const providers = useMemo(
    () =>
      (["github", "gmail", "slack"] as const).map((key) => ({
        key,
        label: CONNECTIONS[key].label,
        desc: CONNECTIONS[key].desc,
        type: providerType(key),
        connectHref: buildConnectUrl(key, "/dashboard"),
        icon: providerIcon(key),
        connected: connStatus[key],
      })),
    [connStatus]
  );

  const visible = providers.filter((provider) => {
    if (filter === "connected") return provider.connected;
    if (filter === "available") return !provider.connected;
    return true;
  });

  return (
    <div className="anzen-scrollbar flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[800px] px-4 pb-16 pt-6 md:px-8">
        {header}
        {disconnectError && (
          <div className="anzen-notice anzen-notice-danger mb-6">{disconnectError}</div>
        )}

        <div className="mb-6 flex justify-center">
          <div className="anzen-segmented" role="group" aria-label="Filter connections">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={filter === item.id}
                onClick={() => setFilter(item.id)}
                className="anzen-segmented-item"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-border">
          {statusLoading && visible.length === 0 ? (
            <p className="py-14 text-center text-[15px] text-muted-foreground">
              Checking connections…
            </p>
          ) : visible.length === 0 ? (
            <p className="py-14 text-center text-[15px] text-muted-foreground">
              No connections in this view.
            </p>
          ) : (
            visible.map((provider) => (
              <div
                key={provider.key}
                className="flex flex-col gap-4 border-b border-border py-6 sm:flex-row sm:items-center sm:gap-8"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="anzen-icon-tile size-11 rounded-xl">
                    {provider.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[16px] font-semibold tracking-[-0.015em] text-foreground">
                        {provider.label}
                      </p>
                      {provider.connected && (
                        <span className="anzen-tag anzen-tag-accent">Connected</span>
                      )}
                    </div>
                    <p className="mt-1 text-[14px] leading-[1.55] text-muted-foreground">
                      {provider.desc}
                    </p>
                  </div>
                </div>

                <p className="anzen-meta w-20 shrink-0 capitalize">
                  {provider.type.toLowerCase()}
                </p>

                <div className="sm:min-w-[280px] sm:text-right">
                  {provider.connected ? (
                    <ConnectionAccessControl
                      providerLabel={provider.label}
                      mode={accessModes[provider.key]}
                      onModeChange={(mode) => onAccessModeChange(provider.key, mode)}
                      onDisconnect={() => onDisconnect(provider.key)}
                      disabled={permissionsLoading}
                      saving={permissionsSaving === provider.key}
                      disconnecting={disconnectingKey === provider.key}
                    />
                  ) : (
                    <a
                      href={tokenVaultScopesEnabled ? provider.connectHref : "#"}
                      aria-disabled={!tokenVaultScopesEnabled}
                      onClick={(event) => {
                        if (!tokenVaultScopesEnabled) event.preventDefault();
                      }}
                      className={cn(
                        "anzen-btn anzen-btn-secondary anzen-btn-sm",
                        !tokenVaultScopesEnabled && "pointer-events-none opacity-50"
                      )}
                    >
                      Connect
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {filter !== "connected" && (
          <div className="mt-12 text-center">
            <p className="anzen-eyebrow mb-4">Coming later</p>
            <div className="flex flex-wrap justify-center gap-2">
              {COMING_SOON.map((app) => (
                <span
                  key={app.label}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-[14px] text-muted-foreground"
                >
                  {app.icon}
                  {app.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
