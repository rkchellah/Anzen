import {
  describeWriteAction,
  getToolNameFromPart,
  getToolParts,
  isWriteToolName,
  type ToolApprovalPart,
} from "@/agent/action-descriptions";

export type PendingApproval = {
  approvalId: string;
  toolCallId?: string;
  toolName: string;
  summary: string;
  input: unknown;
};

export function findPendingManualApprovals(
  messages: Array<{ parts?: unknown[] }>
): PendingApproval[] {
  const pending: PendingApproval[] = [];

  for (const message of messages) {
    for (const part of getToolParts(message)) {
      if (!isPendingManualApproval(part)) continue;
      const toolName = getToolNameFromPart(part);
      if (!isWriteToolName(toolName)) continue;

      pending.push({
        approvalId: part.approval!.id,
        toolCallId: part.toolCallId,
        toolName,
        summary: describeWriteAction(toolName, part.input),
        input: part.input,
      });
    }
  }

  return pending;
}

export function hasPendingManualApprovals(messages: Array<{ parts?: unknown[] }>): boolean {
  return findPendingManualApprovals(messages).length > 0;
}

function isPendingManualApproval(
  part: ToolApprovalPart
): part is ToolApprovalPart & { approval: { id: string }; state: "approval-requested" } {
  return (
    part.state === "approval-requested" &&
    typeof part.approval?.id === "string" &&
    part.approval.isAutomatic !== true
  );
}
