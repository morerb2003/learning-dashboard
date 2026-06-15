import assert from "node:assert/strict";
import test from "node:test";
import { getPaymentGateway } from "../lib/payments/gateway.ts";
import type { PaymentIntentQuote } from "../lib/payments/types.ts";

const quote: PaymentIntentQuote = {
  id: "11111111-1111-4111-8111-111111111111",
  status: "requires_payment_method",
  currency: "USD",
  subtotal_cents: 5000,
  discount_cents: 1000,
  total_cents: 4000,
  expires_at: "2026-06-15T12:30:00.000Z",
  pricing_snapshot: { purchase_type: "course" },
};

test("mock gateway creates a stable provider intent for an AURA intent", async () => {
  const gateway = getPaymentGateway();
  const first = await gateway.createIntent(quote);
  const second = await gateway.createIntent(quote);

  assert.equal(first.provider, "mock");
  assert.equal(first.providerIntentId, second.providerIntentId);
  assert.equal(first.clientSecret, second.clientSecret);
  assert.match(first.clientSecret, /^pi_mock_.+_secret_[a-f0-9]{32}$/);
});

test("mock gateway confirmation returns a provider payment reference", async () => {
  const gateway = getPaymentGateway();
  const intent = await gateway.createIntent(quote);
  const payment = await gateway.confirmIntent(intent.providerIntentId);

  assert.equal(payment.status, "succeeded");
  assert.match(payment.providerPaymentId, /^pay_mock_[a-f0-9]+$/);
});
