import { Ratelimit } from "@upstash/ratelimit";
import { getRedisClient, redisConfigured } from "@/lib/kv-client";

/** Per-user chat requests per minute (Phase 5). */
export const CHAT_RATE_LIMIT_PER_MINUTE = 20;

let chatRateLimiter: Ratelimit | null = null;

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

export async function checkChatRateLimit(
  userId: string
): Promise<{ allowed: true } | { allowed: false; retryAfterSeconds: number }> {
  const limiter = await getChatRateLimiter();
  if (!limiter) return { allowed: true };

  const result = await limiter.limit(userId);
  if (result.success) return { allowed: true };

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((result.reset - Date.now()) / 1000)
  );
  return { allowed: false, retryAfterSeconds };
}
