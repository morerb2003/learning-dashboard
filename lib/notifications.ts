import { createAdminClient } from "@/lib/supabase/admin";

export interface SendNotificationParams {
  userId: string;
  type: "payment" | "subscription" | "refund" | "payout" | "sale";
  title: string;
  message: string;
  href?: string;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
}

/**
 * Creates an in-app notification idempotently.
 * If an idempotencyKey is supplied (or found in metadata), existing notifications
 * matching that key are not duplicated.
 */
export async function sendNotification(
  params: SendNotificationParams
): Promise<{ success: boolean; id?: string; duplicate?: boolean }> {
  const admin = createAdminClient();
  const dedupKey = params.idempotencyKey || (params.metadata?.idempotencyKey as string);

  try {
    if (dedupKey) {
      // Check for existing notification with same dedupKey in metadata
      const { data: existing } = await admin
        .from("notifications")
        .select("id")
        .eq("user_id", params.userId)
        .contains("metadata", { dedupKey })
        .limit(1)
        .maybeSingle();

      if (existing) {
        return { success: true, id: existing.id, duplicate: true };
      }
    }

    const metadata = {
      ...(params.metadata || {}),
      ...(dedupKey ? { dedupKey } : {}),
    };

    const { data, error } = await admin
      .from("notifications")
      .insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        href: params.href || null,
        metadata,
      })
      .select("id")
      .single();

    if (error) {
      console.warn("[Notifications] Failed to insert notification:", error.message);
      return { success: false };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.warn("[Notifications] Exception sending notification:", err);
    return { success: false };
  }
}

/**
 * Standard notification triggers for monetization events
 */
export const MonetizationNotifications = {
  coursePaymentSuccess(userId: string, courseTitle: string, paymentId: string) {
    return sendNotification({
      userId,
      type: "payment",
      title: "Course Enrolled 🎉",
      message: "Payment successful. Your course access is now active.",
      href: "/dashboard",
      idempotencyKey: `notif:course_pay:${paymentId}`,
      metadata: { courseTitle, paymentId },
    });
  },

  subscriptionActivated(userId: string, planName: string, paymentId: string) {
    return sendNotification({
      userId,
      type: "subscription",
      title: "Subscription Active ⚡",
      message: `Your ${planName} subscription is active.`,
      href: "/dashboard",
      idempotencyKey: `notif:sub_pay:${paymentId}`,
      metadata: { planName, paymentId },
    });
  },

  refundProcessed(userId: string, amountRupees: number, paymentId: string) {
    return sendNotification({
      userId,
      type: "refund",
      title: "Refund Processed 💳",
      message: "Your refund has been processed.",
      href: "/dashboard",
      idempotencyKey: `notif:refund:${paymentId}`,
      metadata: { amountRupees, paymentId },
    });
  },

  teacherSaleReceived(teacherId: string, courseTitle: string, teacherEarningsRupees: number, paymentId: string) {
    return sendNotification({
      userId: teacherId,
      type: "sale",
      title: "Course Sale Received 💰",
      message: "New course sale received.",
      href: "/teacher/earnings",
      idempotencyKey: `notif:teacher_sale:${paymentId}`,
      metadata: { courseTitle, teacherEarningsRupees, paymentId },
    });
  },

  payoutRequested(teacherId: string, amountRupees: number, payoutId: string) {
    return sendNotification({
      userId: teacherId,
      type: "payout",
      title: "Payout Submitted 🏦",
      message: "Payout request submitted.",
      href: "/teacher/earnings",
      idempotencyKey: `notif:payout_req:${payoutId}`,
      metadata: { amountRupees, payoutId },
    });
  },
};
