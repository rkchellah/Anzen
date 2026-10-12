"use client";

import type { ReactNode } from "react";
import type { UIMessage } from "ai";
import { AlertTriangle, Ban, ShieldQuestion } from "lucide-react";
import {
  describeWriteAction,
  describeWriteArguments,
  getToolNameFromPart,
  getToolParts,
  isToolErrorPart,
  isWriteToolName,
  reconnectKeyForToolPart,
} from "@/agent/action-descriptions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { buildConnectUrl, CONNECTIONS } from "@/lib/auth-connections";
import { connectionKeyForToolName } from "@/lib/tool-errors";
import type { ProviderAccessMode } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type ConnectionKey = "github" | "gmail" | "slack";

/** Values longer than this get a character count beside their label. */
const LONG_VALUE_CHARS = 200;

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
          <Card
            key={part.toolCallId ?? `${toolName}-error`}
            className="w-full overflow-hidden rounded-2xl border-destructive/20 bg-card shadow-[var(--anzen-elev-2)]"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-destructive flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="size-4" />
                Action Failed
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-destructive/80">{part.errorText}</CardContent>
            <CardFooter className="flex flex-wrap gap-2 pt-2">
              {reconnectKey && (
                <Button 
                  render={<a href={buildConnectUrl(reconnectKey, "/dashboard")} />}
                  className="h-8 rounded-lg bg-destructive text-xs font-medium text-white hover:opacity-90"
                >
                  Reconnect {CONNECTIONS[reconnectKey].label}
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={onOpenConnections}
                className="h-8 rounded-lg border-destructive/20 bg-transparent text-xs font-medium text-destructive hover:bg-destructive/10"
              >
                Open Connections
              </Button>
            </CardFooter>
          </Card>
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
            <Card
              key={part.toolCallId ?? approvalId}
              className="w-full overflow-hidden rounded-2xl border-destructive/20 bg-card shadow-[var(--anzen-elev-2)]"
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-destructive flex items-center gap-2 text-sm font-semibold">
                  <Ban className="size-4" />
                  Action Blocked
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm leading-relaxed">
                <p className="font-medium">{summary}</p>
                <p className="text-destructive/60 text-xs">
                  {CONNECTIONS[writeKey].label} is set to read-only. Switch to Read &amp; write in
                  Connections to allow this.
                </p>
              </CardContent>
              <CardFooter className="pt-2">
                <Button 
                  onClick={onOpenConnections}
                  className="h-8 rounded-lg bg-destructive text-xs font-medium text-white hover:opacity-90"
                >
                  Open Connections
                </Button>
              </CardFooter>
            </Card>
          );
          continue;
        }

        blocks.push(
          <Card
            key={part.toolCallId ?? approvalId}
            className="w-full overflow-hidden rounded-2xl border-primary/20 bg-card shadow-[var(--anzen-elev-2)]"
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-primary">
                <ShieldQuestion className="size-4" />
                Confirm Action
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed">
              <p className="font-medium">{summary}</p>
              {describeWriteArguments(toolName, part.input).map(({ label, value }) => (
                <div key={label} className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {label}
                    {value.length > LONG_VALUE_CHARS && ` (${value.length.toLocaleString()} characters)`}
                  </p>
                  <pre className="whitespace-pre-wrap break-words max-h-64 overflow-auto">{value}</pre>
                </div>
              ))}
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2 pt-2">
              <Button 
                onClick={() => onApprove(approvalId, true)}
                className="h-8 rounded-lg bg-primary text-xs font-medium text-primary-foreground hover:opacity-90"
              >
                Confirm
              </Button>
              <Button
                variant="outline"
                onClick={() => onApprove(approvalId, false, "User cancelled")}
                className="h-8 rounded-lg border-primary/20 bg-transparent text-xs font-medium text-primary hover:bg-primary/10"
              >
                Cancel
              </Button>
            </CardFooter>
          </Card>
        );
        continue;
      }

      if (part.state === "approval-responded" && part.approval) {
        blocks.push(
          <div
            key={part.toolCallId ?? part.approval.id}
            className="flex w-full items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground"
          >
            <div className={cn("size-1.5 rounded-full", part.approval.approved ? "bg-primary" : "bg-destructive")} />
            {part.approval.approved ? "Running Action…" : "Action Cancelled"}
          </div>
        );
        continue;
      }

      if (part.state === "output-denied") {
        const summary = describeWriteAction(toolName, part.input);
        const reason = typeof part.approval?.reason === "string" ? part.approval.reason : null;
        blocks.push(
          <Card
            key={part.toolCallId ?? `${toolName}-denied`}
            className="w-full overflow-hidden rounded-2xl border-destructive/20 bg-card shadow-[var(--anzen-elev-2)]"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-destructive flex items-center gap-2 text-sm font-semibold">
                <Ban className="size-4" />
                Action Blocked
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm leading-relaxed">
              <p className="font-medium">{summary}</p>
              <p className="text-destructive/60 text-xs italic">
                {reason ?? "Action was not performed."}
              </p>
            </CardContent>
          </Card>
        );
      }
    }
  }

  if (blocks.length === 0) return null;
  return <div className="flex flex-col gap-3 pb-4">{blocks}</div>;
}
