"use client";

import { useId } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  accessModeDescription,
  accessModeLabel,
  PROVIDER_ACCESS_MODES,
  type ProviderAccessMode,
} from "@/lib/permissions";

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
  const helperId = useId();
  const busy = disabled || saving;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Select
        value={mode}
        onValueChange={(next) => {
          if (next === "read" || next === "read_write") onModeChange(next);
        }}
        disabled={busy}
      >
        <SelectTrigger
          size="sm"
          aria-label={`Access for ${providerLabel}`}
          aria-describedby={helperId}
          className="min-w-36"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PROVIDER_ACCESS_MODES.map((option) => (
            <SelectItem key={option} value={option}>
              {accessModeLabel(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="ghost"
        size="sm"
        onClick={onDisconnect}
        disabled={disconnecting}
        aria-label={`Disconnect ${providerLabel}`}
        className="text-muted-foreground hover:text-destructive"
      >
        {disconnecting ? "Disconnecting…" : "Disconnect"}
      </Button>

      <span id={helperId} className="sr-only">
        {accessModeDescription(mode, providerLabel)}
      </span>
    </div>
  );
}
