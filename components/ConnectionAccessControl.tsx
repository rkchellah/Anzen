"use client";

import { useCallback, useId, useRef } from "react";
import { Unlink } from "lucide-react";
import {
  accessModeDescription,
  accessModeLabel,
  PROVIDER_ACCESS_MODES,
  type ProviderAccessMode,
} from "@/lib/permissions";

export type ConnectionAccessColors = {
  border: string;
  surface: string;
  surface2: string;
  tx: string;
  muted: string;
  caption: string;
};

type ConnectionAccessControlProps = {
  providerLabel: string;
  mode: ProviderAccessMode;
  onModeChange: (mode: ProviderAccessMode) => void;
  onDisconnect: () => void;
  disabled?: boolean;
  saving?: boolean;
  disconnecting?: boolean;
  colors: ConnectionAccessColors;
  isDark: boolean;
};

export function ConnectionAccessControl({
  providerLabel,
  mode,
  onModeChange,
  onDisconnect,
  disabled = false,
  saving = false,
  disconnecting = false,
  colors,
  isDark,
}: ConnectionAccessControlProps) {
  const helperId = useId();
  const groupRef = useRef<HTMLDivElement>(null);
  const busy = disabled || saving;

  const focusSegment = useCallback((index: number) => {
    const buttons = groupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    buttons?.[index]?.focus();
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (busy) return;

    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % PROVIDER_ACCESS_MODES.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + PROVIDER_ACCESS_MODES.length) % PROVIDER_ACCESS_MODES.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = PROVIDER_ACCESS_MODES.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      const nextMode = PROVIDER_ACCESS_MODES[nextIndex]!;
      onModeChange(nextMode);
      focusSegment(nextIndex);
    }
  };

  const activeIndex = PROVIDER_ACCESS_MODES.indexOf(mode);
  const helperText = accessModeDescription(mode, providerLabel);

  const trackBg = colors.surface2;
  const indicatorBg = colors.surface;
  const focusRing = isDark ? "rgba(240,240,238,0.55)" : "rgba(0,0,0,0.45)";

  return (
    <div style={{ width: "100%" }}>
      <p
        style={{
          fontSize: 12,
          color: colors.muted,
          margin: "0 0 8px",
          textAlign: "center",
          lineHeight: 1.4,
        }}
      >
        What Anzen can do
      </p>

      <div
        ref={groupRef}
        role="radiogroup"
        aria-label={`What Anzen can do with ${providerLabel}`}
        aria-describedby={helperId}
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          padding: 3,
          borderRadius: 999,
          background: trackBg,
          border: `1px solid ${colors.border}`,
          opacity: busy ? 0.72 : 1,
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 3,
            bottom: 3,
            left: 3,
            width: "calc(50% - 3px)",
            borderRadius: 999,
            background: indicatorBg,
            border: `1px solid ${colors.border}`,
            boxShadow: isDark
              ? "0 1px 3px rgba(0,0,0,0.35)"
              : "0 1px 2px rgba(0,0,0,0.06)",
            transform: `translateX(${activeIndex * 100}%)`,
            transition: "transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
            pointerEvents: "none",
          }}
        />

        {PROVIDER_ACCESS_MODES.map((option, index) => {
          const selected = mode === option;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              disabled={busy}
              onClick={() => {
                if (!selected) onModeChange(option);
              }}
              onKeyDown={(event) => handleKeyDown(event, index)}
              style={{
                position: "relative",
                zIndex: 1,
                flex: 1,
                padding: "8px 10px",
                fontSize: 12,
                fontWeight: selected ? 600 : 500,
                fontFamily: "inherit",
                color: selected ? colors.tx : colors.muted,
                background: "transparent",
                border: "none",
                borderRadius: 999,
                cursor: busy ? "wait" : "pointer",
                transition: "color 0.15s ease",
                outline: "none",
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = `0 0 0 2px ${focusRing}`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {accessModeLabel(option)}
            </button>
          );
        })}
      </div>

      <p
        id={helperId}
        aria-live="polite"
        style={{
          fontSize: 11,
          color: colors.caption,
          margin: "8px 0 0",
          textAlign: "center",
          lineHeight: 1.45,
          minHeight: "2.9em",
        }}
      >
        {helperText}
      </p>

      <div
        style={{
          marginTop: 14,
          paddingTop: 12,
          borderTop: `1px solid ${colors.border}`,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <button
          type="button"
          onClick={onDisconnect}
          disabled={disconnecting}
          aria-label={`Disconnect ${providerLabel}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "2px 4px",
            fontSize: 11.5,
            fontWeight: 500,
            fontFamily: "inherit",
            color: colors.caption,
            background: "transparent",
            border: "none",
            cursor: disconnecting ? "wait" : "pointer",
            opacity: disconnecting ? 0.6 : 1,
            textDecoration: "underline",
            textUnderlineOffset: 3,
            textDecorationColor: isDark ? "rgba(240,240,238,0.22)" : "rgba(0,0,0,0.18)",
            outline: "none",
          }}
          onMouseEnter={(e) => {
            if (!disconnecting) e.currentTarget.style.color = colors.muted;
          }}
          onMouseLeave={(e) => {
            if (!disconnecting) e.currentTarget.style.color = colors.caption;
          }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = `0 0 0 2px ${focusRing}`;
            e.currentTarget.style.borderRadius = "4px";
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <Unlink size={11} aria-hidden />
          {disconnecting ? "Disconnecting…" : "Disconnect"}
        </button>
      </div>
    </div>
  );
}
