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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildConnectUrl, CONNECTIONS } from "@/lib/auth-connections";
import type { ProviderAccessMode } from "@/lib/permissions";

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
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-3xl px-4 pt-12 pb-16 md:px-8">
        <div className="mb-12">
          {header}
        </div>

        {disconnectError && (
          <Alert variant="destructive" className="mb-8 rounded-2xl border-destructive/20 bg-destructive/5">
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

        <div className="mb-10 flex justify-center">
          <Tabs value={filter} onValueChange={(next) => setFilter(next as FilterId)}>
            <TabsList className="h-11 rounded-full border-border/10 bg-card p-1">
              {FILTERS.map((item) => (
                <TabsTrigger 
                  key={item.id} 
                  value={item.id}
                  className="rounded-full px-6 py-2 text-xs font-medium data-[state=active]:bg-muted data-[state=active]:text-primary"
                >
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-col gap-4">
          {statusLoading && visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="mt-4 text-sm text-muted-foreground">Checking connections…</p>
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-sm text-muted-foreground">No connections in this view.</p>
            </div>
          ) : (
            visible.map((provider) => (
              <Card key={provider.key} className="overflow-hidden rounded-2xl border-border/50 bg-card shadow-sm transition-all hover:border-primary/20">
                <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:gap-6">
                  <div className="flex min-w-0 flex-1 items-center gap-5">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border/10 bg-muted">
                      {provider.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <p className="text-base font-semibold tracking-tight">{provider.label}</p>
                        {provider.connected && (
                          <Badge className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider border-none">
                            Connected
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{provider.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 sm:ml-auto">
                    <Badge variant="outline" className="rounded-full border-border/10 bg-muted/5 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      {provider.type.toLowerCase()}
                    </Badge>

                    <div className="sm:min-w-40 sm:text-right">
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
                        tokenVaultScopesEnabled ? (
                          <Button 
                            render={<a href={provider.connectHref} />} 
                            size="sm"
                            className="h-9 rounded-full bg-primary px-5 text-xs font-bold text-black hover:opacity-90"
                          >
                            Connect
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled
                            title="Set AUTH0_TOKEN_VAULT_SCOPES=true to enable connections"
                            className="h-9 rounded-full border-border/10 bg-muted/20 px-5 text-xs font-medium text-muted-foreground"
                          >
                            Connect
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {filter !== "connected" && (
          <div className="mt-20 border-t border-border/5 pt-12 text-center">
            <p className="mb-6 text-[10px] font-bold tracking-[0.2em] text-muted-foreground/40 uppercase">
              Coming later
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {COMING_SOON.map((app) => (
                <Badge
                  key={app.label}
                  variant="outline"
                  className="rounded-full border-border/10 bg-card px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/20 hover:text-foreground"
                >
                  <span className="mr-2.5 opacity-60">{app.icon}</span>
                  {app.label}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
