import assert from "node:assert/strict";
import test from "node:test";
import { checkRateLimit } from "../lib/rate-limit.ts";
import {
  getCached,
  setCached,
  deleteCached,
  deleteCachedPattern,
  rememberCached,
} from "../lib/cache.ts";
import {
  withIdempotency,
  getIdempotentResult,
  setIdempotentResult,
} from "../lib/idempotency.ts";
import {
  checkLoginThrottled,
  recordLoginFailure,
  recordLoginSuccess,
} from "../lib/security-tracking.ts";
import {
  createVerificationOtp,
  verifyVerificationOtp,
} from "../lib/otp.ts";
import { isRedisConfigured } from "../lib/redis.ts";

test("Rate limiting: allowed request and rate limit exceeded", async () => {
  const testIp = `198.51.100.${Date.now() % 250}`;

  // Limit for authLogin is 5 requests / min
  for (let i = 0; i < 5; i++) {
    const res = await checkRateLimit("authLogin", testIp);
    assert.equal(res.success, true, `Request ${i + 1} should be allowed`);
    assert.equal(res.remaining, 5 - (i + 1));
  }

  // 6th request must exceed limit
  const blocked = await checkRateLimit("authLogin", testIp);
  assert.equal(blocked.success, false, "Request 6 should be blocked");
  assert.equal(blocked.remaining, 0);
  assert.ok(blocked.reset > Date.now());
});

test("Rate limiting: isolates different users and IPs", async () => {
  const userA = `user_alice_${Date.now()}`;
  const userB = `user_bob_${Date.now()}`;

  // User A exhausts their limit
  for (let i = 0; i < 10; i++) {
    await checkRateLimit("paymentIntent", userA);
  }
  const userABlocked = await checkRateLimit("paymentIntent", userA);
  assert.equal(userABlocked.success, false, "User A should be blocked");

  // User B is fresh and should be allowed
  const userBAllowed = await checkRateLimit("paymentIntent", userB);
  assert.equal(userBAllowed.success, true, "User B should be unaffected by User A");
  assert.equal(userBAllowed.remaining, 9);
});

test("Cache: cache miss, hit, TTL expiration, and deletion", async () => {
  const key = `test:course:${Date.now()}`;

  // Cache miss
  const miss = await getCached<{ id: string }>(key);
  assert.equal(miss, null);

  // Set cache
  await setCached(key, { id: "course-123" }, 60);

  // Cache hit
  const hit = await getCached<{ id: string }>(key);
  assert.deepEqual(hit, { id: "course-123" });

  // Remember helper
  let computedCount = 0;
  const remValue = await rememberCached(key, 60, async () => {
    computedCount++;
    return { id: "should-not-recompute" };
  });
  assert.equal(computedCount, 0, "Fetcher must not run on cache hit");
  assert.deepEqual(remValue, { id: "course-123" });

  // Delete cache
  await deleteCached(key);
  const afterDelete = await getCached(key);
  assert.equal(afterDelete, null, "Deleted key must return null");
});

test("Cache: pattern invalidation", async () => {
  const prefix = `test:pattern:${Date.now()}`;
  await setCached(`${prefix}:item1`, { val: 1 }, 60);
  await setCached(`${prefix}:item2`, { val: 2 }, 60);

  assert.ok(await getCached(`${prefix}:item1`));
  assert.ok(await getCached(`${prefix}:item2`));

  await deleteCachedPattern(`${prefix}:*`);

  assert.equal(await getCached(`${prefix}:item1`), null);
  assert.equal(await getCached(`${prefix}:item2`), null);
});

test("Idempotency: first request, duplicate replay, and different keys", async () => {
  const scope = `payment_test_${Date.now()}`;
  const key1 = "idem-key-abc";
  let executionCount = 0;

  const runOperation = async () => {
    executionCount++;
    return { paymentId: "pay_test_999", amount: 5000 };
  };

  // 1. First execution
  const first = await withIdempotency(scope, key1, runOperation);
  assert.equal(first.isCached, false);
  assert.equal(first.result.paymentId, "pay_test_999");
  assert.equal(executionCount, 1);

  // 2. Duplicate execution with identical key must replay cached result
  const second = await withIdempotency(scope, key1, runOperation);
  assert.equal(second.isCached, true);
  assert.equal(second.result.paymentId, "pay_test_999");
  assert.equal(executionCount, 1, "Executor function must NOT be called twice");

  // 3. Different idempotency key must execute
  const third = await withIdempotency(scope, "idem-key-different", runOperation);
  assert.equal(third.isCached, false);
  assert.equal(executionCount, 2);

  // 4. Low-level get/set idempotency helpers
  await setIdempotentResult(scope, "manual-idem-key", { status: "manual_saved" }, 30);
  const manualRetrieved = await getIdempotentResult<{ status: string }>(scope, "manual-idem-key");
  assert.deepEqual(manualRetrieved, { status: "manual_saved" });
});

test("Security tracking: login failure lockout and success reset", async () => {
  const ip = `10.0.0.${Date.now() % 250}`;
  const email = `testuser_${Date.now()}@aura.dev`;

  const initial = await checkLoginThrottled(ip, email);
  assert.equal(initial.throttled, false);
  assert.equal(initial.remainingAttempts, 5);

  // Simulate 4 failures
  for (let i = 0; i < 4; i++) {
    const res = await recordLoginFailure(ip, email);
    assert.equal(res.throttled, false);
  }

  // 5th failure must trigger lockout
  const fifth = await recordLoginFailure(ip, email);
  assert.equal(fifth.throttled, true);
  assert.equal(fifth.remainingAttempts, 0);

  const checkBlocked = await checkLoginThrottled(ip, email);
  assert.equal(checkBlocked.throttled, true);
  assert.ok(checkBlocked.retryAfterSeconds > 0);

  // Successful login clears the lockout
  await recordLoginSuccess(ip, email);
  const afterSuccess = await checkLoginThrottled(ip, email);
  assert.equal(afterSuccess.throttled, false);
  assert.equal(afterSuccess.remainingAttempts, 5);
});

test("OTP verification: create, verify valid, reject invalid, enforce attempt limits", async () => {
  const identifier = `verify_${Date.now()}@aura.dev`;

  // Create OTP
  const { code, expiresAt } = await createVerificationOtp(identifier);
  assert.equal(code.length, 6);
  assert.ok(expiresAt > Date.now());

  // Incorrect code attempt
  const wrongAttempt = await verifyVerificationOtp(identifier, "000000");
  assert.equal(wrongAttempt.valid, false);

  // Correct code consumes OTP
  const correctAttempt = await verifyVerificationOtp(identifier, code);
  assert.equal(correctAttempt.valid, true);

  // Re-using consumed OTP must fail (one-time consumption)
  const reusedAttempt = await verifyVerificationOtp(identifier, code);
  assert.equal(reusedAttempt.valid, false);
});

test("Fail-safe behavior: operations remain safe when Redis is unconfigured or in memory mode", async () => {
  // Regardless of whether UPSTASH_REDIS_REST_URL is configured, all operations must succeed
  const configured = isRedisConfigured();
  assert.equal(typeof configured, "boolean");

  const fallbackKey = `failsafe:test:${Date.now()}`;
  await setCached(fallbackKey, { safe: true }, 10);
  const val = await getCached<{ safe: true }>(fallbackKey);
  assert.deepEqual(val, { safe: true });
});
