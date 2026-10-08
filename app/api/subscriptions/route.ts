import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/roles";

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. Fetch available plans
    const { data: plans } = await supabase
      .from("subscription_plans")
      .select("*")
      .order("monthly_price_cents", { ascending: true });

    // 2. Fetch user's active subscription if authenticated
    const user = await getCurrentUser();
    let currentSubscription = null;

    if (user) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("id, plan_id, billing_cycle, status, current_period_start, current_period_end, cancel_at_period_end, subscription_plans(code, name)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      currentSubscription = sub ?? null;
    }

    return NextResponse.json({
      plans: plans ?? [
        {
          code: "free",
          name: "Free",
          monthly_price_cents: 0,
          yearly_price_cents: 0,
          features: ["Access to free courses", "Community discussions"],
        },
        {
          code: "pro",
          name: "Pro",
          monthly_price_cents: 49900,
          yearly_price_cents: 499000,
          currency: "INR",
          features: ["All premium courses", "Verified certificates", "Unlimited AI Tutor", "Quiz assessments"],
        },
        {
          code: "premium",
          name: "Premium",
          monthly_price_cents: 99900,
          yearly_price_cents: 999000,
          currency: "INR",
          features: ["Everything in Pro", "Direct 1-on-1 teacher messaging", "Downloadable source codes", "Unlimited AI Quiz Generator", "Priority support"],
        },
      ],
      currentSubscription,
      userTier: user ? user.subscription_tier || "free" : null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
