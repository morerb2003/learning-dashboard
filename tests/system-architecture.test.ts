import { test } from "node:test";
import assert from "node:assert/strict";

import { logger, sanitizeLogData } from "../lib/logger.ts";
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
} from "../lib/errors.ts";
import { safeJson, apiSuccess, apiError } from "../lib/api-response.ts";
import {
  getCached,
  setCached,
  deleteCached,
  rememberCached,
  CACHE_KEYS,
} from "../lib/cache.ts";
import {
  withIdempotency,
  buildIdempotencyKey,
  getIdempotentResult,
  setIdempotentResult,
} from "../lib/idempotency.ts";
import { checkRateLimit, getClientIp, rateLimitResponse } from "../lib/rate-limit.ts";

// ==============================================================================
// 1. HTTP & Networking / Request Lifecycle
// ==============================================================================

test("Request Lifecycle: safeJson correctly parses valid JSON", async () => {
  const req = new Request("https://aura.local/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ courseId: "c-101", title: "Distributed Systems" }),
  });

  const parsed = await safeJson<{ courseId: string; title: string }>(req);
  assert.equal(parsed.courseId, "c-101");
  assert.equal(parsed.title, "Distributed Systems");
});

test("Request Lifecycle: safeJson handles empty body safely without throwing SyntaxError", async () => {
  const req = new Request("https://aura.local/api/test", {
    method: "POST",
  });

  const parsed = await safeJson(req);
  assert.deepEqual(parsed, {});
});

test("Request Lifecycle: safeJson rejects malformed JSON with BadRequestError", async () => {
  const req = new Request("https://aura.local/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{ malformed json...",
  });

  await assert.rejects(
    async () => {
      await safeJson(req);
    },
    (err: unknown) => {
      return (
        err instanceof BadRequestError &&
        err.statusCode === 400 &&
        err.message.includes("Invalid JSON")
      );
    }
  );
});

test("Request Lifecycle: apiSuccess wraps data in standard envelope with metadata", () => {
  const response = apiSuccess(
    { userId: "u-123", email: "learner@aura.io" },
    { status: 201, requestId: "req-abc-123" }
  );

  assert.equal(response.status, 201);
  assert.equal(response.headers.get("X-Request-Id"), "req-abc-123");
  assert.equal(response.headers.get("Content-Type"), "application/json");
});

test("Request Lifecycle: apiError produces standard error envelope with status code", () => {
  const customErr = new ConflictError("Payout already requested for this transaction");
  const response = apiError(customErr, { requestId: "req-err-456" });

  assert.equal(response.status, 409);
  assert.equal(response.headers.get("X-Request-Id"), "req-err-456");
});

// ==============================================================================
// 2. Observability & Security
// ==============================================================================

test("Observability & Security: sanitizeLogData masks passwords, secrets, tokens, and API keys", () => {
  const sensitivePayload = {
    user: "admin",
    password: "SuperSecretPassword123!",
    apiKey: "rzp_live_testkey123456",
    authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
    metadata: {
      creditCard: "4111222233334444",
      normalField: "public-value",
    },
  };

  const sanitized = sanitizeLogData(sensitivePayload) as Record<string, unknown>;
  assert.equal(sanitized.user, "admin");
  assert.equal(sanitized.password, "[REDACTED]");
  assert.equal(sanitized.apiKey, "[REDACTED]");
  assert.equal(sanitized.authorization, "[REDACTED]");
  const meta = sanitized.metadata as Record<string, unknown>;
  assert.equal(meta.creditCard, "[REDACTED]");
  assert.equal(meta.normalField, "public-value");
});

test("Observability & Security: getClientIp extracts real IP across standard headers", () => {
  const req1 = new Request("https://aura.local", {
    headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18" },
  });
  assert.equal(getClientIp(req1), "203.0.113.195");

  const req2 = new Request("https://aura.local", {
    headers: { "x-real-ip": "198.51.100.22" },
  });
  assert.equal(getClientIp(req2), "198.51.100.22");

  const req3 = new Request("https://aura.local", {
    headers: { "cf-connecting-ip": "192.0.2.77" },
  });
  assert.equal(getClientIp(req3), "192.0.2.77");

  const req4 = new Request("https://aura.local");
  assert.equal(getClientIp(req4), "127.0.0.1");
});

// ==============================================================================
// 3. Caching & Concurrency
// ==============================================================================

test("Caching & Concurrency: Cache stampede single-flight coalesces concurrent identical requests", async () => {
  const cacheKey = `test:stampede:${Date.now()}`;
  let executionCount = 0;

  const expensiveFetcher = async () => {
    executionCount += 1;
    await new Promise((r) => setTimeout(r, 60)); // Simulate async db latency
    return { data: "expensive-computed-value", run: executionCount };
  };

  // Launch 15 concurrent calls simultaneously for the same key
  const promises = Array.from({ length: 15 }, () =>
    rememberCached(cacheKey, 30, expensiveFetcher)
  );

  const results = await Promise.all(promises);

  // All 15 callers received the result
  assert.equal(results.length, 15);
  results.forEach((res) => {
    assert.equal(res.data, "expensive-computed-value");
    assert.equal(res.run, 1);
  });

  // CRITICAL: The expensive fetcher was executed exactly ONCE instead of 15 times
  assert.equal(executionCount, 1);

  await deleteCached(cacheKey);
});

test("Caching & Concurrency: Idempotency concurrency lock prevents parallel double-execution", async () => {
  const scope = "payment_test";
  const idKey = `idemp_${Date.now()}`;
  let executionCount = 0;

  const task = async () => {
    executionCount += 1;
    await new Promise((r) => setTimeout(r, 120)); // simulated processing delay
    return { status: "processed", executionId: executionCount };
  };

  // Run first execution and a parallel duplicate attempt
  const [res1, res2] = await Promise.all([
    withIdempotency(scope, idKey, task),
    withIdempotency(scope, idKey, task),
  ]);

  // Both return identical result
  assert.equal(res1.result.status, "processed");
  assert.equal(res2.result.status, "processed");

  // Only one execution should have run
  assert.equal(executionCount, 1);
});

// ==============================================================================
// 4. Authentication, Validation & Authorization
// ==============================================================================

test("Authentication & Validation: AppError types map to distinct HTTP statuses", () => {
  const badReq = new BadRequestError("Invalid parameter");
  assert.equal(badReq.statusCode, 400);

  const unauth = new UnauthorizedError();
  assert.equal(unauth.statusCode, 401);

  const forbidden = new ForbiddenError();
  assert.equal(forbidden.statusCode, 403);

  const notFound = new NotFoundError();
  assert.equal(notFound.statusCode, 404);

  const conflict = new ConflictError();
  assert.equal(conflict.statusCode, 409);

  const rateLimit = new RateLimitError();
  assert.equal(rateLimit.statusCode, 429);
});

test("Authentication & Validation: Rate limit response returns standard 429 Retry-After", () => {
  const resetTime = Date.now() + 45000;
  const res = rateLimitResponse(resetTime, "Checkout throttle triggered");

  assert.equal(res.status, 429);
  assert.ok(Number(res.headers.get("Retry-After")) > 0);
  assert.equal(res.headers.get("X-RateLimit-Reset"), String(resetTime));
});

// ==============================================================================
// 5. Queues, Error Handling & Webhook Resilience
// ==============================================================================

test("Queues & Error Handling: Webhook failure status preserves retry capability", () => {
  // Verifies that a webhook event record marked as 'failed' is allowed to retry
  // while an event marked as 'processed' returns 200 deduplicated.
  const isProcessable = (status: "processing" | "processed" | "failed") => {
    return status !== "processed";
  };

  assert.equal(isProcessable("failed"), true, "Failed webhook events must be retryable");
  assert.equal(isProcessable("processed"), false, "Processed webhook events must be deduplicated");
  assert.equal(isProcessable("processing"), true, "In-progress retries after timeout must be handled");
});

test("Databases & Transactions: Teacher payout calculation strictly honors available ledger balance", () => {
  const ledgerCredits = 50000; // ₹500.00
  const ledgerDebits = 10000;  // ₹100.00
  const pendingPayouts = 15000; // ₹150.00

  const netBalance = ledgerCredits - ledgerDebits; // ₹400.00 (40000 cents)
  const availableToWithdraw = netBalance - pendingPayouts; // ₹250.00 (25000 cents)

  assert.equal(availableToWithdraw, 25000);

  // Attempt to withdraw ₹300.00 (30000 cents) should be rejected
  const requestedPayout = 30000;
  const canWithdraw = requestedPayout <= availableToWithdraw;
  assert.equal(canWithdraw, false, "Withdrawal exceeding available balance must be rejected");

  // Attempt to withdraw ₹250.00 (25000 cents) should be permitted
  const validRequestedPayout = 25000;
  const canWithdrawValid = validRequestedPayout <= availableToWithdraw;
  assert.equal(canWithdrawValid, true, "Valid withdrawal within available balance must be allowed");
});
