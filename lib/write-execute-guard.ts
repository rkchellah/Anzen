import type { ModelMessage } from "ai";
import {
  checkWriteContradiction,
  getLastUserMessageFromModelMessages,
} from "@/lib/tool-approval-policy";
import { connectionKeyForToolName, ToolUserError } from "@/lib/tool-errors";

/** Last-line defense before a write tool hits a provider API. */
export function assertWriteMatchesLatestUserIntent(
  toolName: string,
  input: Record<string, unknown>,
  messages: ModelMessage[]
): void {
  const lastUser = getLastUserMessageFromModelMessages(messages);
  const contradiction = checkWriteContradiction(lastUser, toolName, input);
  if (!contradiction) return;

  throw new ToolUserError({
    category: "permission_denied",
    connectionKey: connectionKeyForToolName(toolName),
    userMessage: contradiction,
  });
}
