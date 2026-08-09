import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile, rename } from "fs/promises";
import path from "path";
import { getRedisClient } from "@/lib/kv-client";
import { ToolUserError } from "@/lib/tool-errors";

export type AuditOutcome = "success" | "failure";

export type AuditEntry = {
  id: string;
  timestamp: number;
  userId: string;
  toolName: string;
  parameters: Record<string, unknown>;
  outcome: AuditOutcome;
  message: string;
};

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "audit.json");
const MAX_ENTRIES_PER_USER = 200;

type AuditFile = Record<string, AuditEntry[]>;

function redisKey(userId: string): string {
  return `audit:${userId}`;
}

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}

async function readFileStore(): Promise<AuditFile> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as AuditFile)
      : {};
  } catch (error) {
    if (isMissingFileError(error)) return {};
    console.error("[audit-log] Failed to read file store:", error);
    return {};
  }
}

/**
 * Write via a temp file + rename so a crash mid-write can't leave a truncated
 * `audit.json` that silently reads back as "no history".
 */
async function writeFileStore(data: AuditFile): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const temp = `${DATA_FILE}.${process.pid}.tmp`;
  await writeFile(temp, JSON.stringify(data, null, 2), "utf8");
  await rename(temp, DATA_FILE);
}

function isAuditEntry(value: unknown): value is AuditEntry {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as AuditEntry).id === "string" &&
    typeof (value as AuditEntry).timestamp === "number"
  );
}

function newestFirst(entries: AuditEntry[]): AuditEntry[] {
  return [...entries].sort((a, b) => b.timestamp - a.timestamp);
}

function isWrongTypeError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("WRONGTYPE");
}

/**
 * Entries were once stored as a single JSON array under this key. Convert any
 * such key to a list on first touch so the atomic list ops below work; the
 * history is small and capped, so a straight rewrite is safe.
 */
async function migrateLegacyKey(
  redis: NonNullable<Awaited<ReturnType<typeof getRedisClient>>>,
  key: string
): Promise<AuditEntry[]> {
  let legacy: AuditEntry[] | null = null;
  try {
    legacy = await redis.get<AuditEntry[]>(key);
  } catch {
    // Already a list, or unreadable — nothing to migrate.
    return [];
  }

  const entries = Array.isArray(legacy) ? legacy.filter(isAuditEntry) : [];
  await redis.del(key);
  if (entries.length > 0) {
    await redis.rpush(
      key,
      ...newestFirst(entries)
        .slice(0, MAX_ENTRIES_PER_USER)
        .map((entry) => JSON.stringify(entry))
    );
  }
  return entries;
}

export async function appendAuditEntry(entry: AuditEntry): Promise<void> {
  const redis = await getRedisClient();
  if (redis) {
    // lpush + ltrim are atomic server-side, so concurrent writes from parallel
    // tool calls can't clobber each other the way get-then-set would.
    const key = redisKey(entry.userId);
    try {
      await redis.lpush(key, JSON.stringify(entry));
    } catch (error) {
      if (!isWrongTypeError(error)) throw error;
      await migrateLegacyKey(redis, key);
      await redis.lpush(key, JSON.stringify(entry));
    }
    await redis.ltrim(key, 0, MAX_ENTRIES_PER_USER - 1);
    return;
  }

  const file = await readFileStore();
  const existing = file[entry.userId] ?? [];
  file[entry.userId] = newestFirst([entry, ...existing]).slice(
    0,
    MAX_ENTRIES_PER_USER
  );
  await writeFileStore(file);
}

export async function listAuditEntries(userId: string): Promise<AuditEntry[]> {
  const redis = await getRedisClient();
  if (redis) {
    const key = redisKey(userId);
    let raw: Array<AuditEntry | string>;
    try {
      raw = await redis.lrange<AuditEntry | string>(
        key,
        0,
        MAX_ENTRIES_PER_USER - 1
      );
    } catch (error) {
      if (!isWrongTypeError(error)) throw error;
      return newestFirst(await migrateLegacyKey(redis, key));
    }
    const entries = raw
      .map((item) => {
        if (typeof item !== "string") return item;
        try {
          return JSON.parse(item) as unknown;
        } catch {
          return null;
        }
      })
      .filter(isAuditEntry);
    return newestFirst(entries);
  }

  const file = await readFileStore();
  return newestFirst((file[userId] ?? []).filter(isAuditEntry));
}

/**
 * Audit logging must never change the outcome of the write it records: a
 * storage hiccup that turned a successful `sendEmail` into an error would make
 * Anzen tell the user their email failed after it was already sent.
 */
async function recordAuditEntry(entry: AuditEntry): Promise<void> {
  try {
    await appendAuditEntry(entry);
  } catch (error) {
    console.error("[audit-log] Failed to record entry:", entry.toolName, error);
  }
}

/** Wrap a write-tool execute fn with persistent audit logging (Phase 6). */
export async function runAuditedWrite<T>(
  userId: string,
  toolName: string,
  parameters: Record<string, unknown>,
  fn: () => Promise<T>
): Promise<T> {
  const timestamp = Date.now();
  try {
    const result = await fn();
    await recordAuditEntry({
      id: randomUUID(),
      timestamp,
      userId,
      toolName,
      parameters,
      outcome: "success",
      message:
        typeof result === "object" &&
        result !== null &&
        "message" in result &&
        typeof (result as { message: unknown }).message === "string"
          ? (result as { message: string }).message
          : `${toolName} completed successfully`,
    });
    return result;
  } catch (error) {
    const message =
      error instanceof ToolUserError
        ? error.userMessage
        : error instanceof Error
          ? error.message
          : "Write action failed";
    await recordAuditEntry({
      id: randomUUID(),
      timestamp,
      userId,
      toolName,
      parameters,
      outcome: "failure",
      message,
    });
    throw error;
  }
}
