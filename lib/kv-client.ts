import type { Redis } from "@upstash/redis";

export function redisConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

/**
 * Memoized so every store doesn't build a fresh client (and a fresh connection
 * pool) per call. Returns null when Redis isn't configured — callers fall back
 * to the local file store.
 */
let clientPromise: Promise<Redis> | null = null;

export async function getRedisClient(): Promise<Redis | null> {
  if (!redisConfigured()) return null;

  if (!clientPromise) {
    clientPromise = import("@upstash/redis").then(
      ({ Redis: RedisCtor }) =>
        new RedisCtor({
          url: process.env.KV_REST_API_URL!,
          token: process.env.KV_REST_API_TOKEN!,
        })
    );
  }

  try {
    return await clientPromise;
  } catch (error) {
    // Don't cache a failed import — let the next call retry.
    clientPromise = null;
    console.error("[kv-client] Failed to initialise Redis client:", error);
    return null;
  }
}
