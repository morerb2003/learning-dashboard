import { createClient } from "@/lib/supabase/server";
import RevenueDashboard from "@/components/admin/RevenueDashboard";
import type { Payment, ServerMetrics, AdminPayoutItem } from "@/components/admin/RevenueDashboard";

export const dynamic = "force-dynamic";

export default async function AdminRevenuePage() {
  const supabase = await createClient();

  const [
    { data: payments },
    { data: ledgerEntries },
    { data: activeSubs },
    { data: refundsData },
    { data: payoutsData },
  ] = await Promise.all([
    supabase
      .from("payments")
      .select(
        "id, user_id, course_id, amount, total_cents, discount_applied, payment_type, status, transaction_id, created_at, coupon_id, profiles(full_name, email), courses(title)"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("revenue_ledger")
      .select("account_type, direction, amount_cents"),
    supabase
      .from("subscriptions")
      .select("id, billing_cycle, subscription_plans(code, monthly_price_cents, yearly_price_cents)")
      .eq("status", "active"),
    supabase
      .from("payment_refunds")
      .select("id, amount_cents, status"),
    supabase
      .from("teacher_payouts")
      .select("id, teacher_id, amount_cents, currency, payout_method, payout_details, status, created_at, profiles(full_name, email)")
      .order("created_at", { ascending: false }),
  ]);

  const rawPayments = payments ?? [];
  const normalizedPayments: Payment[] = rawPayments.map(
    ({ profiles, courses, ...payment }) => ({
      ...payment,
      profiles: Array.isArray(profiles) ? profiles[0] ?? null : (profiles as any) ?? null,
      courses: Array.isArray(courses) ? courses[0] ?? null : (courses as any) ?? null,
    })
  );

  const ledgerTotals = (ledgerEntries ?? []).reduce(
    (totals, entry) => {
      const amount =
        ((entry.direction === "debit" ? -1 : 1) *
        Number(entry.amount_cents ?? 0)) /
        100;

      if (entry.account_type === "platform") totals.platform += amount;
      if (entry.account_type === "teacher") totals.teachers += amount;
      return totals;
    },
    { platform: 0, teachers: 0 }
  );

  // Authoritative server-side metrics calculation
  const completedPayments = normalizedPayments.filter((p) => p.status === "completed");
  const failedPayments = normalizedPayments.filter((p) => p.status === "failed");
  const refundedPayments = normalizedPayments.filter((p) => p.status === "refunded");

  const totalGrossSales = completedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const courseSalesRevenue = completedPayments
    .filter((p) => p.payment_type === "course_purchase")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const subscriptionRevenue = completedPayments
    .filter((p) => p.payment_type === "subscription_pro")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  // MRR calculation based on active subscriptions
  let monthlyRecurringRevenue = 0;
  for (const sub of activeSubs ?? []) {
    const plan = (sub.subscription_plans as any) as {
      monthly_price_cents?: number;
      yearly_price_cents?: number;
    } | null;
    if (plan) {
      if (sub.billing_cycle === "monthly") {
        monthlyRecurringRevenue += (plan.monthly_price_cents ?? 0) / 100;
      } else {
        // Annual normalized to monthly
        monthlyRecurringRevenue += ((plan.yearly_price_cents ?? 0) / 100) / 12;
      }
    }
  }

  const refundsCount = (refundsData?.length || 0) + refundedPayments.length;
  const refundsTotal =
    (refundsData ?? []).reduce((sum, r) => sum + Number(r.amount_cents || 0) / 100, 0) ||
    refundedPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  const pendingPayoutsList: AdminPayoutItem[] = (payoutsData ?? []).map((p: any) => ({
    id: p.id,
    teacher_id: p.teacher_id,
    amount_cents: p.amount_cents,
    currency: p.currency,
    payout_method: p.payout_method,
    payout_details: p.payout_details,
    status: p.status,
    created_at: p.created_at,
    teacher: Array.isArray(p.profiles) ? p.profiles[0] ?? null : p.profiles ?? null,
  }));

  const pendingPayouts = pendingPayoutsList.filter((p) => p.status === "pending");
  const pendingTeacherPayoutsTotal = pendingPayouts.reduce(
    (sum, p) => sum + p.amount_cents / 100,
    0
  );

  const serverMetrics: ServerMetrics = {
    totalGrossSales,
    platformRevenue: ledgerTotals.platform,
    teacherEarnings: ledgerTotals.teachers,
    totalTransactions: normalizedPayments.length,
    successfulPayments: completedPayments.length,
    failedPayments: failedPayments.length,
    refundsCount,
    refundsTotal,
    activeSubscriptionsCount: (activeSubs ?? []).length,
    monthlyRecurringRevenue: Math.round(monthlyRecurringRevenue * 100) / 100,
    courseSalesRevenue,
    subscriptionRevenue,
    pendingTeacherPayoutsCount: pendingPayouts.length,
    pendingTeacherPayoutsTotal,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white tracking-tight">Revenue Dashboard</h2>
        <p className="text-xs font-semibold text-zinc-500 mt-1 uppercase tracking-wider">
          Audited sales analytics, subscription MRR, refunds &amp; teacher payouts
        </p>
      </div>
      <RevenueDashboard
        payments={normalizedPayments}
        ledgerTotals={ledgerTotals}
        serverMetrics={serverMetrics}
        payouts={pendingPayoutsList}
      />
    </div>
  );
}
