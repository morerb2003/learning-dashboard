import { Ratelimit } from "@upstash/ratelimit";
import { getRedisClient } from "./redis.ts";

export type RateLimiterType =
  | "authLogin"
  | "authSignup"
  | "authPasswordReset"
  | "reviews"
  | "discussions"
  | "paymentIntent"
  | "aiGeneration"
  | "generalApi";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

interface LimitConfig {
  requests: number;
  windowMs: number;
  upstashWindow: `${number} ${"s" | "m" | "h" | "d"}`;
  prefix: string;
}

const LIMIT_CONFIGS: Record<RateLimiterType, LimitConfig> = {
  authLogin: {
    requests: 5,
    windowMs: 60 * 1000,
    upstashWindow: "1 m",
    prefix: "aura:rl:auth:login",
  },
  authSignup: {
    requests: 5,
    windowMs: 10 * 60 * 1000,
    upstashWindow: "10 m",
    prefix: "aura:rl:auth:signup",
  },
  authPasswordReset: {
    requests: 3,
    windowMs: 10 * 60 * 1000,
    upstashWindow: "10 m",
    prefix: "aura:rl:auth:reset",
  },
  reviews: {
    requests: 20,
    windowMs: 60 * 1000,
    upstashWindow: "1 m",
    prefix: "aura:rl:api:reviews",
  },
  discussions: {
    requests: 30,
    windowMs: 60 * 1000,
    upstashWindow: "1 m",
    prefix: "aura:rl:api:discussions",
  },
  paymentIntent: {
    requests: 10,
    windowMs: 60 * 1000,
    upstashWindow: "1 m",
    prefix: "aura:rl:api:payment",
  },
  aiGeneration: {
    requests: 10,
    windowMs: 60 * 1000,
    upstashWindow: "1 m",
    prefix: "aura:rl:api:ai",
  },
  generalApi: {
    requests: 60,
    windowMs: 60 * 1000,
    upstashWindow: "1 m",
    prefix: "aura:rl:api:general",
  },
};

// Map of initialized Upstash Ratelimit instances
const upstashLimiters = new Map<RateLimiterType, Ratelimit>();

const MAX_MEMORY_WINDOWS = 5000;
// In-memory fallback map: key -> list of timestamp ms
const memoryWindows = new Map<string, number[]>();

function cleanMemoryWindows(now: number) {
  // Prune empty windows
  for (const [key, hits] of memoryWindows.entries()) {
    if (hits.length === 0 || hits[hits.length - 1] < now - 600000) {
      memoryWindows.delete(key);
    }
  }

  // Cap size if still over limit
  if (memoryWindows.size > MAX_MEMORY_WINDOWS) {
    const keysToRemove = Array.from(memoryWindows.keys()).slice(
      0,
      memoryWindows.size - MAX_MEMORY_WINDOWS
    );
    for (const k of keysToRemove) {
      memoryWindows.delete(k);
    }
  }
}

function checkMemoryRateLimit(
  type: RateLimiterType,
  identifier: string
): RateLimitResult {
  const config = LIMIT_CONFIGS[type];
  const now = Date.now();
  const windowStart = now - config.windowMs;
  const memoryKey = `${config.prefix}:${identifier}`;

  cleanMemoryWindows(now);

  const currentHits = (memoryWindows.get(memoryKey) || []).filter(
    (time) => time > windowStart
  );

  if (currentHits.length >= config.requests) {
    const oldest = currentHits[0];
    const reset = oldest + config.windowMs;
    return {
      success: false,
      limit: config.requests,
      remaining: 0,
      reset,
    };
  }

  currentHits.push(now);
  memoryWindows.set(memoryKey, currentHits);

  return {
    success: true,
    limit: config.requests,
    remaining: config.requests - currentHits.length,
    reset: now + config.windowMs,
  };
}

/**
 * Get or create an Upstash Ratelimit instance for a given type.
 */
function getUpstashLimiter(type: RateLimiterType): Ratelimit | null {
  const redis = getRedisClient();
  if (!redis) return null;

  if (upstashLimiters.has(type)) {
    return upstashLimiters.get(type)!;
  }

  const config = LIMIT_CONFIGS[type];
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.requests, config.upstashWindow),
    analytics: false,
    prefix: config.prefix,
  });

  upstashLimiters.set(type, limiter);
  return limiter;
}

/**
 * Check rate limit for a given operation type and identifier (e.g. userId or IP).
 */
export async function checkRateLimit(
  type: RateLimiterType,
  identifier: string
): Promise<RateLimitResult> {
  const limiter = getUpstashLimiter(type);

  if (limiter) {
    try {
      const res = await limiter.limit(identifier);
      return {
        success: res.success,
        limit: res.limit,
        remaining: res.remaining,
        reset: res.reset,
      };
    } catch (error) {
      console.warn(
        `[RateLimit] Upstash ratelimit check failed for ${type}:${identifier}. Falling back to in-memory check.`,
        error
      );
    }
  }

  return checkMemoryRateLimit(type, identifier);
}

/**
 * Extract client IP safely from standard headers.
 */
export function getClientIp(request: Request | Headers): string {
  const headers = request instanceof Request ? request.headers : request;

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  return "127.0.0.1";
}

/**
 * Create a standardized HTTP 429 Too Many Requests response.
 */
export function rateLimitResponse(
  resetTimestamp?: number,
  customMessage?: string
): Response {
  const resetSeconds = resetTimestamp
    ? Math.max(1, Math.ceil((resetTimestamp - Date.now()) / 1000))
    : 60;

  return Response.json(
    {
      success: false,
      error: customMessage || "Too many requests. Please try again later.",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(resetSeconds),
        "X-RateLimit-Reset": String(resetTimestamp ?? Date.now() + 60000),
      },
    }
  );
}
