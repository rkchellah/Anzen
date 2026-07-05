import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { ConnectionKey } from "@/lib/auth-connections";
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

import { getRedisClient } from "@/lib/kv-client";

function redisKey(userId: string): string {
  return `permissions:${userId}`;
}

function normalizePermissions(
  partial: Partial<UserPermissions> | null | undefined
): UserPermissions {
  const defaults = defaultUserPermissions();
  if (!partial) return defaults;

  const normalized = { ...defaults };
  for (const key of Object.keys(defaults) as ConnectionKey[]) {
    const mode = partial[key];
    if (mode && isProviderAccessMode(mode)) {
      normalized[key] = mode;
    }
  }
  return normalized;
}

async function readFileStore(): Promise<PermissionsFile> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as PermissionsFile;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return {};
    }
    console.error("[permissions-store] Failed to read file store:", error);
    return {};
  }
}

async function writeFileStore(data: PermissionsFile): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

export async function getUserPermissions(userId: string): Promise<UserPermissions> {
  const redis = await getRedisClient();
  if (redis) {
    const stored = await redis.get<Partial<UserPermissions>>(redisKey(userId));
    return normalizePermissions(stored ?? undefined);
  }

  const file = await readFileStore();
  return normalizePermissions(file[userId]);
}

export async function setProviderAccessMode(
  userId: string,
  provider: ConnectionKey,
  mode: ProviderAccessMode
): Promise<UserPermissions> {
  if (!isConnectionKey(provider) || !isProviderAccessMode(mode)) {
    throw new Error("Invalid provider or access mode");
  }

  const current = await getUserPermissions(userId);
  const updated: UserPermissions = { ...current, [provider]: mode };

  const redis = await getRedisClient();
  if (redis) {
    await redis.set(redisKey(userId), updated);
    return updated;
  }

  const file = await readFileStore();
  file[userId] = updated;
  await writeFileStore(file);
  return updated;
}
