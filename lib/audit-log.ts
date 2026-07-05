import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
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

async function readFileStore(): Promise<AuditFile> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as AuditFile;
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
    console.error("[audit-log] Failed to read file store:", error);
    return {};
  }
}

async function writeFileStore(data: AuditFile): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

function trimEntries(entries: AuditEntry[]): AuditEntry[] {
  return entries
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, MAX_ENTRIES_PER_USER);
}

export async function appendAuditEntry(entry: AuditEntry): Promise<void> {
  const redis = await getRedisClient();
  if (redis) {
    const existing =
      (await redis.get<AuditEntry[]>(redisKey(entry.userId))) ?? [];
    const updated = trimEntries([entry, ...existing]);
    await redis.set(redisKey(entry.userId), updated);
    return;
  }

  const file = await readFileStore();
  const existing = file[entry.userId] ?? [];
  file[entry.userId] = trimEntries([entry, ...existing]);
  await writeFileStore(file);
}

export async function listAuditEntries(userId: string): Promise<AuditEntry[]> {
  const redis = await getRedisClient();
  if (redis) {
    const entries = (await redis.get<AuditEntry[]>(redisKey(userId))) ?? [];
    return [...entries].sort((a, b) => b.timestamp - a.timestamp);
  }

  const file = await readFileStore();
  return [...(file[userId] ?? [])].sort((a, b) => b.timestamp - a.timestamp);
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
    await appendAuditEntry({
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
    await appendAuditEntry({
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
