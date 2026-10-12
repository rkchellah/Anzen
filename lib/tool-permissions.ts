import type { ConnectionKey } from "@/lib/auth-connections";
import { providerLabelForKey } from "@/lib/permissions";
import { getUserPermissions } from "@/lib/permissions-store";
import { ToolUserError } from "@/lib/tool-errors";

/**
 * Block write tools unless the user explicitly set the provider to read & write
 * (Phase 4). Allow-list: any other value — "read", missing, or garbage — denies.
 */
export async function assertWriteAllowed(
  userId: string,
  connectionKey: ConnectionKey
): Promise<void> {
  const permissions = await getUserPermissions(userId);
  if (permissions?.[connectionKey] === "read_write") return;

  const label = providerLabelForKey(connectionKey);
  throw new ToolUserError({
    category: "permission_denied",
    connectionKey,
    userMessage: `${label} is set to read-only in Connections. Switch it to Read & write there before Anzen can make changes.`,
  });
}
