import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import { getRedisClient } from "@/lib/kv-client";
import { emptyProfile, normalizeProfile, type UserProfile } from "@/lib/profile";

/**
 * Per-user profile persistence. Same shape as permissions-store: Redis when a
 * KV is configured, a JSON file under `.data` otherwise, so local development
 * needs no services.
 */

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "profiles.json");

type ProfileFile = Record<string, UserProfile>;

function redisKey(userId: string): string {
  return `profile:${userId}`;
}

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}

async function readFileStore(): Promise<ProfileFile> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as ProfileFile)
      : {};
  } catch (error) {
    if (isMissingFileError(error)) return {};
    console.error("[profile-store] Failed to read file store:", error);
    return {};
  }
}

/** Temp file + rename, so an interrupted write can't truncate saved profiles. */
async function writeFileStore(data: ProfileFile): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const temp = `${DATA_FILE}.${process.pid}.tmp`;
  await writeFile(temp, JSON.stringify(data, null, 2), "utf8");
  await rename(temp, DATA_FILE);
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  if (!userId) return emptyProfile();

  const redis = await getRedisClient();
  if (redis) {
    try {
      const stored = await redis.get<UserProfile>(redisKey(userId));
      return normalizeProfile(stored ?? undefined);
    } catch (error) {
      // A name lookup must never fail the chat request that wanted it.
      console.error("[profile-store] Redis read failed:", error);
      return emptyProfile();
    }
  }

  const file = await readFileStore();
  return normalizeProfile(file[userId]);
}

export async function setUserProfile(
  userId: string,
  profile: UserProfile
): Promise<UserProfile> {
  if (!userId) throw new Error("A user id is required to save a profile");

  const normalized = normalizeProfile(profile);

  const redis = await getRedisClient();
  if (redis) {
    // Surfaces as a 500 so the dialog can keep the user's typing and retry.
    await redis.set(redisKey(userId), normalized);
    return normalized;
  }

  const file = await readFileStore();
  file[userId] = normalized;
  await writeFileStore(file);
  return normalized;
}
