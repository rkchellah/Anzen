import type { ConnectionKey } from "@/lib/auth-connections";
import { CONNECTIONS } from "@/lib/auth-connections";

export type ProviderAccessMode = "read" | "read_write";

export const PROVIDER_ACCESS_MODES: readonly ProviderAccessMode[] = [
  "read",
  "read_write",
];

export const CONNECTION_KEYS: readonly ConnectionKey[] = [
  "github",
  "gmail",
  "slack",
];

export type UserPermissions = Record<ConnectionKey, ProviderAccessMode>;

export function defaultUserPermissions(): UserPermissions {
  return {
    github: "read_write",
    gmail: "read_write",
    slack: "read_write",
  };
}

export function isProviderAccessMode(value: string): value is ProviderAccessMode {
  return (PROVIDER_ACCESS_MODES as readonly string[]).includes(value);
}

export function isConnectionKey(value: string): value is ConnectionKey {
  return (CONNECTION_KEYS as readonly string[]).includes(value);
}

export function accessModeLabel(mode: ProviderAccessMode): string {
  return mode === "read" ? "Read only" : "Read & write";
}

export function accessModeDescription(
  mode: ProviderAccessMode,
  providerLabel: string
): string {
  if (mode === "read") {
    return `Anzen can view and summarize your ${providerLabel} data. It cannot make changes on your behalf.`;
  }
  return `Anzen can view your ${providerLabel} data and suggest changes. You still confirm each write before it runs.`;
}

export function providerLabelForKey(key: ConnectionKey): string {
  return CONNECTIONS[key].label;
}
