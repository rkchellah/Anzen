import type { ConnectionKey } from "@/lib/auth-connections";
import { providerLabelForKey } from "@/lib/permissions";
import { getUserPermissions } from "@/lib/permissions-store";
import { ToolUserError } from "@/lib/tool-errors";

/** Block write tools when the user set a provider to read-only (Phase 4). */
export async function assertWriteAllowed(
  userId: string,
  connectionKey: ConnectionKey
): Promise<void> {
  const permissions = await getUserPermissions(userId);
  if (permissions[connectionKey] !== "read") return;

  const label = providerLabelForKey(connectionKey);
  throw new ToolUserError({
    category: "permission_denied",
    connectionKey,
    userMessage: `${label} is set to read-only in Connections. Switch it to Read & write there before Anzen can make changes.`,
  });
}
