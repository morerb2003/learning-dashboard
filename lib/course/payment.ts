"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CouponResult = {
  success: boolean;
  discountPercent?: number;
  couponId?: string;
  error?: string;
};

// ─── Apply Coupon ─────────────────────────────────────────────────────────────
export async function applyCouponAction(code: string): Promise<CouponResult> {
  if (!code || !code.trim()) {
    return { success: false, error: "Coupon code is empty" };
  }

  const supabase = await createClient();
  const { data: coupon, error } = await supabase
    .from("coupons")
    .select("id, code, discount_percent, is_active, expires_at")
    .eq("code", code.trim().toUpperCase())
    .eq("is_active", true)
    .maybeSingle();

  if (error || !coupon) {
    return { success: false, error: "Invalid coupon code" };
  }

  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
    return { success: false, error: "Coupon code has expired" };
  }

  return {
    success: true,
    discountPercent: coupon.discount_percent,
    couponId: coupon.id,
  };
}

// ─── Course Checkout ──────────────────────────────────────────────────────────
export async function checkoutCourseAction(
  courseId: string,
  couponCode?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in to purchase a course." };
  }

  // Fetch course details
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, price, is_premium")
    .eq("id", courseId)
    .single();

  if (courseError || !course) {
    return { success: false, error: "Course not found" };
  }

  const originalPrice = Number(course.price ?? 0);
  let finalPrice = originalPrice;
  let discountApplied = 0;
  let appliedCouponId: string | undefined = undefined;

  // Process coupon if provided
  if (couponCode && couponCode.trim()) {
    const couponRes = await applyCouponAction(couponCode);
    if (couponRes.success && couponRes.discountPercent) {
      discountApplied = (originalPrice * couponRes.discountPercent) / 100;
      finalPrice = Math.max(0, originalPrice - discountApplied);
      appliedCouponId = couponRes.couponId;
    } else if (couponCode.trim().toUpperCase() !== "") {
      return { success: false, error: couponRes.error ?? "Invalid coupon code" };
    }
  }

  // Check if already enrolled
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle();

  if (enrollment) {
    return { success: false, error: "You are already enrolled in this course." };
  }

  const transactionId = `TXN-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

  // Log transaction payment
  const { error: paymentError } = await supabase.from("payments").insert({
    user_id: user.id,
    course_id: courseId,
    amount: finalPrice,
    discount_applied: discountApplied,
    payment_type: "course_purchase",
    coupon_id: appliedCouponId || null,
    status: "completed",
    transaction_id: transactionId,
  });

  if (paymentError) {
    return { success: false, error: `Payment failed: ${paymentError.message}` };
  }

  // Enroll student
  const { error: enrollError } = await supabase.from("enrollments").insert({
    user_id: user.id,
    course_id: courseId,
    progress: 0,
    last_accessed_at: new Date().toISOString(),
  });

  if (enrollError) {
    return { success: false, error: `Enrollment failed: ${enrollError.message}` };
  }

  revalidatePath("/learning");
  revalidatePath(`/course/${courseId}`);
  return { success: true };
}

// ─── Pro Subscription Checkout ────────────────────────────────────────────────
export async function subscribeProAction(
  couponCode?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in to subscribe." };
  }

  const subscriptionPrice = 19.99; // $19.99 / mo
  let finalPrice = subscriptionPrice;
  let discountApplied = 0;
  let appliedCouponId: string | undefined = undefined;

  // Process coupon if provided
  if (couponCode && couponCode.trim()) {
    const couponRes = await applyCouponAction(couponCode);
    if (couponRes.success && couponRes.discountPercent) {
      discountApplied = (subscriptionPrice * couponRes.discountPercent) / 100;
      finalPrice = Math.max(0, subscriptionPrice - discountApplied);
      appliedCouponId = couponRes.couponId;
    } else if (couponCode.trim().toUpperCase() !== "") {
      return { success: false, error: couponRes.error ?? "Invalid coupon code" };
    }
  }

  const transactionId = `SUB-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

  // Log transaction payment
  const { error: paymentError } = await supabase.from("payments").insert({
    user_id: user.id,
    amount: finalPrice,
    discount_applied: discountApplied,
    payment_type: "subscription_pro",
    coupon_id: appliedCouponId || null,
    status: "completed",
    transaction_id: transactionId,
  });

  if (paymentError) {
    return { success: false, error: `Subscription failed: ${paymentError.message}` };
  }

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  // Upgrade profile to Pro tier
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      subscription_tier: "pro",
      subscription_expires_at: expiresAt.toISOString(),
    })
    .eq("id", user.id);

  if (profileError) {
    return { success: false, error: `Profile upgrade failed: ${profileError.message}` };
  }

  revalidatePath("/dashboard");
  return { success: true };
}
