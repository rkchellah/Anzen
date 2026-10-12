import { Ratelimit } from "@upstash/ratelimit";
import { getRedisClient, redisConfigured } from "@/lib/kv-client";

/** Per-user chat requests per minute (Phase 5). */
export const CHAT_RATE_LIMIT_PER_MINUTE = 20;

type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

let chatRateLimiter: Ratelimit | null = null;
let warnedNoRedisInProduction = false;

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

async function getChatRateLimiter(): Promise<Ratelimit | null> {
  if (!redisConfigured()) return null;
  if (chatRateLimiter) return chatRateLimiter;

  const redis = await getRedisClient();
  if (!redis) return null;

  chatRateLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(CHAT_RATE_LIMIT_PER_MINUTE, "1 m"),
    prefix: "anzen:chat",
  });
  return chatRateLimiter;
}

/**
 * Fails closed in production: without a working limiter there is nothing
 * capping provider calls or model spend, so reject rather than allow.
 * Development stays permissive so the app runs without Upstash.
 */
export async function checkChatRateLimit(userId: string): Promise<RateLimitResult> {
  let limiter;
  try {
    limiter = await getChatRateLimiter();
  } catch (error) {
    console.error("[rate-limit] Rate limiter setup failed:", error);
    return isProduction()
      ? { allowed: false, retryAfterSeconds: 5 }
      : { allowed: true };
  }
  if (!limiter) {
    if (!isProduction()) return { allowed: true };
    if (!warnedNoRedisInProduction) {
      warnedNoRedisInProduction = true;
      console.error(
        "[rate-limit] Redis is not configured in production; rejecting chat requests until KV_REST_API_URL and KV_REST_API_TOKEN are set."
      );
    }
    return { allowed: false, retryAfterSeconds: 5 };
  }

  let result;
  try {
    result = await limiter.limit(userId);
  } catch (error) {
    console.error("[rate-limit] Rate limit check failed:", error);
    return isProduction()
      ? { allowed: false, retryAfterSeconds: 5 }
      : { allowed: true };
  }
  if (result.success) return { allowed: true };

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((result.reset - Date.now()) / 1000)
  );
  return { allowed: false, retryAfterSeconds };
}
