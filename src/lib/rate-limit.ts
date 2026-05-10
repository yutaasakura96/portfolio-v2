import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Cache `Ratelimit` instances per (limit, windowMs) tuple. The class is
 * intended to be constructed once and reused; constructing one per call
 * defeats its internal caching of the Lua script + Redis client.
 */
const limiterCache = new Map<string, Ratelimit>();

function getLimiter(limit: number, windowMs: number): Ratelimit {
  const cacheKey = `${limit}:${windowMs}`;
  const cached = limiterCache.get(cacheKey);
  if (cached) return cached;

  // Read env vars lazily — module-top reads break test/build environments
  // where these are not set.
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set to use rateLimit()"
    );
  }

  const windowSeconds = Math.max(1, Math.floor(windowMs / 1000));
  const limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    analytics: false,
    prefix: "rl",
  });

  limiterCache.set(cacheKey, limiter);
  return limiter;
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ success: boolean; remaining: number; resetTime: number }> {
  try {
    const limiter = getLimiter(limit, windowMs);
    const result = await limiter.limit(key);
    return {
      success: result.success,
      remaining: result.remaining,
      resetTime: result.reset,
    };
  } catch (error) {
    // fail-open: log and allow on Upstash error
    console.error("rateLimit: Upstash error, failing open", error);
    return { success: true, remaining: 0, resetTime: Date.now() + windowMs };
  }
}

/**
 * Get IP from request headers (works behind proxies like Amplify/CloudFront).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "127.0.0.1";
}
