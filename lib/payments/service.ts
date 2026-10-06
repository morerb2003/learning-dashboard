import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentGateway } from "./gateway";
import {
  fetchRazorpayPayment,
  getRazorpayKeyId,
  verifyRazorpayPaymentSignature,
} from "./razorpay";
import { CACHE_KEYS, deleteCached, deleteCachedPattern } from "@/lib/cache";
import { recordActivityPulse } from "@/lib/telemetry";
import type {
  ClientPaymentIntent,
  ConfirmedPayment,
  CreatePaymentIntentInput,
  PaymentIntentQuote,
  RazorpayConfirmationInput,
} from "./types";

function messageFromError(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function validateIntentInput(input: CreatePaymentIntentInput) {
  if (!input.idempotencyKey.trim()) {
    throw new Error("An idempotency key is required.");
  }

  if (input.purchaseType === "course" && !input.courseId) {
    throw new Error("A course ID is required.");
  }

  if (
    input.purchaseType === "subscription" &&
    (!input.planCode || !input.billingCycle)
  ) {
    throw new Error("A subscription plan and billing cycle are required.");
  }
}

export async function createPaymentIntent(
  input: CreatePaymentIntentInput
): Promise<ClientPaymentIntent> {
  validateIntentInput(input);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to start checkout.");
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("create_payment_intent", {
    p_purchase_type: input.purchaseType,
    p_course_id: input.courseId ?? null,
    p_plan_code: input.planCode ?? null,
    p_billing_cycle: input.billingCycle ?? null,
    p_coupon_code: input.couponCode?.trim() || null,
    p_idempotency_key: input.idempotencyKey,
    p_user_id: user.id,
  });

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to create payment intent.");
  }

  const quote = data as PaymentIntentQuote;

  if (quote.status !== "requires_payment_method") {
    const { data: existing } = await supabase
      .from("payment_intents")
      .select("provider, provider_client_secret, provider_intent_id")
      .eq("id", quote.id)
      .eq("user_id", user.id)
      .single();

    if (existing?.provider && existing.provider_client_secret) {
      return {
        ...quote,
        provider: existing.provider,
        clientSecret: existing.provider_client_secret,
        razorpayKeyId:
          existing.provider === "razorpay" ? getRazorpayKeyId() || undefined : undefined,
        razorpayOrderId:
          existing.provider === "razorpay"
            ? existing.provider_intent_id || undefined
            : undefined,
      };
    }
  }

  const gateway = getPaymentGateway();
  const providerIntent = await gateway.createIntent(quote);

  const { error: attachError } = await admin.rpc("attach_payment_provider", {
    p_intent_id: quote.id,
    p_provider: providerIntent.provider,
    p_provider_intent_id: providerIntent.providerIntentId,
    p_client_secret: providerIntent.clientSecret,
    p_user_id: user.id,
  });

  if (attachError) {
    throw new Error(
      messageFromError(attachError, "Unable to initialize the payment provider.")
    );
  }

  return {
    ...quote,
    status: "requires_confirmation",
    provider: providerIntent.provider,
    clientSecret: providerIntent.clientSecret,
    razorpayKeyId: providerIntent.razorpayKeyId,
    razorpayOrderId: providerIntent.razorpayOrderId,
  };
}

export async function confirmPaymentIntent(
  intentId: string,
  razorpayDetails?: RazorpayConfirmationInput
): Promise<ConfirmedPayment> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to confirm checkout.");
  }

  const { data: intent, error: intentError } = await supabase
    .from("payment_intents")
    .select("id, provider, provider_intent_id, status, total_cents, currency, course_id, purchase_type")
    .eq("id", intentId)
    .eq("user_id", user.id)
    .single();

  if (intentError || !intent) {
    throw new Error("Payment intent not found.");
  }

  // Idempotent: If already succeeded, return completed payment record
  if (intent.status === "succeeded") {
    const { data: payment } = await supabase
      .from("payments")
      .select("id, subscription_id")
      .eq("payment_intent_id", intentId)
      .single();

    if (!payment) {
      throw new Error("Completed payment record not found.");
    }

    return {
      payment_id: payment.id,
      subscription_id: payment.subscription_id,
      status: "succeeded",
    };
  }

  if (!intent.provider_intent_id) {
    throw new Error("Payment provider is not initialized.");
  }

  let providerPaymentId: string;

  if (intent.provider === "razorpay") {
    if (!razorpayDetails) {
      throw new Error("Razorpay payment details (payment_id, order_id, signature) are required.");
    }

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = razorpayDetails;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      throw new Error("Incomplete Razorpay payment confirmation parameters.");
    }

    if (intent.provider_intent_id !== razorpay_order_id) {
      throw new Error("Razorpay order ID mismatch.");
    }

    // 1. Verify HMAC-SHA256 signature
    const isValidSignature = verifyRazorpayPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValidSignature) {
      throw new Error("Invalid Razorpay payment signature.");
    }

    // 2. Authoritative server-side verification: fetch payment directly from Razorpay
    const payment = await fetchRazorpayPayment(razorpay_payment_id);

    if (payment.order_id !== razorpay_order_id) {
      throw new Error("Razorpay payment does not match the requested order.");
    }

    if (payment.status !== "captured" && payment.status !== "authorized") {
      throw new Error(`Razorpay payment is not successful (status: ${payment.status}).`);
    }

    // Verify amount in smallest currency unit
    if (Math.round(payment.amount) !== Math.round(intent.total_cents)) {
      throw new Error("Payment amount mismatch detected. Transaction rejected.");
    }

    providerPaymentId = razorpay_payment_id;
  } else {
    // Fallback gateway (e.g. MockPaymentGateway)
    const gateway = getPaymentGateway();
    if (intent.provider !== gateway.name) {
      throw new Error("Payment provider mismatch.");
    }
    const confirmation = await gateway.confirmIntent(intent.provider_intent_id);
    providerPaymentId = confirmation.providerPaymentId;
  }

  // 3. Atomically confirm in Supabase (creates payment, enrollment/subscription, ledger entry)
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("confirm_payment_intent", {
    p_intent_id: intentId,
    p_provider_payment_id: providerPaymentId,
    p_user_id: user.id,
  });

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to finalize payment.");
  }

  // 4. Invalidate relevant Redis caches & emit social pulse event
  try {
    if (intent.course_id) {
      await deleteCached(CACHE_KEYS.courseDetail(intent.course_id));
    }
    await deleteCachedPattern(`user:${user.id}:*`);
    await deleteCachedPattern("telemetry:leaderboard:*");
    await recordActivityPulse({
      type: intent.purchase_type === "course" ? "enrollment" : "certificate",
      title:
        intent.purchase_type === "course"
          ? "Enrolled in course"
          : "Upgraded subscription",
      actor: user.email || "Learner",
    });
  } catch (cacheErr) {
    console.warn("[Payments] Post-confirmation cache cleanup warning:", cacheErr);
  }

  return data as ConfirmedPayment;
}

/**
 * Server-only webhook confirmation function.
 * Called when Razorpay webhook delivers `payment.captured` or `order.paid`.
 */
export async function confirmPaymentIntentFromWebhook(params: {
  providerOrderId: string;
  providerPaymentId: string;
  amountPaise: number;
}): Promise<ConfirmedPayment | null> {
  const admin = createAdminClient();

  const { data: intent, error: intentError } = await admin
    .from("payment_intents")
    .select("id, user_id, provider, provider_intent_id, status, total_cents, course_id, purchase_type")
    .eq("provider_intent_id", params.providerOrderId)
    .single();

  if (intentError || !intent) {
    console.warn(`[Razorpay Webhook] No intent found for order: ${params.providerOrderId}`);
    return null;
  }

  if (intent.status === "succeeded") {
    const { data: payment } = await admin
      .from("payments")
      .select("id, subscription_id")
      .eq("payment_intent_id", intent.id)
      .single();

    return {
      payment_id: payment?.id || intent.id,
      subscription_id: payment?.subscription_id,
      status: "succeeded",
    };
  }

  // Verify amount matches server quote
  if (Math.round(params.amountPaise) !== Math.round(intent.total_cents)) {
    throw new Error(
      `Webhook amount mismatch: expected ${intent.total_cents}, got ${params.amountPaise}`
    );
  }

  const { data, error } = await admin.rpc("confirm_payment_intent", {
    p_intent_id: intent.id,
    p_provider_payment_id: params.providerPaymentId,
    p_user_id: intent.user_id,
  });

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to finalize payment from webhook.");
  }

  try {
    if (intent.course_id) {
      await deleteCached(CACHE_KEYS.courseDetail(intent.course_id));
    }
    await deleteCachedPattern(`user:${intent.user_id}:*`);
    await deleteCachedPattern("telemetry:leaderboard:*");
    await recordActivityPulse({
      type: intent.purchase_type === "course" ? "enrollment" : "certificate",
      title:
        intent.purchase_type === "course"
          ? "Enrolled in course"
          : "Upgraded subscription",
      actor: "Learner",
    });
  } catch (cacheErr) {
    console.warn("[Payments Webhook] Cache cleanup warning:", cacheErr);
  }

  return data as ConfirmedPayment;
}
