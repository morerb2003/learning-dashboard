import { getRedisClient } from "./redis.ts";

/**
 * In-memory fallback store when Redis is unavailable or unconfigured.
 */
interface MemoryCacheEntry {
  value: string;
  expiresAt: number;
}

const memoryCache = new Map<string, MemoryCacheEntry>();

function cleanMemoryCache() {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expiresAt <= now) {
      memoryCache.delete(key);
    }
  }
}

/**
 * Standard cache key prefixes for AURA LMS
 */
export const CACHE_KEYS = {
  courseList: (queryStr: string) => `aura:cache:courses:list:${queryStr || "default"}`,
  courseDetail: (id: string) => `aura:cache:courses:detail:${id}`,
  courseCategories: () => "aura:cache:courses:categories",
  adminAnalytics: (metric: string) => `aura:cache:analytics:admin:${metric}`,
  teacherAnalytics: (teacherId: string) => `aura:cache:analytics:teacher:${teacherId}`,
  aiResult: (promptHash: string) => `aura:cache:ai:result:${promptHash}`,
} as const;

/**
 * Retrieve cached data by key.
 */
export async function getCached<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();

  if (redis) {
    try {
      const data = await redis.get<T>(key);
      if (data !== null && data !== undefined) {
        return typeof data === "string" ? (JSON.parse(data) as T) : data;
      }
      return null;
    } catch (error) {
      console.warn(`[Cache] Redis get failed for key "${key}", checking memory fallback:`, error);
    }
  }

  // Memory fallback
  cleanMemoryCache();
  const entry = memoryCache.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    try {
      return JSON.parse(entry.value) as T;
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Store data in cache with a TTL (in seconds).
 */
export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<boolean> {
  if (ttlSeconds <= 0) return false;

  const redis = getRedisClient();
  const serialized = JSON.stringify(value);

  if (redis) {
    try {
      await redis.set(key, serialized, { ex: ttlSeconds });
      return true;
    } catch (error) {
      console.warn(`[Cache] Redis set failed for key "${key}", writing to memory fallback:`, error);
    }
  }

  // Memory fallback
  memoryCache.set(key, {
    value: serialized,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
  return true;
}

/**
 * Delete a specific key from cache.
 */
export async function deleteCached(key: string): Promise<boolean> {
  const redis = getRedisClient();
  let deletedFromRedis = false;

  if (redis) {
    try {
      await redis.del(key);
      deletedFromRedis = true;
    } catch (error) {
      console.warn(`[Cache] Redis delete failed for key "${key}":`, error);
    }
  }

  const deletedFromMemory = memoryCache.delete(key);
  return deletedFromRedis || deletedFromMemory;
}

/**
 * Invalidate multiple keys matching a pattern (e.g. `aura:cache:courses:*`).
 */
export async function deleteCachedPattern(pattern: string): Promise<number> {
  const redis = getRedisClient();
  let count = 0;

  if (redis) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        count += keys.length;
      }
    } catch (error) {
      console.warn(`[Cache] Redis scan/delete pattern "${pattern}" failed:`, error);
    }
  }

  // Invalidate matching memory cache keys
  const regex = new RegExp(`^${pattern.replace(/\*/g, ".*")}$`);
  for (const key of memoryCache.keys()) {
    if (regex.test(key)) {
      memoryCache.delete(key);
      count += 1;
    }
  }

  return count;
}

/**
 * Helper to get or compute and store a cached value.
 */
export async function rememberCached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await getCached<T>(key);
  if (cached !== null) {
    return cached;
  }

  const fresh = await fetcher();
  if (fresh !== null && fresh !== undefined) {
    await setCached(key, fresh, ttlSeconds);
  }
  return fresh;
}
