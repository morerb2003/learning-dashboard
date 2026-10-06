import { createHash, randomInt } from "node:crypto";
import { getRedisClient } from "./redis.ts";

const OTP_TTL_SECONDS = 5 * 60; // 5 minutes
const MAX_VERIFICATION_ATTEMPTS = 5;

interface StoredOtpData {
  hash: string;
  attempts: number;
  maxAttempts: number;
}

interface MemoryOtpEntry {
  data: StoredOtpData;
  expiresAt: number;
}

const memoryOtpStore = new Map<string, MemoryOtpEntry>();

function hashOtp(code: string, identifier: string): string {
  return createHash("sha256")
    .update(`${identifier}:${code}`)
    .digest("hex");
}

function cleanMemoryStore() {
  const now = Date.now();
  for (const [key, entry] of memoryOtpStore.entries()) {
    if (entry.expiresAt <= now) {
      memoryOtpStore.delete(key);
    }
  }
}

/**
 * Generate and store a secure 6-digit OTP code for temporary verification.
 * The code is hashed before storage so plaintext is never kept in Redis.
 */
export async function createVerificationOtp(
  identifier: string,
  ttlSeconds = OTP_TTL_SECONDS
): Promise<{ code: string; expiresAt: number }> {
  const cleanId = identifier.trim().toLowerCase();
  const code = randomInt(100000, 999999).toString();
  const hash = hashOtp(code, cleanId);
  const redis = getRedisClient();
  const redisKey = `aura:otp:${cleanId}`;

  const payload: StoredOtpData = {
    hash,
    attempts: 0,
    maxAttempts: MAX_VERIFICATION_ATTEMPTS,
  };

  const expiresAt = Date.now() + ttlSeconds * 1000;

  if (redis) {
    try {
      await redis.set(redisKey, JSON.stringify(payload), { ex: ttlSeconds });
      return { code, expiresAt };
    } catch (error) {
      console.warn(`[OTP] Redis set failed for ${cleanId}, using memory store:`, error);
    }
  }

  cleanMemoryStore();
  memoryOtpStore.set(cleanId, {
    data: payload,
    expiresAt,
  });

  return { code, expiresAt };
}

/**
 * Verify and consume a one-time verification code.
 */
export async function verifyVerificationOtp(
  identifier: string,
  code: string
): Promise<{ valid: boolean; reason?: string }> {
  const cleanId = identifier.trim().toLowerCase();
  const inputCode = code.trim();
  const redis = getRedisClient();
  const redisKey = `aura:otp:${cleanId}`;

  let payload: StoredOtpData | null = null;

  if (redis) {
    try {
      const raw = await redis.get<string | StoredOtpData>(redisKey);
      if (raw) {
        payload = typeof raw === "string" ? (JSON.parse(raw) as StoredOtpData) : raw;
      }
    } catch (error) {
      console.warn(`[OTP] Redis get failed for ${cleanId}:`, error);
    }
  }

  if (!payload) {
    cleanMemoryStore();
    const mem = memoryOtpStore.get(cleanId);
    if (mem && mem.expiresAt > Date.now()) {
      payload = mem.data;
    }
  }

  if (!payload) {
    return { valid: false, reason: "Verification code expired or not found." };
  }

  // Increment attempts
  payload.attempts += 1;

  if (payload.attempts > payload.maxAttempts) {
    // Exceeded maximum attempts - delete immediately
    if (redis) {
      try {
        await redis.del(redisKey);
      } catch {
        // Ignore
      }
    }
    memoryOtpStore.delete(cleanId);
    return { valid: false, reason: "Too many failed attempts. Request a new code." };
  }

  const expectedHash = hashOtp(inputCode, cleanId);
  const isValid = payload.hash === expectedHash;

  if (isValid) {
    // One-time consumption: delete on success
    if (redis) {
      try {
        await redis.del(redisKey);
      } catch {
        // Ignore
      }
    }
    memoryOtpStore.delete(cleanId);
    return { valid: true };
  }

  // Update attempts counter in storage
  if (redis) {
    try {
      const ttl = await redis.ttl(redisKey);
      if (ttl > 0) {
        await redis.set(redisKey, JSON.stringify(payload), { ex: ttl });
      }
    } catch {
      // Ignore
    }
  } else {
    const mem = memoryOtpStore.get(cleanId);
    if (mem) {
      mem.data = payload;
    }
  }

  const remaining = payload.maxAttempts - payload.attempts;
  return {
    valid: false,
    reason: `Invalid code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
  };
}
