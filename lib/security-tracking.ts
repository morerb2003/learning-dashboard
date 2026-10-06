import { getRedisClient } from "./redis.ts";

const MAX_ATTEMPTS = 5;
const LOCKOUT_WINDOW_SECONDS = 15 * 60; // 15 minutes

interface MemorySecurityEntry {
  attempts: number;
  firstAttemptAt: number;
  blockedUntil: number | null;
}

const memorySecurity = new Map<string, MemorySecurityEntry>();

function normalizeEmailKey(email?: string): string | null {
  if (!email || !email.trim()) return null;
  return email.trim().toLowerCase();
}

/**
 * Check if the given IP or email is currently throttled due to repeated failed login attempts.
 */
export async function checkLoginThrottled(
  ip: string,
  email?: string
): Promise<{ throttled: boolean; retryAfterSeconds: number; remainingAttempts: number }> {
  const redis = getRedisClient();
  const normEmail = normalizeEmailKey(email);
  const keysToCheck = [`aura:sec:login:ip:${ip}`];
  if (normEmail) {
    keysToCheck.push(`aura:sec:login:email:${normEmail}`);
  }

  if (redis) {
    try {
      for (const key of keysToCheck) {
        const attempts = await redis.get<number>(key);
        const count = typeof attempts === "number" ? attempts : parseInt(String(attempts || "0"), 10);
        if (count >= MAX_ATTEMPTS) {
          const ttl = await redis.ttl(key);
          const retryAfter = ttl > 0 ? ttl : LOCKOUT_WINDOW_SECONDS;
          return {
            throttled: true,
            retryAfterSeconds: retryAfter,
            remainingAttempts: 0,
          };
        }
      }

      // Find max attempt count among the checked keys
      let highestAttempts = 0;
      for (const key of keysToCheck) {
        const val = await redis.get<number>(key);
        const count = typeof val === "number" ? val : parseInt(String(val || "0"), 10);
        if (count > highestAttempts) highestAttempts = count;
      }

      return {
        throttled: false,
        retryAfterSeconds: 0,
        remainingAttempts: Math.max(0, MAX_ATTEMPTS - highestAttempts),
      };
    } catch (error) {
      console.warn("[Security] Redis checkLoginThrottled failed, falling back to memory:", error);
    }
  }

  // Memory fallback
  const now = Date.now();
  for (const key of keysToCheck) {
    const entry = memorySecurity.get(key);
    if (entry) {
      if (entry.blockedUntil && entry.blockedUntil > now) {
        const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000);
        return {
          throttled: true,
          retryAfterSeconds: retryAfter,
          remainingAttempts: 0,
        };
      }
    }
  }

  let highestAttempts = 0;
  for (const key of keysToCheck) {
    const entry = memorySecurity.get(key);
    if (entry && entry.attempts > highestAttempts) {
      highestAttempts = entry.attempts;
    }
  }

  return {
    throttled: false,
    retryAfterSeconds: 0,
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - highestAttempts),
  };
}

/**
 * Record a failed login attempt for the given IP and optional email.
 */
export async function recordLoginFailure(
  ip: string,
  email?: string
): Promise<{ throttled: boolean; remainingAttempts: number }> {
  const redis = getRedisClient();
  const normEmail = normalizeEmailKey(email);
  const keysToIncrement = [`aura:sec:login:ip:${ip}`];
  if (normEmail) {
    keysToIncrement.push(`aura:sec:login:email:${normEmail}`);
  }

  let maxAttemptsSeen = 1;

  if (redis) {
    try {
      for (const key of keysToIncrement) {
        const current = await redis.incr(key);
        if (current === 1) {
          await redis.expire(key, LOCKOUT_WINDOW_SECONDS);
        }
        if (current > maxAttemptsSeen) {
          maxAttemptsSeen = current;
        }
      }

      return {
        throttled: maxAttemptsSeen >= MAX_ATTEMPTS,
        remainingAttempts: Math.max(0, MAX_ATTEMPTS - maxAttemptsSeen),
      };
    } catch (error) {
      console.warn("[Security] Redis recordLoginFailure failed, falling back to memory:", error);
    }
  }

  // Memory fallback
  const now = Date.now();
  for (const key of keysToIncrement) {
    const entry = memorySecurity.get(key) || {
      attempts: 0,
      firstAttemptAt: now,
      blockedUntil: null,
    };

    if (entry.firstAttemptAt + LOCKOUT_WINDOW_SECONDS * 1000 < now) {
      entry.attempts = 1;
      entry.firstAttemptAt = now;
      entry.blockedUntil = null;
    } else {
      entry.attempts += 1;
    }

    if (entry.attempts >= MAX_ATTEMPTS) {
      entry.blockedUntil = now + LOCKOUT_WINDOW_SECONDS * 1000;
    }

    memorySecurity.set(key, entry);
    if (entry.attempts > maxAttemptsSeen) {
      maxAttemptsSeen = entry.attempts;
    }
  }

  return {
    throttled: maxAttemptsSeen >= MAX_ATTEMPTS,
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - maxAttemptsSeen),
  };
}

/**
 * Reset failed login attempts on successful login.
 */
export async function recordLoginSuccess(
  ip: string,
  email?: string
): Promise<void> {
  const redis = getRedisClient();
  const normEmail = normalizeEmailKey(email);
  const keysToDelete = [`aura:sec:login:ip:${ip}`];
  if (normEmail) {
    keysToDelete.push(`aura:sec:login:email:${normEmail}`);
  }

  if (redis) {
    try {
      await redis.del(...keysToDelete);
    } catch (error) {
      console.warn("[Security] Redis reset failed:", error);
    }
  }

  for (const key of keysToDelete) {
    memorySecurity.delete(key);
  }
}
