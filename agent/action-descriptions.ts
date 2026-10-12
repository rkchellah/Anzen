import { connectionKeyForToolName } from "@/lib/tool-errors";
import type { ConnectionKey } from "@/lib/auth-connections";

/** Write tools that require user confirmation before execution (Phase 1). */
export const WRITE_TOOL_NAMES = [
  "closeIssue",
  "commentOnIssue",
  "sendEmail",
  "postMessage",
] as const;

export type WriteToolName = (typeof WRITE_TOOL_NAMES)[number];

export function isWriteToolName(name: string): name is WriteToolName {
  return (WRITE_TOOL_NAMES as readonly string[]).includes(name);
}

function truncate(text: string, max = 120): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
}

/** Plain-language summary shown in the confirmation gate. */
export function describeWriteAction(toolName: string, input: unknown): string {
  if (!input || typeof input !== "object") {
    return `Perform ${toolName}`;
  }

  const args = input as Record<string, unknown>;

  switch (toolName) {
    case "closeIssue": {
      const owner = String(args.owner ?? "?");
      const repo = String(args.repo ?? "?");
      const issueNumber = args.issueNumber ?? "?";
      return `Close GitHub issue #${issueNumber} in ${owner}/${repo}`;
    }
    case "commentOnIssue": {
      const owner = String(args.owner ?? "?");
      const repo = String(args.repo ?? "?");
      const issueNumber = args.issueNumber ?? "?";
      const comment = typeof args.comment === "string" ? args.comment : "";
      return `Comment on GitHub issue #${issueNumber} in ${owner}/${repo}: "${truncate(comment)}"`;
    }
    case "sendEmail": {
      const to = String(args.to ?? "?");
      const subject = typeof args.subject === "string" ? args.subject : "";
      return `Send email to ${to} with subject: "${truncate(subject, 80)}"`;
    }
    case "postMessage": {
      const channel = String(args.channel ?? "?");
      const message = typeof args.message === "string" ? args.message : "";
      return `Post to Slack channel ${channel}: "${truncate(message)}"`;
    }
    default:
      return `Perform ${toolName}`;
  }
}

export type WriteArgument = { label: string; value: string };

function argText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === undefined || value === null) return "";
  return String(value);
}

/**
 * Every argument the write will send, untruncated, so the confirmation gate
 * shows exactly what runs — the one-line summary alone hides bodies.
 */
export function describeWriteArguments(toolName: string, input: unknown): WriteArgument[] {
  if (!input || typeof input !== "object") return [];

  const args = input as Record<string, unknown>;
  const pick = (fields: Array<[label: string, key: string]>) =>
    fields.map(([label, key]) => ({ label, value: argText(args[key]) }));

  switch (toolName) {
    case "sendEmail":
      return pick([
        ["To", "to"],
        ["Subject", "subject"],
        ["Body", "body"],
      ]);
    case "commentOnIssue":
      return pick([
        ["Owner", "owner"],
        ["Repository", "repo"],
        ["Issue", "issueNumber"],
        ["Comment", "comment"],
      ]);
    case "postMessage":
      return pick([
        ["Channel", "channel"],
        ["Message", "message"],
      ]);
    case "closeIssue":
      return pick([
        ["Owner", "owner"],
        ["Repository", "repo"],
        ["Issue", "issueNumber"],
      ]);
    default:
      return [];
  }
}

export type ToolApprovalPart = {
  type: string;
  state?: string;
  toolCallId?: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
  approval?: {
    id: string;
    approved?: boolean;
    reason?: string;
    isAutomatic?: boolean;
  };
};

export function isToolErrorPart(
  part: ToolApprovalPart
): part is ToolApprovalPart & { state: "output-error"; errorText: string } {
  return part.state === "output-error" && typeof part.errorText === "string";
}

export function reconnectKeyForToolPart(part: ToolApprovalPart): ConnectionKey | null {
  return connectionKeyForToolName(getToolNameFromPart(part));
}

export function getToolParts(message: { parts?: unknown[] }): ToolApprovalPart[] {
  if (!Array.isArray(message.parts)) return [];

  return message.parts.filter((part): part is ToolApprovalPart => {
    if (typeof part !== "object" || part === null || !("type" in part)) {
      return false;
    }
    const type = (part as { type: unknown }).type;
    return typeof type === "string" && type.startsWith("tool-");
  });
}

export function getToolNameFromPart(part: ToolApprovalPart): string {
  return part.type.replace(/^tool-/, "");
}
