import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import PricingWorkspace from "@/components/pricing/PricingWorkspace";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pricing & Memberships | AURA Learning Dashboard",
  description:
    "Explore transparent membership plans for AURA Pro and Pro Creator. Master engineering skills with unlimited courses, live AI tutoring, and verified certificates.",
};

export default async function PricingPage() {
  const user = await getCurrentUser();
  let currentTier: "free" | "pro" | "premium" = "free";

  if (user) {
    const supabase = await createClient();
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("subscription_plans(code)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    const planCode = (sub?.subscription_plans as any)?.code;
    if (planCode === "pro" || planCode === "premium") {
      currentTier = planCode;
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-between">
      <PublicHeader user={user ? { email: user.email || "", role: user.role } : null} />
      <main className="flex-1">
        <PricingWorkspace
          currentTier={currentTier}
          userEmail={user?.email}
          userName={user?.full_name}
        />
      </main>
      <PublicFooter />
    </div>
  );
}
