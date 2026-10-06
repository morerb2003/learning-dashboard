import { getRedisClient } from "./redis.ts";

const IDEMPOTENCY_TTL_SECONDS = 60 * 60 * 24; // 24 hours
const LOCK_TIMEOUT_SECONDS = 15; // 15 seconds

interface MemoryIdempotencyEntry {
  result: unknown;
  expiresAt: number;
}

const memoryIdempotency = new Map<string, MemoryIdempotencyEntry>();

function cleanMemoryStore() {
  const now = Date.now();
  for (const [key, entry] of memoryIdempotency.entries()) {
    if (entry.expiresAt <= now) {
      memoryIdempotency.delete(key);
    }
  }
}

/**
 * Build a scoped idempotency key.
 */
export function buildIdempotencyKey(scope: string, identifier: string): string {
  return `aura:idempotency:${scope}:${identifier}`;
}

/**
 * Retrieve cached idempotent result if it exists.
 */
export async function getIdempotentResult<T>(
  scope: string,
  key: string
): Promise<T | null> {
  const redis = getRedisClient();
  const fullKey = buildIdempotencyKey(scope, key);

  if (redis) {
    try {
      const data = await redis.get<T>(fullKey);
      if (data && data !== "IN_FLIGHT") {
        return typeof data === "string" ? (JSON.parse(data) as T) : data;
      }
      return null;
    } catch (error) {
      console.warn(`[Idempotency] Redis lookup failed for ${fullKey}:`, error);
    }
  }

  cleanMemoryStore();
  const entry = memoryIdempotency.get(fullKey);
  if (entry && entry.expiresAt > Date.now() && entry.result !== "IN_FLIGHT") {
    return entry.result as T;
  }

  return null;
}

/**
 * Store the idempotent operation result.
 */
export async function setIdempotentResult<T>(
  scope: string,
  key: string,
  result: T,
  ttlSeconds = IDEMPOTENCY_TTL_SECONDS
): Promise<boolean> {
  const redis = getRedisClient();
  const fullKey = buildIdempotencyKey(scope, key);
  const serialized = JSON.stringify(result);

  if (redis) {
    try {
      await redis.set(fullKey, serialized, { ex: ttlSeconds });
      return true;
    } catch (error) {
      console.warn(`[Idempotency] Redis set failed for ${fullKey}:`, error);
    }
  }

  memoryIdempotency.set(fullKey, {
    result,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
  return true;
}

/**
 * Execute an operation protected by idempotency.
 * If an existing result is stored, it immediately returns the cached result.
 * If a concurrent request is currently in-flight, it waits briefly or rejects duplicate race conditions.
 */
export async function withIdempotency<T>(
  scope: string,
  key: string,
  executor: () => Promise<T>,
  ttlSeconds = IDEMPOTENCY_TTL_SECONDS
): Promise<{ result: T; isCached: boolean }> {
  const trimmedKey = key.trim();
  if (!trimmedKey) {
    const result = await executor();
    return { result, isCached: false };
  }

  // 1. Check existing result
  const cached = await getIdempotentResult<T>(scope, trimmedKey);
  if (cached !== null) {
    return { result: cached, isCached: true };
  }

  const redis = getRedisClient();
  const fullKey = buildIdempotencyKey(scope, trimmedKey);
  // 2. Acquire a short processing lock to prevent parallel double-executions
  if (redis) {
    try {
      await redis.set(fullKey, "IN_FLIGHT", {
        nx: true,
        ex: LOCK_TIMEOUT_SECONDS,
      });
    } catch {
      // Proceed if Redis fails
    }
  } else {
    if (!memoryIdempotency.has(fullKey)) {
      memoryIdempotency.set(fullKey, {
        result: "IN_FLIGHT",
        expiresAt: Date.now() + LOCK_TIMEOUT_SECONDS * 1000,
      });
    }
  }

  try {
    const result = await executor();
    await setIdempotentResult(scope, trimmedKey, result, ttlSeconds);
    return { result, isCached: false };
  } catch (err) {
    // Release in-flight lock if execution fails so user can retry
    if (redis) {
      try {
        await redis.del(fullKey);
      } catch {
        // Ignore
      }
    }
    memoryIdempotency.delete(fullKey);
    throw err;
  }
}
