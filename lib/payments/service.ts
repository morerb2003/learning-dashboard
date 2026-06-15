import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentGateway } from "./gateway";
import type {
  ClientPaymentIntent,
  ConfirmedPayment,
  CreatePaymentIntentInput,
  PaymentIntentQuote,
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
      .select("provider, provider_client_secret")
      .eq("id", quote.id)
      .eq("user_id", user.id)
      .single();

    if (existing?.provider && existing.provider_client_secret) {
      return {
        ...quote,
        provider: existing.provider,
        clientSecret: existing.provider_client_secret,
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
  };
}

export async function confirmPaymentIntent(
  intentId: string
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
    .select("id, provider, provider_intent_id, status")
    .eq("id", intentId)
    .eq("user_id", user.id)
    .single();

  if (intentError || !intent) {
    throw new Error("Payment intent not found.");
  }

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

  const gateway = getPaymentGateway();
  if (intent.provider !== gateway.name) {
    throw new Error("Payment provider mismatch.");
  }

  const confirmation = await gateway.confirmIntent(intent.provider_intent_id);
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("confirm_payment_intent", {
    p_intent_id: intentId,
    p_provider_payment_id: confirmation.providerPaymentId,
    p_user_id: user.id,
  });

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to finalize payment.");
  }

  return data as ConfirmedPayment;
}
