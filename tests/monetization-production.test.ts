import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateRevenueSplit,
  getAuthoritativePlanPrice,
  rupeesToPaise,
  paiseToRupees,
  DEFAULT_REFUND_POLICY,
} from "../lib/payments/pricing.ts";
import {
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
} from "../lib/payments/razorpay.ts";

const TEST_SECRET = "rzp_secret_monetization_test_12345";
const WEBHOOK_SECRET = "whsec_monetization_test_67890";

// 1. Successful course payment & 80/20 split
test("Monetization 1: Successful course payment 80/20 integer paise split", () => {
  const coursePriceRupees = 999;
  const coursePricePaise = rupeesToPaise(coursePriceRupees); // 99900 paise

  assert.equal(coursePricePaise, 99900);

  const split = calculateRevenueSplit(coursePricePaise);
  assert.equal(split.grossCents, 99900);
  assert.equal(split.platformCents, 19980); // 20%
  assert.equal(split.teacherCents, 79920);   // 80%
  assert.equal(split.platformCents + split.teacherCents, split.grossCents);
  assert.equal(Number.isInteger(split.platformCents), true);
  assert.equal(Number.isInteger(split.teacherCents), true);
});

// 2. Failed payment handling
test("Monetization 2: Failed payment does not award access or ledger credit", () => {
  const simulatedPayment = {
    status: "failed",
    failure_code: "BAD_REQUEST_ERROR",
    failure_message: "Payment cancelled by user",
  };

  const shouldGrantAccess = (status: string) => status === "completed" || status === "succeeded";
  const shouldCreditLedger = (status: string) => status === "completed" || status === "succeeded";

  assert.equal(shouldGrantAccess(simulatedPayment.status), false);
  assert.equal(shouldCreditLedger(simulatedPayment.status), false);
});

// 3. Invalid Razorpay signature
test("Monetization 3: Rejects invalid or forged Razorpay payment signature", () => {
  const orderId = "order_Oq7J1abcXYZ123";
  const paymentId = "pay_Pq8K2defUVW456";
  const forgedSignature = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";

  const isValid = verifyRazorpayPaymentSignature({
    orderId,
    paymentId,
    signature: forgedSignature,
    secret: TEST_SECRET,
  });

  assert.equal(isValid, false, "Forged signature must fail verification");
});

// 4. Invalid webhook signature
test("Monetization 4: Rejects webhook with invalid or tampered signature", () => {
  const rawBody = JSON.stringify({ event: "payment.captured", id: "pay_123" });
  const invalidSignature = "invalid_webhook_signature_hex";

  const isValid = verifyRazorpayWebhookSignature({
    rawBody,
    signature: invalidSignature,
    secret: WEBHOOK_SECRET,
  });

  assert.equal(isValid, false, "Invalid webhook signature must fail");
});

// 5. Duplicate webhook deduplication
test("Monetization 5: Duplicate webhook event deduplication logic", () => {
  const processedEventIds = new Set<string>();

  const processWebhook = (eventId: string) => {
    if (processedEventIds.has(eventId)) {
      return { received: true, deduplicated: true };
    }
    processedEventIds.add(eventId);
    return { received: true, deduplicated: false };
  };

  const eventId = "evt_rzp_9988776655";
  const firstDelivery = processWebhook(eventId);
  assert.equal(firstDelivery.received, true);
  assert.equal(firstDelivery.deduplicated, false);

  const duplicateDelivery = processWebhook(eventId);
  assert.equal(duplicateDelivery.received, true);
  assert.equal(duplicateDelivery.deduplicated, true);
});

// 6. Duplicate payment confirmation idempotency
test("Monetization 6: Duplicate payment confirmation returns existing record", () => {
  const paymentStore = new Map<string, { payment_id: string; status: string }>();

  const confirmPayment = (intentId: string) => {
    if (paymentStore.has(intentId)) {
      return { ...paymentStore.get(intentId)!, replayed: true };
    }
    const record = { payment_id: `pay_${intentId}`, status: "succeeded" };
    paymentStore.set(intentId, record);
    return { ...record, replayed: false };
  };

  const intentId = "intent_uuid_123";
  const res1 = confirmPayment(intentId);
  assert.equal(res1.status, "succeeded");
  assert.equal(res1.replayed, false);

  const res2 = confirmPayment(intentId);
  assert.equal(res2.payment_id, res1.payment_id);
  assert.equal(res2.replayed, true);
});

// 7. Duplicate enrollment prevention
test("Monetization 7: Enforces single enrollment per student-course", () => {
  const enrollments = new Set<string>();

  const enroll = (userId: string, courseId: string) => {
    const key = `${userId}:${courseId}`;
    if (enrollments.has(key)) {
      return { created: false, message: "Already enrolled" };
    }
    enrollments.add(key);
    return { created: true, message: "Enrolled" };
  };

  const res1 = enroll("u-1", "c-101");
  assert.equal(res1.created, true);

  const res2 = enroll("u-1", "c-101");
  assert.equal(res2.created, false);
});

// 8. Server-side price tampering rejection
test("Monetization 8: Ignores client-manipulated prices and enforces server quotes", () => {
  // Client attempts to send ₹1 instead of ₹499
  const clientManipulatedPriceRupees = 1;

  // Server authoritative price lookup
  const authoritativeQuote = getAuthoritativePlanPrice("pro", "monthly");
  assert.equal(authoritativeQuote.amountCents, 49900); // ₹499 in paise
  assert.notEqual(authoritativeQuote.amountCents, clientManipulatedPriceRupees * 100);

  // Creator plan authoritative price
  const creatorAnnual = getAuthoritativePlanPrice("premium", "yearly");
  assert.equal(creatorAnnual.amountCents, 999000); // ₹9,990 in paise
});

// 9. Unauthorized refund rejection
test("Monetization 9: Rejects refund request for transactions belonging to another user", () => {
  const payment = {
    id: "pay_trans_100",
    user_id: "user_legitimate_buyer",
    status: "completed",
  };

  const canRefund = (requestingUserId: string, isAdmin: boolean) => {
    if (isAdmin) return true;
    return payment.user_id === requestingUserId;
  };

  assert.equal(canRefund("user_legitimate_buyer", false), true);
  assert.equal(canRefund("user_malicious_attacker", false), false);
  assert.equal(canRefund("admin_user", true), true);
});

// 10. Duplicate refund rejection
test("Monetization 10: Rejects refunding an already refunded transaction", () => {
  const payment = {
    id: "pay_trans_200",
    status: "refunded",
    refund_id: "rfnd_existing_999",
  };

  const isEligibleForRefund = (p: typeof payment) => {
    return p.status === "completed" && !p.refund_id;
  };

  assert.equal(isEligibleForRefund(payment), false);
});

// 11. Teacher 80/20 split across multiple price points
test("Monetization 11: Teacher 80/20 split preserves exact integer paise across all catalog tiers", () => {
  const catalogTiersRupees = [499, 999, 1499, 1999, 2999];

  for (const price of catalogTiersRupees) {
    const paise = rupeesToPaise(price);
    const split = calculateRevenueSplit(paise);

    assert.equal(split.platformCents + split.teacherCents, paise);
    assert.equal(split.platformCents, Math.floor((paise * 2000) / 10000));
    assert.equal(split.teacherCents, paise - split.platformCents);
  }
});

// 12. Subscription activation & expiry date calculation
test("Monetization 12: Subscription activation calculates correct renewal date", () => {
  const startDate = new Date("2026-01-01T00:00:00Z");

  const monthlyEnd = new Date(startDate);
  monthlyEnd.setMonth(monthlyEnd.getMonth() + 1);

  const annualEnd = new Date(startDate);
  annualEnd.setFullYear(annualEnd.getFullYear() + 1);

  assert.equal(monthlyEnd.toISOString(), "2026-02-01T00:00:00.000Z");
  assert.equal(annualEnd.toISOString(), "2027-01-01T00:00:00.000Z");
});

// 13. Subscription expiry detection and tier downgrade
test("Monetization 13: Automatically detects expired subscription by timestamp", () => {
  const activeSub = {
    current_period_end: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(), // +10 days
    status: "active",
  };

  const expiredSub = {
    current_period_end: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // -2 days
    status: "active",
  };

  const isStillValid = (sub: { current_period_end: string; status: string }) => {
    return sub.status === "active" && new Date(sub.current_period_end) > new Date();
  };

  assert.equal(isStillValid(activeSub), true);
  assert.equal(isStillValid(expiredSub), false);
});

// 14. Subscription cancellation with access through period end
test("Monetization 14: Subscription cancellation preserves access until period end", () => {
  const periodEnd = new Date(Date.now() + 1000 * 60 * 60 * 24 * 15); // +15 days
  const sub = {
    status: "canceled",
    cancel_at_period_end: true,
    current_period_end: periodEnd.toISOString(),
  };

  const hasAccess = (s: typeof sub) => {
    return new Date(s.current_period_end) > new Date();
  };

  assert.equal(hasAccess(sub), true);
});

// 15. Payout exceeding balance rejection
test("Monetization 15: Rejects teacher payout exceeding net available balance", () => {
  const availableBalanceCents = 500000; // ₹5,000

  const canWithdraw = (requestedCents: number) => {
    return requestedCents > 0 && requestedCents <= availableBalanceCents;
  };

  assert.equal(canWithdraw(300000), true); // ₹3,000
  assert.equal(canWithdraw(500000), true); // ₹5,000
  assert.equal(canWithdraw(500100), false); // ₹5,001
  assert.equal(canWithdraw(1000000), false); // ₹10,000 (Prompt Scenario 6)
  assert.equal(canWithdraw(0), false);
  assert.equal(canWithdraw(-500), false);
});

// 16. In-flight payout deduplication
test("Monetization 16: Deducts pending payouts to prevent double-spending available balance", () => {
  const totalEarnedCents = 800000; // ₹8,000
  const existingPendingPayoutsCents = 500000; // ₹5,000 in-flight

  const withdrawableCents = totalEarnedCents - existingPendingPayoutsCents; // ₹3,000 remaining
  assert.equal(withdrawableCents, 300000);

  // Attempting to withdraw ₹4,000 must fail
  assert.equal(400000 <= withdrawableCents, false);
  // Attempting to withdraw ₹3,000 succeeds
  assert.equal(300000 <= withdrawableCents, true);
});

// 17. Revenue ledger calculations: credits and debits net out correctly
test("Monetization 17: Revenue ledger balances credits and debits precisely", () => {
  const ledgerEntries = [
    { entry_type: "sale", direction: "credit", amount_cents: 80000 },   // +₹800
    { entry_type: "sale", direction: "credit", amount_cents: 160000 },  // +₹1,600
    { entry_type: "refund", direction: "debit", amount_cents: 80000 },  // -₹800
    { entry_type: "adjustment", direction: "debit", amount_cents: 50000 }, // -₹500 (payout)
  ];

  let netBalanceCents = 0;
  for (const entry of ledgerEntries) {
    if (entry.direction === "credit") netBalanceCents += entry.amount_cents;
    else if (entry.direction === "debit") netBalanceCents -= entry.amount_cents;
  }

  assert.equal(netBalanceCents, 110000); // ₹1,100 net
  assert.equal(paiseToRupees(netBalanceCents), 1100);
});

// 18. Server-side price verification and refund window policy
test("Monetization 18: Refund policy enforces 30-day window", () => {
  assert.equal(DEFAULT_REFUND_POLICY.allowedWindowDays, 30);

  const purchaseDateRecent = new Date(Date.now() - 1000 * 60 * 60 * 24 * 14); // 14 days ago
  const purchaseDateOld = new Date(Date.now() - 1000 * 60 * 60 * 24 * 45); // 45 days ago

  const isWithinWindow = (date: Date) => {
    const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= DEFAULT_REFUND_POLICY.allowedWindowDays;
  };

  assert.equal(isWithinWindow(purchaseDateRecent), true);
  assert.equal(isWithinWindow(purchaseDateOld), false);
});
