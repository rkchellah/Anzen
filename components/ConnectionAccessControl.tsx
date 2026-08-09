"use client";

import { useId } from "react";
import {
  accessModeDescription,
  accessModeLabel,
  PROVIDER_ACCESS_MODES,
  type ProviderAccessMode,
} from "@/lib/permissions";
import { cn } from "@/lib/utils";

type ConnectionAccessControlProps = {
  providerLabel: string;
  mode: ProviderAccessMode;
  onModeChange: (mode: ProviderAccessMode) => void;
  onDisconnect: () => void;
  disabled?: boolean;
  saving?: boolean;
  disconnecting?: boolean;
  isDark?: boolean;
};

export function ConnectionAccessControl({
  providerLabel,
  mode,
  onModeChange,
  onDisconnect,
  disabled = false,
  saving = false,
  disconnecting = false,
}: ConnectionAccessControlProps) {
  const selectId = useId();
  const helperId = useId();
  const busy = disabled || saving;

  return (
    <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
      <label htmlFor={selectId} className="sr-only">
        Access for {providerLabel}
      </label>
      <select
        id={selectId}
        value={mode}
        disabled={busy}
        aria-describedby={helperId}
        title={accessModeDescription(mode, providerLabel)}
        onChange={(event) => {
          const next = event.target.value;
          if (next === "read" || next === "read_write") {
            onModeChange(next);
          }
        }}
        className={cn(
          "h-9 cursor-pointer rounded-full border border-border bg-surface-2 px-3.5 text-[14px] font-medium text-foreground outline-none transition-colors hover:border-subtle",
          "focus-visible:ring-2 focus-visible:ring-ring/40",
          busy && "cursor-wait opacity-70"
        )}
      >
        {PROVIDER_ACCESS_MODES.map((option) => (
          <option key={option} value={option}>
            {accessModeLabel(option)}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={onDisconnect}
        disabled={disconnecting}
        aria-label={`Disconnect ${providerLabel}`}
        className={cn(
          "h-9 cursor-pointer rounded-full border-none bg-transparent px-3 text-[14px] font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline",
          disconnecting && "cursor-wait opacity-60"
        )}
      >
        {disconnecting ? "Disconnecting…" : "Disconnect"}
      </button>

      <span id={helperId} className="sr-only">
        {accessModeDescription(mode, providerLabel)}
      </span>
    </div>
  );
}
