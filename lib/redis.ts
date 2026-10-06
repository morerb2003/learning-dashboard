import { Redis } from "@upstash/redis";

/**
 * Server-only Upstash Redis client.
 *
 * Provides a resilient Redis client that safely handles missing environment
 * variables and runtime connection errors without crashing Next.js or Vercel edge/serverless functions.
 */

// Global singleton cache across hot-reloads in development
declare global {
  var __aura_redis__: Redis | null | undefined;
}

let redisInstance: Redis | null = null;
let isConfigChecked = false;

export function isRedisConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

export function getRedisClient(): Redis | null {
  if (typeof window !== "undefined") {
    throw new Error("Redis client must never be accessed from client-side code.");
  }

  if (global.__aura_redis__ !== undefined) {
    return global.__aura_redis__;
  }

  if (redisInstance !== null) {
    return redisInstance;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (!isConfigChecked && process.env.NODE_ENV !== "test") {
      console.warn(
        "[Upstash Redis] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not configured. In-memory fail-safe fallbacks will be active."
      );
      isConfigChecked = true;
    }
    return null;
  }

  try {
    redisInstance = new Redis({
      url,
      token,
      retry: {
        retries: 2,
        backoff: (retryCount) => Math.min(Math.exp(retryCount) * 50, 500),
      },
    });

    if (process.env.NODE_ENV !== "production") {
      global.__aura_redis__ = redisInstance;
    }

    return redisInstance;
  } catch (error) {
    console.error("[Upstash Redis] Failed to initialize Redis client:", error);
    return null;
  }
}

/**
 * Convenience getter proxy or null
 */
export const redis = getRedisClient();
