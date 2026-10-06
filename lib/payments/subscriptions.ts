import { createAdminClient } from "@/lib/supabase/admin";
import { deleteCachedPattern } from "@/lib/cache";

export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "canceled"
  | "expired"
  | "refunded";

export type SubscriptionTier = "free" | "pro" | "premium";

export interface UserSubscriptionEntitlement {
  tier: SubscriptionTier;
  status: SubscriptionStatus | "none";
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  subscriptionId: string | null;
  planName: string;
}

/**
 * Authoritative Server-Side Subscription Entitlement Checker.
 * Validates expiration dates against real server time.
 * If a subscription has passed current_period_end, transitions it to 'expired'
 * and revokes pro profile privileges automatically.
 */
export async function getUserSubscriptionEntitlement(
  userId: string
): Promise<UserSubscriptionEntitlement> {
  const admin = createAdminClient();

  // 1. Fetch user's latest subscription record
  const { data: sub, error } = await admin
    .from("subscriptions")
    .select(
      "id, plan_id, billing_cycle, status, current_period_start, current_period_end, cancel_at_period_end, subscription_plans(code, name)"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !sub) {
    // Sanitize profile if it erroneously had pro/premium without subscription
    await sanitizeProfileTier(userId, "free");
    return {
      tier: "free",
      status: "none",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      subscriptionId: null,
      planName: "Free Explorer",
    };
  }

  const planInfo = (sub.subscription_plans as unknown) as {
    code: SubscriptionTier;
    name: string;
  } | null;

  const planTier = (planInfo?.code as SubscriptionTier) || "free";
  const planName = planInfo?.name || "Pro Membership";
  const periodEnd = new Date(sub.current_period_end);
  const now = new Date();

  // 2. Check if genuinely expired by timestamp
  if (now > periodEnd && sub.status !== "refunded") {
    if (sub.status !== "expired") {
      await admin
        .from("subscriptions")
        .update({ status: "expired", updated_at: now.toISOString() })
        .eq("id", sub.id);

      await sanitizeProfileTier(userId, "free");
      await deleteCachedPattern(`user:${userId}:*`);
    }

    return {
      tier: "free",
      status: "expired",
      currentPeriodEnd: sub.current_period_end,
      cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
      subscriptionId: sub.id,
      planName,
    };
  }

  // 3. Handle refunded status
  if (sub.status === "refunded") {
    await sanitizeProfileTier(userId, "free");
    return {
      tier: "free",
      status: "refunded",
      currentPeriodEnd: sub.current_period_end,
      cancelAtPeriodEnd: false,
      subscriptionId: sub.id,
      planName,
    };
  }

  // 4. Handle canceled status
  if (sub.status === "canceled") {
    // If within period, user still gets access until expiry
    if (now <= periodEnd) {
      return {
        tier: planTier,
        status: "canceled",
        currentPeriodEnd: sub.current_period_end,
        cancelAtPeriodEnd: true,
        subscriptionId: sub.id,
        planName,
      };
    } else {
      await admin
        .from("subscriptions")
        .update({ status: "expired", updated_at: now.toISOString() })
        .eq("id", sub.id);
      await sanitizeProfileTier(userId, "free");
      return {
        tier: "free",
        status: "expired",
        currentPeriodEnd: sub.current_period_end,
        cancelAtPeriodEnd: true,
        subscriptionId: sub.id,
        planName,
      };
    }
  }

  // 5. Active or past_due subscription
  if (sub.status === "active" || sub.status === "past_due") {
    return {
      tier: planTier,
      status: sub.status as SubscriptionStatus,
      currentPeriodEnd: sub.current_period_end,
      cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
      subscriptionId: sub.id,
      planName,
    };
  }

  return {
    tier: "free",
    status: sub.status as SubscriptionStatus,
    currentPeriodEnd: sub.current_period_end,
    cancelAtPeriodEnd: false,
    subscriptionId: sub.id,
    planName,
  };
}

/**
 * Checks whether user has valid Pro or Premium access.
 */
export async function hasProAccess(userId: string): Promise<boolean> {
  const entitlement = await getUserSubscriptionEntitlement(userId);
  return entitlement.tier === "pro" || entitlement.tier === "premium";
}

/**
 * Checks whether user has valid Pro Creator (Premium) access.
 */
export async function hasPremiumAccess(userId: string): Promise<boolean> {
  const entitlement = await getUserSubscriptionEntitlement(userId);
  return entitlement.tier === "premium";
}

/**
 * Cancels a user subscription. Sets cancel_at_period_end so user retains access
 * until the current paid period completes.
 */
export async function cancelUserSubscription(
  userId: string,
  subscriptionId?: string
): Promise<{ success: boolean; message: string }> {
  const admin = createAdminClient();

  let query = admin
    .from("subscriptions")
    .select("id, status, current_period_end")
    .eq("user_id", userId)
    .in("status", ["active", "past_due"]);

  if (subscriptionId) {
    query = query.eq("id", subscriptionId);
  }

  const { data: sub, error } = await query.maybeSingle();

  if (error || !sub) {
    return {
      success: false,
      message: "No active subscription found to cancel.",
    };
  }

  const { error: updateError } = await admin
    .from("subscriptions")
    .update({
      cancel_at_period_end: true,
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", sub.id);

  if (updateError) {
    return {
      success: false,
      message: updateError.message,
    };
  }

  await deleteCachedPattern(`user:${userId}:*`);

  return {
    success: true,
    message: `Subscription cancelled. Access will remain active until ${new Date(
      sub.current_period_end
    ).toLocaleDateString("en-IN")}.`,
  };
}

async function sanitizeProfileTier(userId: string, tier: SubscriptionTier) {
  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ subscription_tier: tier })
    .eq("id", userId);
}
