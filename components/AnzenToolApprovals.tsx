"use client";

import type { ReactNode } from "react";
import type { UIMessage } from "ai";
import { AlertTriangle, Ban, ShieldQuestion } from "lucide-react";
import {
  describeWriteAction,
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
          <Card
            key={part.toolCallId ?? `${toolName}-error`}
            className="mx-auto w-full max-w-lg overflow-hidden rounded-2xl border-destructive/20 bg-destructive/5 shadow-lg"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-destructive flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                <AlertTriangle className="size-4" />
                Action Failed
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-destructive/80">{part.errorText}</CardContent>
            <CardFooter className="flex flex-wrap gap-2 pt-2">
              {reconnectKey && (
                <Button 
                  render={<a href={buildConnectUrl(reconnectKey, "/dashboard")} />}
                  className="h-8 rounded-full bg-destructive text-[11px] font-bold text-white hover:opacity-90"
                >
                  Reconnect {CONNECTIONS[reconnectKey].label}
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={onOpenConnections}
                className="h-8 rounded-full border-destructive/20 bg-transparent text-[11px] font-bold text-destructive hover:bg-destructive/10"
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
              className="mx-auto w-full max-w-lg overflow-hidden rounded-2xl border-destructive/20 bg-destructive/5 shadow-lg"
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-destructive flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
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
                  className="h-8 rounded-full bg-destructive text-[11px] font-bold text-white hover:opacity-90"
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
            className="mx-auto w-full max-w-lg overflow-hidden rounded-2xl border-primary/20 bg-primary/5 shadow-lg"
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-wider">
                <ShieldQuestion className="size-4" />
                Confirm Action
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm font-medium leading-relaxed">{summary}</CardContent>
            <CardFooter className="flex flex-wrap gap-2 pt-2">
              <Button 
                onClick={() => onApprove(approvalId, true)}
                className="h-8 rounded-full bg-primary text-[11px] font-bold text-black hover:opacity-90"
              >
                Confirm
              </Button>
              <Button
                variant="outline"
                onClick={() => onApprove(approvalId, false, "User cancelled")}
                className="h-8 rounded-full border-primary/20 bg-transparent text-[11px] font-bold text-primary hover:bg-primary/10"
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
            className="mx-auto flex w-full max-w-lg items-center gap-2 rounded-full border border-border/10 bg-[#121212] px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60"
          >
            <div className={cn("size-1.5 rounded-full", part.approval.approved ? "bg-primary animate-pulse" : "bg-destructive")} />
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
            className="mx-auto w-full max-w-lg overflow-hidden rounded-2xl border-destructive/20 bg-destructive/5 shadow-lg"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-destructive flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
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
