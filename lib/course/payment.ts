"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  confirmPaymentIntent,
  createPaymentIntent,
} from "@/lib/payments/service";
import type {
  BillingCycle,
  SubscriptionPlanCode,
} from "@/lib/payments/types";

export type CouponResult = {
  success: boolean;
  discountPercent?: number;
  couponId?: string;
  error?: string;
};

export async function applyCouponAction(code: string): Promise<CouponResult> {
  if (!code.trim()) {
    return { success: false, error: "Coupon code is empty" };
  }

  const supabase = await createClient();
  const { data: coupon, error } = await supabase
    .from("coupons")
    .select(
      "id, discount_type, discount_value, discount_percent, is_active, starts_at, expires_at"
    )
    .eq("code", code.trim().toUpperCase())
    .eq("is_active", true)
    .maybeSingle();

  if (error || !coupon) {
    return { success: false, error: "Invalid coupon code" };
  }

  const now = Date.now();
  if (
    (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) ||
    (coupon.expires_at && new Date(coupon.expires_at).getTime() <= now)
  ) {
    return { success: false, error: "Coupon is not currently valid" };
  }

  if (coupon.discount_type !== "percentage") {
    return {
      success: false,
      error: "This coupon is validated during checkout.",
    };
  }

  return {
    success: true,
    discountPercent: coupon.discount_value ?? coupon.discount_percent,
    couponId: coupon.id,
  };
}

async function runMockCheckout(
  input:
    | { purchaseType: "course"; courseId: string; couponCode?: string }
    | {
        purchaseType: "subscription";
        planCode: SubscriptionPlanCode;
        billingCycle: BillingCycle;
        couponCode?: string;
      }
) {
  const intent = await createPaymentIntent({
    ...input,
    idempotencyKey: randomUUID(),
  });

  return confirmPaymentIntent(intent.id);
}

export async function checkoutCourseAction(
  courseId: string,
  couponCode?: string
): Promise<{ success: boolean; error?: string; paymentId?: string }> {
  try {
    const payment = await runMockCheckout({
      purchaseType: "course",
      courseId,
      couponCode,
    });

    revalidatePath("/learning");
    revalidatePath(`/course/${courseId}`);
    return { success: true, paymentId: payment.payment_id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Payment failed.",
    };
  }
}

export async function subscribeAction(
  planCode: SubscriptionPlanCode,
  billingCycle: BillingCycle,
  couponCode?: string
): Promise<{ success: boolean; error?: string; paymentId?: string }> {
  try {
    const payment = await runMockCheckout({
      purchaseType: "subscription",
      planCode,
      billingCycle,
      couponCode,
    });

    revalidatePath("/dashboard");
    return { success: true, paymentId: payment.payment_id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Subscription failed.",
    };
  }
}

export async function subscribeProAction(
  couponCode?: string
): Promise<{ success: boolean; error?: string; paymentId?: string }> {
  return subscribeAction("pro", "monthly", couponCode);
}
