import { createClient } from "@/lib/supabase/server";
import RevenueDashboard from "@/components/admin/RevenueDashboard";
import type { Payment } from "@/components/admin/RevenueDashboard";

export const dynamic = "force-dynamic";

export default async function AdminRevenuePage() {
  const supabase = await createClient();

  const [{ data: payments }, { data: ledgerEntries }] = await Promise.all([
    supabase
      .from("payments")
      .select(
        "id, user_id, course_id, amount, discount_applied, payment_type, status, transaction_id, created_at, coupon_id, profiles(full_name, email), courses(title)"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("revenue_ledger")
      .select("account_type, direction, amount_cents"),
  ]);

  const normalizedPayments: Payment[] = (payments ?? []).map(
    ({ profiles, courses, ...payment }) => ({
      ...payment,
      profiles: profiles[0] ?? null,
      courses: courses[0] ?? null,
    })
  );
  const ledgerTotals = (ledgerEntries ?? []).reduce(
    (totals, entry) => {
      const amount =
        (entry.direction === "debit" ? -1 : 1) *
        Number(entry.amount_cents ?? 0) /
        100;

      if (entry.account_type === "platform") totals.platform += amount;
      if (entry.account_type === "teacher") totals.teachers += amount;
      return totals;
    },
    { platform: 0, teachers: 0 }
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white tracking-tight">Revenue Dashboard</h2>
        <p className="text-xs font-semibold text-zinc-500 mt-1 uppercase tracking-wider">
          Sales analytics, subscription revenue &amp; transaction history
        </p>
      </div>
      <RevenueDashboard
        payments={normalizedPayments}
        ledgerTotals={ledgerTotals}
      />
    </div>
  );
}
