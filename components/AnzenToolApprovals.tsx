"use client";

import type { ReactNode } from "react";
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
  const blocks: ReactNode[] = [];

  for (const m of messages) {
    if (m.role === "user") continue;
    for (const part of getToolParts(m)) {
      const toolName = getToolNameFromPart(part);

      if (isToolErrorPart(part)) {
        const reconnectKey = reconnectKeyForToolPart(part);
        blocks.push(
          <div
            key={part.toolCallId ?? `${toolName}-error`}
            className="anzen-tool-card anzen-card border-[#f87171]/35 p-5"
          >
            <p className="anzen-eyebrow text-[#f87171] mb-2">
              Couldn&apos;t complete action
            </p>
            <p className="mb-4 text-[15px] leading-[1.6] text-foreground">{part.errorText}</p>
            <div className="flex flex-wrap gap-2">
              {reconnectKey && (
                <a
                  href={buildConnectUrl(reconnectKey, "/dashboard")}
                  className="anzen-btn anzen-btn-primary"
                >
                  Reconnect {CONNECTIONS[reconnectKey].label}
                </a>
              )}
              <button
                type="button"
                onClick={onOpenConnections}
                className="anzen-btn anzen-btn-secondary"
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
              className="anzen-tool-card anzen-card border-[#f87171]/35 p-5"
            >
              <p className="anzen-eyebrow text-[#f87171] mb-2">
                Write action blocked
              </p>
              <p className="mb-2 text-[15px] leading-[1.6] text-foreground">{summary}</p>
              <p className="mb-4 text-[14px] leading-[1.55] text-muted-foreground">
                {CONNECTIONS[writeKey].label} is set to read-only. Switch to Read &amp; write in
                Connections to allow this.
              </p>
              <button
                type="button"
                onClick={onOpenConnections}
                className="anzen-btn anzen-btn-primary"
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
            className="anzen-tool-card anzen-card border-primary/25 p-5"
          >
            <p className="anzen-eyebrow text-accent-foreground mb-2">
              Confirm action
            </p>
            <p className="mb-4 text-[15px] leading-[1.6] text-foreground">{summary}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onApprove(approvalId, true)}
                className="anzen-btn anzen-btn-primary"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => onApprove(approvalId, false, "User cancelled")}
                className="anzen-btn anzen-btn-secondary"
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
          <div
            key={part.toolCallId ?? part.approval.id}
            className="anzen-tool-card text-[13.5px] text-muted-foreground"
          >
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
            className="anzen-tool-card anzen-card border-[#f87171]/35 p-5"
          >
            <p className="anzen-eyebrow text-[#f87171] mb-2">
              Action blocked
            </p>
            <p className="mb-1.5 text-[15px] leading-[1.6] text-foreground">
              {summary}
            </p>
            <p className="text-[14px] leading-[1.55] text-muted-foreground">
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
