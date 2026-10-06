import assert from "node:assert/strict";
import test from "node:test";
import { createHmac } from "node:crypto";
import {
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
  isRazorpayConfigured,
  getRazorpayKeyId,
} from "../lib/payments/razorpay.ts";
import {
  RazorpayPaymentGateway,
  MockPaymentGateway,
  getPaymentGateway,
} from "../lib/payments/gateway.ts";
import { withIdempotency } from "../lib/idempotency.ts";
import { checkRateLimit } from "../lib/rate-limit.ts";
import type { PaymentIntentQuote } from "../lib/payments/types.ts";

const sampleQuote: PaymentIntentQuote = {
  id: "22222222-2222-4222-8222-222222222222",
  status: "requires_payment_method",
  currency: "INR",
  subtotal_cents: 49900, // ₹499 in paise
  discount_cents: 5000,  // ₹50 discount
  total_cents: 44900,    // ₹449 in paise
  expires_at: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
  pricing_snapshot: { purchase_type: "course", course_id: "c-123" },
};

const TEST_SECRET = "rzp_secret_test_xyz123456789";

test("Razorpay: isRazorpayConfigured reflects environment state", () => {
  const originalId = process.env.RAZORPAY_KEY_ID;
  const originalSecret = process.env.RAZORPAY_KEY_SECRET;

  delete process.env.RAZORPAY_KEY_ID;
  delete process.env.RAZORPAY_KEY_SECRET;
  assert.equal(isRazorpayConfigured(), false);
  assert.equal(getRazorpayKeyId(), null);

  process.env.RAZORPAY_KEY_ID = "rzp_test_mock123";
  process.env.RAZORPAY_KEY_SECRET = TEST_SECRET;
  assert.equal(isRazorpayConfigured(), true);
  assert.equal(getRazorpayKeyId(), "rzp_test_mock123");

  // Restore
  if (originalId) process.env.RAZORPAY_KEY_ID = originalId;
  else delete process.env.RAZORPAY_KEY_ID;
  if (originalSecret) process.env.RAZORPAY_KEY_SECRET = originalSecret;
  else delete process.env.RAZORPAY_KEY_SECRET;
});

test("Signature verification: accepts valid HMAC-SHA256 signature", () => {
  const orderId = "order_Oq7J1abcXYZ123";
  const paymentId = "pay_Pq8K2defUVW456";

  const validSignature = createHmac("sha256", TEST_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const isValid = verifyRazorpayPaymentSignature({
    orderId,
    paymentId,
    signature: validSignature,
    secret: TEST_SECRET,
  });

  assert.equal(isValid, true, "Signature should be valid");
});

test("Signature verification: rejects invalid, forged, or altered signatures", () => {
  const orderId = "order_Oq7J1abcXYZ123";
  const paymentId = "pay_Pq8K2defUVW456";
  const forgedSignature = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

  const isForgedValid = verifyRazorpayPaymentSignature({
    orderId,
    paymentId,
    signature: forgedSignature,
    secret: TEST_SECRET,
  });

  assert.equal(isForgedValid, false, "Forged signature must be rejected");

  // Empty signature
  assert.equal(
    verifyRazorpayPaymentSignature({
      orderId,
      paymentId,
      signature: "",
      secret: TEST_SECRET,
    }),
    false
  );
});

test("Signature verification: rejects signature when orderId mismatches", () => {
  const orderId = "order_real_123";
  const fakeOrderId = "order_tampered_999";
  const paymentId = "pay_valid_456";

  const signatureForReal = createHmac("sha256", TEST_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  // Attacker sends payment with a different orderId
  const isValid = verifyRazorpayPaymentSignature({
    orderId: fakeOrderId,
    paymentId,
    signature: signatureForReal,
    secret: TEST_SECRET,
  });

  assert.equal(isValid, false, "Signature must fail when orderId does not match");
});

test("Webhook verification: verifies valid Razorpay webhook signature", () => {
  const webhookSecret = "whsec_test_secret_998877";
  const rawBody = JSON.stringify({
    entity: "event",
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: "pay_test123",
          order_id: "order_test456",
          amount: 44900,
          currency: "INR",
          status: "captured",
        },
      },
    },
  });

  const validWebhookSig = createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  const verified = verifyRazorpayWebhookSignature({
    rawBody,
    signature: validWebhookSig,
    secret: webhookSecret,
  });

  assert.equal(verified, true, "Webhook signature should verify successfully");
});

test("Webhook verification: rejects tampered webhook payload", () => {
  const webhookSecret = "whsec_test_secret_998877";
  const rawBody = JSON.stringify({ event: "order.paid", amount: 44900 });
  const tamperedBody = JSON.stringify({ event: "order.paid", amount: 100 }); // modified amount

  const originalSig = createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  const verified = verifyRazorpayWebhookSignature({
    rawBody: tamperedBody,
    signature: originalSig,
    secret: webhookSecret,
  });

  assert.equal(verified, false, "Tampered webhook payload must be rejected");
});

test("Payment idempotency: duplicate requests return identical order without duplicate charges", async () => {
  const idempotencyKey = `idemp_test_${Date.now()}`;
  let executionCount = 0;

  const mockCreateOrder = async () => {
    executionCount++;
    return {
      razorpayOrderId: `order_simulated_${Date.now()}`,
      amount: 44900,
      currency: "INR",
      status: "created",
    };
  };

  // First invocation
  const first = await withIdempotency("payment:test_user", idempotencyKey, mockCreateOrder);
  assert.equal(executionCount, 1);
  assert.equal(first.isCached, false);
  assert.ok(first.result.razorpayOrderId.startsWith("order_simulated_"));

  // Duplicate replay with identical key
  const duplicate = await withIdempotency("payment:test_user", idempotencyKey, mockCreateOrder);
  assert.equal(executionCount, 1, "Factory function must not run again");
  assert.equal(duplicate.isCached, true, "Duplicate must be served from idempotency cache");
  assert.equal(duplicate.result.razorpayOrderId, first.result.razorpayOrderId);
  assert.equal(duplicate.result.amount, first.result.amount);
});

test("Payment rate limiting: throttles aggressive checkout attempts", async () => {
  const rateLimitId = `user_checkout_burst_${Date.now()}`;

  // Limit is 10 requests / minute
  for (let i = 0; i < 10; i++) {
    const res = await checkRateLimit("paymentIntent", rateLimitId);
    assert.equal(res.success, true);
  }

  // 11th request must be rate limited
  const blocked = await checkRateLimit("paymentIntent", rateLimitId);
  assert.equal(blocked.success, false, "11th checkout request should be blocked by rate limiter");
  assert.equal(blocked.remaining, 0);
});

test("Gateway selection: defaults to mock when unconfigured, supports razorpay when set", () => {
  const originalGateway = process.env.PAYMENT_GATEWAY;
  const originalKeyId = process.env.RAZORPAY_KEY_ID;
  const originalKeySecret = process.env.RAZORPAY_KEY_SECRET;

  delete process.env.PAYMENT_GATEWAY;
  delete process.env.RAZORPAY_KEY_ID;
  delete process.env.RAZORPAY_KEY_SECRET;

  const defaultGateway = getPaymentGateway();
  assert.equal(defaultGateway.name, "mock");

  process.env.PAYMENT_GATEWAY = "mock";
  const explicitMock = getPaymentGateway();
  assert.equal(explicitMock.name, "mock");

  process.env.PAYMENT_GATEWAY = "razorpay";
  process.env.RAZORPAY_KEY_ID = "rzp_test_123";
  process.env.RAZORPAY_KEY_SECRET = "secret_123";
  const rzpGateway = getPaymentGateway();
  assert.equal(rzpGateway.name, "razorpay");
  assert.equal(new RazorpayPaymentGateway().name, "razorpay");

  // Restore env
  if (originalGateway) process.env.PAYMENT_GATEWAY = originalGateway;
  else delete process.env.PAYMENT_GATEWAY;
  if (originalKeyId) process.env.RAZORPAY_KEY_ID = originalKeyId;
  else delete process.env.RAZORPAY_KEY_ID;
  if (originalKeySecret) process.env.RAZORPAY_KEY_SECRET = originalKeySecret;
  else delete process.env.RAZORPAY_KEY_SECRET;
});

test("Mock payment gateway: creates valid intent and confirms successfully", async () => {
  const mockGateway = new MockPaymentGateway();
  const intent = await mockGateway.createIntent(sampleQuote);

  assert.equal(intent.provider, "mock");
  assert.ok(intent.providerIntentId.startsWith("pi_mock_"));
  assert.ok(intent.clientSecret.includes("_secret_"));

  const confirmation = await mockGateway.confirmIntent(intent.providerIntentId);
  assert.equal(confirmation.status, "succeeded");
  assert.ok(confirmation.providerPaymentId.startsWith("pay_mock_"));
});

test("Currency & amount formatting: converts rupees to exact integer paise without floating point errors", () => {
  const calculatePaise = (rupees: number) => Math.round(rupees * 100);

  assert.equal(calculatePaise(499), 49900);
  assert.equal(calculatePaise(999), 99900);
  assert.equal(calculatePaise(19.99), 1999);
  assert.equal(calculatePaise(0.5), 50);

  // Check that minor units are integers
  assert.equal(Number.isInteger(calculatePaise(499)), true);
  assert.equal(Number.isInteger(calculatePaise(999)), true);
});

test("Signature verification edge cases: empty strings, nulls, and length mismatches fail safely", () => {
  assert.equal(
    verifyRazorpayPaymentSignature({
      orderId: "order_123",
      paymentId: "pay_123",
      signature: "short",
      secret: "secret",
    }),
    false
  );

  assert.equal(
    verifyRazorpayWebhookSignature({
      rawBody: "",
      signature: "",
      secret: "secret",
    }),
    false
  );

  assert.equal(
    verifyRazorpayWebhookSignature({
      rawBody: "{}",
      signature: "invalid_sig",
      secret: "",
    }),
    false
  );
});

