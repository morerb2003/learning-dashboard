import { createHash } from "node:crypto";
import { checkRateLimit, rateLimitResponse } from "../rate-limit.ts";
import { CACHE_KEYS, getCached, setCached } from "../cache.ts";
import { withIdempotency } from "../idempotency.ts";

export interface AiProtectionOptions<T> {
  userId: string;
  feature: string;
  prompt: string;
  generator: () => Promise<T>;
  ttlSeconds?: number;
}

export interface AiProtectionResult<T> {
  result: T;
  cached: boolean;
}

function hashPrompt(feature: string, prompt: string): string {
  return createHash("sha256")
    .update(`${feature}:${prompt.trim().toLowerCase()}`)
    .digest("hex");
}

/**
 * Executes an AI generation request with Redis rate limiting (10 req/min/user),
 * concurrency deduplication, and caching for deterministic prompts.
 */
export async function withAiProtection<T>({
  userId,
  feature,
  prompt,
  generator,
  ttlSeconds = 3600, // 1 hour
}: AiProtectionOptions<T>): Promise<AiProtectionResult<T>> {
  // 1. Redis Rate Limit: 10 requests / minute / user
  const rateLimit = await checkRateLimit("aiGeneration", userId);
  if (!rateLimit.success) {
    throw new Error("AI request limit reached. Please wait a moment before generating again.");
  }

  // 2. Compute prompt fingerprint
  const promptHash = hashPrompt(feature, prompt);
  const cacheKey = CACHE_KEYS.aiResult(promptHash);

  // 3. Check cached AI response
  const cached = await getCached<T>(cacheKey);
  if (cached !== null) {
    return { result: cached, cached: true };
  }

  // 4. Concurrency lock & deduplication (prevents double generation for simultaneous identical prompts)
  const { result } = await withIdempotency(
    `ai:${feature}`,
    promptHash,
    generator,
    ttlSeconds
  );

  // 5. Store in cache
  await setCached(cacheKey, result, ttlSeconds);

  return { result, cached: false };
}

/**
 * Standalone helper to rate limit AI generation in Next.js Route Handlers.
 */
export async function checkAiRateLimitOrResponse(userId: string) {
  const check = await checkRateLimit("aiGeneration", userId);
  if (!check.success) {
    return rateLimitResponse(check.reset, "AI generation rate limit exceeded. Please try again shortly.");
  }
  return null;
}
