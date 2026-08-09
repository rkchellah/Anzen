import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import type { ConnectionKey } from "@/lib/auth-connections";
import { getRedisClient } from "@/lib/kv-client";
import {
  defaultUserPermissions,
  isConnectionKey,
  isProviderAccessMode,
  type ProviderAccessMode,
  type UserPermissions,
} from "@/lib/permissions";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "permissions.json");

type PermissionsFile = Record<string, Partial<UserPermissions>>;

function redisKey(userId: string): string {
  return `permissions:${userId}`;
}

/**
 * Coerce whatever came out of storage into a complete, valid permission set.
 * Unknown keys and invalid modes fall back to the default rather than throwing —
 * a corrupt record must not lock a user out of their own settings page.
 */
function normalizePermissions(
  partial: Partial<UserPermissions> | null | undefined
): UserPermissions {
  const defaults = defaultUserPermissions();
  if (!partial || typeof partial !== "object") return defaults;

  const normalized = { ...defaults };
  for (const key of Object.keys(defaults) as ConnectionKey[]) {
    const mode = partial[key];
    if (typeof mode === "string" && isProviderAccessMode(mode)) {
      normalized[key] = mode;
    }
  }
  return normalized;
}

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}

async function readFileStore(): Promise<PermissionsFile> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as PermissionsFile)
      : {};
  } catch (error) {
    if (isMissingFileError(error)) return {};
    console.error("[permissions-store] Failed to read file store:", error);
    return {};
  }
}

/** Temp file + rename, so an interrupted write can't truncate saved settings. */
async function writeFileStore(data: PermissionsFile): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const temp = `${DATA_FILE}.${process.pid}.tmp`;
  await writeFile(temp, JSON.stringify(data, null, 2), "utf8");
  await rename(temp, DATA_FILE);
}

export async function getUserPermissions(
  userId: string
): Promise<UserPermissions> {
  if (!userId) return defaultUserPermissions();

  const redis = await getRedisClient();
  if (redis) {
    try {
      const stored = await redis.get<Partial<UserPermissions>>(redisKey(userId));
      return normalizePermissions(stored ?? undefined);
    } catch (error) {
      // Read-only settings lookup: degrade to defaults rather than failing the
      // tool call that asked for them.
      console.error("[permissions-store] Redis read failed:", error);
      return defaultUserPermissions();
    }
  }

  const file = await readFileStore();
  return normalizePermissions(file[userId]);
}

export async function setProviderAccessMode(
  userId: string,
  provider: ConnectionKey,
  mode: ProviderAccessMode
): Promise<UserPermissions> {
  if (!userId) throw new Error("A user id is required to save permissions");
  if (!isConnectionKey(provider) || !isProviderAccessMode(mode)) {
    throw new Error("Invalid provider or access mode");
  }

  const current = await getUserPermissions(userId);
  const updated: UserPermissions = { ...current, [provider]: mode };

  const redis = await getRedisClient();
  if (redis) {
    // Writes propagate to tool checks, so a failure here must surface — the
    // caller turns it into a 500 and the UI reverts the toggle.
    await redis.set(redisKey(userId), updated);
    return updated;
  }

  const file = await readFileStore();
  file[userId] = updated;
  await writeFileStore(file);
  return updated;
}
