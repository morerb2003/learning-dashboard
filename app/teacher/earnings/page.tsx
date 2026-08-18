import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { DollarSign, TrendingUp, Percent, Wallet, ShoppingBag } from "lucide-react";
import CsvDownloadButton from "@/components/teacher/CsvDownloadButton";

export const dynamic = "force-dynamic";

function fmt(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default async function TeacherEarningsPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "teacher" && user.role !== "admin")) {
    redirect("/login");
  }

  const supabase = await createClient();

  // 1. Fetch teacher courses
  const { data: coursesData } = await supabase
    .from("courses")
    .select("id, title, price_cents")
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false });

  const courses = coursesData ?? [];
  const courseIds = courses.map((c) => c.id);
  const courseMap = new Map(courses.map((c) => [c.id, c.title]));

  // 2. Fetch payments for teacher's courses, joining buyer profile via user_id FK
  let payments: any[] = [];
  if (courseIds.length > 0) {
    const { data: paymentRows } = await supabase
      .from("payments")
      .select(
        "id, user_id, course_id, amount, total_cents, discount_cents, status, created_at"
      )
      .in("course_id", courseIds)
      .in("status", ["completed", "succeeded"])
      .order("created_at", { ascending: false });
    payments = paymentRows ?? [];
  }

  // 3. Fetch profile display names for each unique buyer
  const buyerIds = [...new Set(payments.map((p) => p.user_id))];
  let profileMap = new Map<string, { name: string; email: string }>();

  if (buyerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", buyerIds);

    for (const p of profiles ?? []) {
      profileMap.set(p.id, {
        name: p.full_name || p.email?.split("@")[0] || "Student",
        email: p.email || "",
      });
    }
  }

  // 4. Fetch revenue ledger for this teacher
  const { data: ledgerRows } = await supabase
    .from("revenue_ledger")
    .select(
      "id, payment_id, amount_cents, entry_type, direction, commission_rate_bps, created_at, available_at"
    )
    .eq("account_type", "teacher")
    .eq("account_id", user.id)
    .order("created_at", { ascending: false });

  const ledger = ledgerRows ?? [];

  // ── Revenue Calculations ────────────────────────────────────────────────────
  let grossRevenueCents = 0;
  for (const p of payments) {
    grossRevenueCents += p.total_cents ?? Math.round((p.amount ?? 0) * 100);
  }

  let netEarningsCents = 0;
  if (ledger.length > 0) {
    for (const entry of ledger) {
      if (entry.direction === "credit") netEarningsCents += entry.amount_cents;
      else if (entry.direction === "debit") netEarningsCents -= entry.amount_cents;
    }
  } else {
    // Fallback: 80% teacher share when ledger hasn't been populated yet
    netEarningsCents = Math.round(grossRevenueCents * 0.8);
  }

  const platformFeeCents = Math.max(0, grossRevenueCents - netEarningsCents);
  const totalSalesCount = payments.length;

  // ── Monthly timeline (last 6 months) ────────────────────────────────────────
  const now = new Date();
  const monthlyTimeline = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const label = d.toLocaleString("en", { month: "short", year: "2-digit" });
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { label, monthStr, grossCents: 0, count: 0 };
  });

  for (const p of payments) {
    const monthStr = p.created_at.slice(0, 7); // "YYYY-MM"
    const bucket = monthlyTimeline.find((m) => m.monthStr === monthStr);
    if (bucket) {
      bucket.grossCents += p.total_cents ?? Math.round((p.amount ?? 0) * 100);
      bucket.count += 1;
    }
  }

  const maxMonthCents = Math.max(...monthlyTimeline.map((m) => m.grossCents), 1);

  // ── CSV rows ─────────────────────────────────────────────────────────────────
  const csvRows = payments.map((p) => {
    const gross = (p.total_cents ?? Math.round((p.amount ?? 0) * 100)) / 100;
    const fee = +(gross * 0.2).toFixed(2);
    const net = +(gross - fee).toFixed(2);
    const buyer = profileMap.get(p.user_id);
    return {
      "Transaction ID": p.id,
      Date: formatDate(p.created_at),
      Course: courseMap.get(p.course_id) || "Unknown Course",
      Student: buyer?.name ?? "Student",
      Email: buyer?.email ?? "",
      "Gross ($)": gross.toFixed(2),
      "Platform Fee ($)": fee.toFixed(2),
      "Net Payout ($)": net.toFixed(2),
      Status: p.status || "completed",
    };
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
            <DollarSign className="h-3.5 w-3.5" />
            <span>Financial Control</span>
          </div>
          <h1 className="mt-2 text-2xl md:text-3xl font-black tracking-tight text-white">
            Earnings & Revenue Ledger
          </h1>
          <p className="mt-1 text-xs text-zinc-400 font-medium">
            Monitor course sales, platform commissions, net earnings, and payout records.
          </p>
        </div>

        {csvRows.length > 0 && (
          <CsvDownloadButton
            filename={`teacher-earnings-${new Date().toISOString().slice(0, 10)}.csv`}
            rows={csvRows}
            label="Export Ledger CSV"
          />
        )}
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            label: "Gross Sales",
            value: fmt(grossRevenueCents),
            sub: "Total revenue from course purchases",
            icon: ShoppingBag,
            color: "emerald",
          },
          {
            label: "Net Earnings",
            value: fmt(netEarningsCents),
            sub: "Available balance after platform fee",
            icon: Wallet,
            color: "cyan",
          },
          {
            label: "Platform Fee (20%)",
            value: fmt(platformFeeCents),
            sub: "Platform service & hosting share",
            icon: Percent,
            color: "violet",
          },
          {
            label: "Total Orders",
            value: String(totalSalesCount),
            sub: "Verified course purchase events",
            icon: TrendingUp,
            color: "orange",
          },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div
            key={label}
            className={`glass-card p-5 rounded-3xl border border-white/5 relative overflow-hidden flex flex-col justify-between`}
          >
            <div
              className={`absolute inset-0 bg-mesh-${color} opacity-20 pointer-events-none`}
            />
            <div className="flex items-center justify-between relative z-10">
              <span
                className={`text-[10px] font-bold uppercase tracking-widest text-${color}-400`}
              >
                {label}
              </span>
              <div
                className={`w-8 h-8 rounded-xl bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center`}
              >
                <Icon className={`w-4 h-4 text-${color}-400`} />
              </div>
            </div>
            <div className="mt-4 relative z-10">
              <span className="text-2xl md:text-3xl font-black text-white">
                {value}
              </span>
              <p className="text-[10px] text-zinc-500 mt-1">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Revenue Timeline (last 6 months) ───────────────────────────────── */}
      <section className="glass-card rounded-3xl border border-white/5 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-bold text-white">Revenue Timeline</h2>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              Monthly gross sales — last 6 months
            </p>
          </div>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            {fmt(grossRevenueCents)} total
          </span>
        </div>

        <div className="flex items-end gap-2 h-28">
          {monthlyTimeline.map((m) => {
            const pct = Math.round((m.grossCents / maxMonthCents) * 100);
            const isCurrentMonth = m.monthStr === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
            return (
              <div key={m.monthStr} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[9px] font-bold text-zinc-500">
                  {m.grossCents > 0 ? fmt(m.grossCents) : ""}
                </span>
                <div className="w-full flex flex-col justify-end h-16 rounded-t-lg overflow-hidden">
                  <div
                    className={`w-full rounded-t-lg transition-all ${
                      isCurrentMonth
                        ? "bg-gradient-to-t from-emerald-600 to-emerald-400"
                        : "bg-gradient-to-t from-violet-700 to-violet-500"
                    }`}
                    style={{ height: `${Math.max(pct, m.grossCents > 0 ? 8 : 2)}%` }}
                  />
                </div>
                <span className="text-[9px] font-semibold text-zinc-500">{m.label}</span>
                {m.count > 0 && (
                  <span className="text-[8px] font-bold text-zinc-600">
                    {m.count} sale{m.count !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Transaction Ledger Table ────────────────────────────────────────── */}
      <section className="glass-card rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Sales & Payout Ledger</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Complete record of course enrollments, commissions, and credits
            </p>
          </div>
          <span className="text-xs font-semibold text-zinc-400">
            {payments.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-[9px] font-bold uppercase tracking-widest text-zinc-500 bg-white/[0.01]">
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4 text-right">Gross</th>
                <th className="py-3 px-4 text-right">Platform Fee</th>
                <th className="py-3 px-4 text-right">Net Earned</th>
                <th className="py-3 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payments.length > 0 ? (
                payments.map((p) => {
                  const grossCents =
                    p.total_cents ?? Math.round((p.amount ?? 0) * 100);
                  const feeCents = Math.round(grossCents * 0.2);
                  const netCents = grossCents - feeCents;
                  const courseTitle =
                    courseMap.get(p.course_id) || "Course Purchase";
                  const buyer = profileMap.get(p.user_id);
                  const studentName = buyer?.name ?? "Student";

                  return (
                    <tr
                      key={p.id}
                      className="text-zinc-300 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3.5 px-6 whitespace-nowrap">
                        <p className="text-zinc-300 font-medium">
                          {formatDate(p.created_at)}
                        </p>
                        <p className="text-[9px] text-zinc-600 mt-0.5">
                          {relativeTime(p.created_at)}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white max-w-[180px] truncate">
                        {courseTitle}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-zinc-300 font-medium">{studentName}</p>
                        {buyer?.email && (
                          <p className="text-[9px] text-zinc-600 mt-0.5 truncate max-w-[140px]">
                            {buyer.email}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right text-zinc-300 font-medium">
                        {fmt(grossCents)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-violet-400 font-medium">
                        -{fmt(feeCents)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-400">
                        {fmt(netCents)}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                          Credited
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="py-16 text-center text-zinc-500 text-xs"
                  >
                    <DollarSign className="h-8 w-8 mx-auto mb-3 text-zinc-700" />
                    No course sales recorded yet.
                    <br />
                    Once students enroll in your paid courses, revenue entries
                    will appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
