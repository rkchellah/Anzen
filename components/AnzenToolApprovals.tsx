"use client";

import type { UIMessage } from "ai";
import {
  describeWriteAction,
  getToolNameFromPart,
  getToolParts,
  isToolErrorPart,
  isWriteToolName,
  reconnectKeyForToolPart,
} from "@/agent/action-descriptions";
import { buildConnectUrl, CONNECTIONS } from "@/lib/auth-connections";
import { connectionKeyForToolName } from "@/lib/tool-errors";
import type { ProviderAccessMode } from "@/lib/permissions";
import { useAnzenTheme } from "@/components/AnzenThemeProvider";

type ConnectionKey = "github" | "gmail" | "slack";

type AnzenToolApprovalsProps = {
  messages: UIMessage[];
  accessModes: Record<ConnectionKey, ProviderAccessMode>;
  onOpenConnections: () => void;
  onApprove: (id: string, approved: boolean, reason?: string) => void;
};

export function AnzenToolApprovals({
  messages,
  accessModes,
  onOpenConnections,
  onApprove,
}: AnzenToolApprovalsProps) {
  const { theme } = useAnzenTheme();
  const card = {
    backgroundColor: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: 14,
  } as const;

  const blocks: React.ReactNode[] = [];

  for (const m of messages) {
    if (m.role === "user") continue;
    for (const part of getToolParts(m)) {
      const toolName = getToolNameFromPart(part);

      if (isToolErrorPart(part)) {
        const reconnectKey = reconnectKeyForToolPart(part);
        blocks.push(
          <div
            key={part.toolCallId ?? `${toolName}-error`}
            className="anzen-tool-card"
            style={{ ...card, padding: "16px 18px", borderColor: "rgba(248,113,113,0.35)" }}
          >
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#f87171", margin: "0 0 8px" }}>
              Couldn&apos;t complete action
            </p>
            <p style={{ fontSize: 14, color: theme.text, margin: "0 0 14px", lineHeight: 1.6 }}>{part.errorText}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {reconnectKey && (
                <a
                  href={buildConnectUrl(reconnectKey, "/dashboard")}
                  style={{ padding: "8px 16px", fontSize: 13, fontWeight: 600, borderRadius: 8, background: theme.accent, color: "#000", textDecoration: "none", fontFamily: "inherit" }}
                >
                  Reconnect {CONNECTIONS[reconnectKey].label}
                </a>
              )}
              <button
                type="button"
                onClick={onOpenConnections}
                style={{ padding: "8px 16px", fontSize: 13, fontWeight: 500, borderRadius: 8, background: "transparent", color: theme.muted, border: `1px solid ${theme.border}`, cursor: "pointer", fontFamily: "inherit" }}
              >
                Open Connections
              </button>
            </div>
          </div>
        );
        continue;
      }

      if (!isWriteToolName(toolName)) continue;

      if (part.state === "approval-requested" && part.approval?.id) {
        const summary = describeWriteAction(toolName, part.input);
        const writeKey = connectionKeyForToolName(toolName);
        const approvalId = part.approval.id;

        if (writeKey && accessModes[writeKey] === "read") {
          blocks.push(
            <div
              key={part.toolCallId ?? approvalId}
              className="anzen-tool-card"
              style={{ ...card, padding: "16px 18px", borderColor: "rgba(248,113,113,0.35)" }}
            >
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#f87171", margin: "0 0 8px" }}>
                Write action blocked
              </p>
              <p style={{ fontSize: 14, color: theme.text, margin: "0 0 8px", lineHeight: 1.6 }}>{summary}</p>
              <p style={{ fontSize: 13, color: theme.muted, margin: "0 0 14px", lineHeight: 1.5 }}>
                {CONNECTIONS[writeKey].label} is set to read-only. Switch to Read &amp; write in Connections to allow this.
              </p>
              <button
                type="button"
                onClick={onOpenConnections}
                style={{ padding: "8px 16px", fontSize: 13, fontWeight: 600, borderRadius: 8, background: theme.accent, color: "#000", border: "none", cursor: "pointer", fontFamily: "inherit" }}
              >
                Open Connections
              </button>
            </div>
          );
          continue;
        }

        blocks.push(
          <div
            key={part.toolCallId ?? approvalId}
            className="anzen-tool-card"
            style={{ ...card, padding: "16px 18px", borderColor: `${theme.accent}35` }}
          >
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: theme.accentText, margin: "0 0 8px" }}>
              Confirm action
            </p>
            <p style={{ fontSize: 14, color: theme.text, margin: "0 0 14px", lineHeight: 1.6 }}>{summary}</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => onApprove(approvalId, true)}
                style={{ padding: "8px 16px", fontSize: 13, fontWeight: 600, borderRadius: 8, background: theme.accent, color: "#000", border: "none", cursor: "pointer", fontFamily: "inherit" }}
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => onApprove(approvalId, false, "User cancelled")}
                style={{ padding: "8px 16px", fontSize: 13, fontWeight: 500, borderRadius: 8, background: "transparent", color: theme.muted, border: `1px solid ${theme.border}`, cursor: "pointer", fontFamily: "inherit" }}
              >
                Cancel
              </button>
            </div>
          </div>
        );
        continue;
      }

      if (part.state === "approval-responded" && part.approval) {
        blocks.push(
          <div key={part.toolCallId ?? part.approval.id} className="anzen-tool-card" style={{ fontSize: 12, color: theme.muted }}>
            {part.approval.approved ? "Confirmed — running action…" : "Action cancelled."}
          </div>
        );
        continue;
      }

      if (part.state === "output-denied") {
        const summary = describeWriteAction(toolName, part.input);
        const reason = typeof part.approval?.reason === "string" ? part.approval.reason : null;
        blocks.push(
          <div
            key={part.toolCallId ?? `${toolName}-denied`}
            className="anzen-tool-card"
            style={{ ...card, padding: "14px 16px", borderColor: "rgba(248,113,113,0.35)" }}
          >
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#f87171", margin: "0 0 6px" }}>
              Action blocked
            </p>
            <p style={{ fontSize: 13, color: theme.text, margin: "0 0 6px", lineHeight: 1.55 }}>{summary}</p>
            <p style={{ fontSize: 12, color: theme.muted, margin: 0, lineHeight: 1.5 }}>
              {reason ?? "Action was not performed (cancelled or denied)."}
            </p>
          </div>
        );
      }
    }
  }

  if (blocks.length === 0) return null;
  return <div className="flex flex-col gap-3 pb-4">{blocks}</div>;
}
