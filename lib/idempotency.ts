import { getRedisClient } from "./redis.ts";
import { ConflictError } from "./errors.ts";
import { logger } from "./logger.ts";

const IDEMPOTENCY_TTL_SECONDS = 60 * 60 * 24; // 24 hours
const LOCK_TIMEOUT_SECONDS = 15; // 15 seconds
const MAX_MEMORY_ENTRIES = 5000;

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

  // If memory store exceeds limit, drop oldest entries
  if (memoryIdempotency.size > MAX_MEMORY_ENTRIES) {
    const keysToDelete = Array.from(memoryIdempotency.keys()).slice(
      0,
      memoryIdempotency.size - MAX_MEMORY_ENTRIES
    );
    for (const k of keysToDelete) {
      memoryIdempotency.delete(k);
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
      logger.warn(`[Idempotency] Redis lookup failed for ${fullKey}`, undefined, error);
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
      logger.warn(`[Idempotency] Redis set failed for ${fullKey}`, undefined, error);
    }
  }

  cleanMemoryStore();
  memoryIdempotency.set(fullKey, {
    result,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
  return true;
}

/**
 * Helper to wait for concurrent in-flight operation to finish.
 */
async function waitForInFlightResult<T>(
  scope: string,
  key: string,
  maxWaitMs = 3000
): Promise<T | null> {
  const startTime = Date.now();
  const intervalMs = 150;

  while (Date.now() - startTime < maxWaitMs) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    const cached = await getIdempotentResult<T>(scope, key);
    if (cached !== null) {
      return cached;
    }
  }
  return null;
}

/**
 * Execute an operation protected by idempotency with strict concurrency locking.
 * If an existing result is stored, it immediately returns the cached result.
 * If a concurrent request is currently in-flight, it waits for completion or throws ConflictError.
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
  let lockAcquired = false;

  // 2. Acquire processing lock (NX: Only set if Not eXists)
  if (redis) {
    try {
      const lockRes = await redis.set(fullKey, "IN_FLIGHT", {
        nx: true,
        ex: LOCK_TIMEOUT_SECONDS,
      });
      lockAcquired = lockRes === "OK";
    } catch {
      // Redis error fallback to memory
      lockAcquired = false;
    }
  }

  if (!redis || !lockAcquired) {
    cleanMemoryStore();
    const existing = memoryIdempotency.get(fullKey);
    if (existing && existing.expiresAt > Date.now()) {
      lockAcquired = false;
    } else {
      memoryIdempotency.set(fullKey, {
        result: "IN_FLIGHT",
        expiresAt: Date.now() + LOCK_TIMEOUT_SECONDS * 1000,
      });
      lockAcquired = true;
    }
  }

  // If lock could NOT be acquired, another request is in-flight!
  if (!lockAcquired) {
    // Wait for the parallel request to complete
    const waitedResult = await waitForInFlightResult<T>(scope, trimmedKey);
    if (waitedResult !== null) {
      return { result: waitedResult, isCached: true };
    }

    throw new ConflictError(
      "A request with this idempotency key is currently in progress. Please retry in a few seconds."
    );
  }

  try {
    const result = await executor();
    await setIdempotentResult(scope, trimmedKey, result, ttlSeconds);
    return { result, isCached: false };
  } catch (err) {
    // Release in-flight lock on failure so caller can retry
    if (redis) {
      try {
        await redis.del(fullKey);
      } catch {
        // ignore
      }
    }
    memoryIdempotency.delete(fullKey);
    throw err;
  }
}
