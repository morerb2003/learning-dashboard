import { createAdminClient } from "@/lib/supabase/admin";
import { createRazorpayRefund, isRazorpayConfigured } from "./razorpay";
import { deleteCached, deleteCachedPattern, CACHE_KEYS } from "@/lib/cache";
import { MonetizationNotifications } from "@/lib/notifications";

import { DEFAULT_REFUND_POLICY, type RefundPolicy } from "./pricing";
export { DEFAULT_REFUND_POLICY, type RefundPolicy };

export interface ProcessRefundInput {
  paymentId: string;
  userId: string;
  reason?: string;
  isAdmin?: boolean;
  policy?: Partial<RefundPolicy>;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  paymentId: string;
  amountCents: number;
  currency: string;
  status: "processed" | "pending";
  message: string;
}

/**
 * Validates whether a payment is eligible for refund under policy.
 */
export async function validateRefundEligibility(
  paymentId: string,
  userId: string,
  isAdmin = false,
  customPolicy?: Partial<RefundPolicy>
) {
  const policy: RefundPolicy = { ...DEFAULT_REFUND_POLICY, ...(customPolicy || {}) };
  const admin = createAdminClient();

  const { data: payment, error } = await admin
    .from("payments")
    .select(
      "id, user_id, course_id, subscription_id, status, total_cents, currency, provider, provider_payment_id, payment_intent_id, created_at, paid_at, refund_id, refunded_at"
    )
    .eq("id", paymentId)
    .single();

  if (error || !payment) {
    throw new Error("Payment transaction not found.");
  }

  // 1. Ownership check: user can only refund their own payment (admins can refund any)
  if (!isAdmin && payment.user_id !== userId) {
    throw new Error("Unauthorized: You do not own this payment transaction.");
  }

  // 2. Status check: only completed payments can be refunded
  if (payment.status === "refunded" || payment.refund_id) {
    throw new Error("This payment has already been refunded.");
  }

  if (payment.status !== "completed") {
    throw new Error(`Payment cannot be refunded in current status: ${payment.status}`);
  }

  // 3. 30-day window check
  const paymentTimestamp = payment.paid_at || payment.created_at;
  const paymentDate = new Date(paymentTimestamp);
  const now = new Date();
  const diffDays = (now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24);

  if (!isAdmin && diffDays > policy.allowedWindowDays) {
    throw new Error(
      `Refund window expired. Refunds are only eligible within ${policy.allowedWindowDays} days of purchase (purchased ${Math.floor(
        diffDays
      )} days ago).`
    );
  }

  return { payment, policy };
}

/**
 * Executes a full refund:
 * 1. Validates policy and eligibility
 * 2. Calls Razorpay Refund API
 * 3. Updates payment status to 'refunded'
 * 4. Inserts refund record
 * 5. Reverses revenue ledger (both platform and teacher debits)
 * 6. Revokes course enrollment or subscription
 * 7. Sends notification
 */
export async function processPaymentRefund(
  input: ProcessRefundInput
): Promise<RefundResult> {
  const { payment, policy } = await validateRefundEligibility(
    input.paymentId,
    input.userId,
    input.isAdmin,
    input.policy
  );

  const admin = createAdminClient();
  let providerRefundId: string;

  // 1. Process via Razorpay if provider is razorpay
  if (payment.provider === "razorpay" && payment.provider_payment_id) {
    if (isRazorpayConfigured()) {
      try {
        const rzpRefund = await createRazorpayRefund({
          paymentId: payment.provider_payment_id,
          amountPaise: payment.total_cents,
          notes: {
            aura_payment_id: payment.id,
            user_id: payment.user_id,
            reason: input.reason || "Customer refund request",
          },
        });
        providerRefundId = rzpRefund.id;
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : "Razorpay refund processing failed."
        );
      }
    } else {
      // Test environment fallback
      providerRefundId = `rfnd_mock_${Date.now()}`;
    }
  } else {
    // Mock / internal provider refund
    providerRefundId = `rfnd_mock_${Date.now()}`;
  }

  const nowIso = new Date().toISOString();

  // 2. Update payment status in database
  const { error: updatePaymentErr } = await admin
    .from("payments")
    .update({
      status: "refunded",
      refund_id: providerRefundId,
      refunded_at: nowIso,
      refund_amount_cents: payment.total_cents,
    })
    .eq("id", payment.id);

  if (updatePaymentErr) {
    throw new Error(`Failed to update payment status: ${updatePaymentErr.message}`);
  }

  // 3. Create payment refund record
  await admin.from("payment_refunds").insert({
    payment_id: payment.id,
    user_id: payment.user_id,
    amount_cents: payment.total_cents,
    currency: payment.currency,
    reason: input.reason || "Refund requested",
    provider_refund_id: providerRefundId,
    status: "processed",
    policy_snapshot: policy,
    processed_by: input.isAdmin ? input.userId : null,
    created_at: nowIso,
    processed_at: nowIso,
  });

  // 4. Adjust revenue ledger: reverse original credits with debit entries
  const { data: originalLedgerEntries } = await admin
    .from("revenue_ledger")
    .select("account_type, account_id, amount_cents, currency, commission_rate_bps")
    .eq("payment_id", payment.id)
    .eq("direction", "credit");

  if (originalLedgerEntries && originalLedgerEntries.length > 0) {
    for (const entry of originalLedgerEntries) {
      await admin.from("revenue_ledger").insert({
        payment_id: payment.id,
        payment_intent_id: payment.payment_intent_id,
        account_type: entry.account_type,
        account_id: entry.account_id,
        entry_type: "refund",
        direction: "debit",
        amount_cents: entry.amount_cents,
        currency: entry.currency,
        commission_rate_bps: entry.commission_rate_bps,
        metadata: {
          refund_id: providerRefundId,
          refunded_at: nowIso,
          reason: input.reason || "Refund adjustment",
        },
      });
    }
  } else {
    // Fallback: debit platform full amount
    await admin.from("revenue_ledger").insert({
      payment_id: payment.id,
      payment_intent_id: payment.payment_intent_id,
      account_type: "platform",
      account_id: null,
      entry_type: "refund",
      direction: "debit",
      amount_cents: payment.total_cents,
      currency: payment.currency,
      commission_rate_bps: 10000,
      metadata: { refund_id: providerRefundId, refunded_at: nowIso },
    });
  }

  // 5. Revoke course or subscription access
  if (payment.course_id) {
    // Delete enrollment
    await admin
      .from("enrollments")
      .delete()
      .eq("user_id", payment.user_id)
      .eq("course_id", payment.course_id);

    try {
      await deleteCached(CACHE_KEYS.courseDetail(payment.course_id));
    } catch {
      // cache clear best-effort
    }
  }

  if (payment.subscription_id) {
    await admin
      .from("subscriptions")
      .update({ status: "refunded", updated_at: nowIso })
      .eq("id", payment.subscription_id);

    await admin
      .from("profiles")
      .update({ subscription_tier: "free" })
      .eq("id", payment.user_id);
  }

  // 6. Send notification
  await MonetizationNotifications.refundProcessed(
    payment.user_id,
    payment.total_cents / 100,
    payment.id
  );

  // 7. Invalidate caches
  try {
    await deleteCachedPattern(`user:${payment.user_id}:*`);
  } catch {
    // cache clear best-effort
  }

  return {
    success: true,
    refundId: providerRefundId,
    paymentId: payment.id,
    amountCents: payment.total_cents,
    currency: payment.currency,
    status: "processed",
    message: "Your refund has been processed successfully.",
  };
}
