import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import {
  DollarSign,
  TrendingUp,
  Percent,
  Wallet,
  ShoppingBag,
  ArrowUpRight,
  Download,
  Calendar,
  Layers,
} from "lucide-react";
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
    .eq("teacher_id", user.id);

  const courses = coursesData ?? [];
  const courseIds = courses.map((c) => c.id);
  const courseMap = new Map(courses.map((c) => [c.id, c.title]));

  // 2. Fetch payments for teacher's courses
  let payments: any[] = [];
  if (courseIds.length > 0) {
    const { data: paymentRows } = await supabase
      .from("payments")
      .select("id, user_id, course_id, amount, total_cents, discount_cents, status, created_at, profiles(full_name, email)")
      .in("course_id", courseIds)
      .order("created_at", { ascending: false });
    payments = paymentRows ?? [];
  }

  // 3. Fetch revenue ledger for teacher
  const { data: ledgerRows } = await supabase
    .from("revenue_ledger")
    .select("id, payment_id, amount_cents, entry_type, direction, commission_rate_bps, created_at")
    .eq("account_type", "teacher")
    .eq("account_id", user.id)
    .order("created_at", { ascending: false });

  const ledger = ledgerRows ?? [];

  // Calculations
  const completedPayments = payments.filter((p) => p.status === "completed" || !p.status);
  
  let grossRevenueCents = 0;
  for (const p of completedPayments) {
    const cents = p.total_cents ?? Math.round((p.amount ?? 0) * 100);
    grossRevenueCents += cents;
  }

  let netEarningsCents = 0;
  if (ledger.length > 0) {
    for (const entry of ledger) {
      if (entry.direction === "credit") {
        netEarningsCents += entry.amount_cents;
      } else if (entry.direction === "debit") {
        netEarningsCents -= entry.amount_cents;
      }
    }
  } else {
    // Default 80% teacher commission if ledger rows haven't populated yet
    netEarningsCents = Math.round(grossRevenueCents * 0.8);
  }

  const platformFeeCents = Math.max(0, grossRevenueCents - netEarningsCents);
  const totalSalesCount = completedPayments.length;

  // Prepare CSV Export Data
  const csvRows = completedPayments.map((p) => {
    const gross = p.total_cents ? p.total_cents / 100 : p.amount ?? 0;
    const fee = Math.round(gross * 0.2 * 100) / 100;
    const net = Math.round((gross - fee) * 100) / 100;
    const student = p.profiles?.full_name || p.profiles?.email || "Student";
    const courseTitle = courseMap.get(p.course_id) || "Course Purchase";
    return {
      "Transaction ID": p.id,
      Date: formatDate(p.created_at),
      Course: courseTitle,
      Student: student,
      "Gross Amount": `$${gross.toFixed(2)}`,
      "Platform Fee": `$${fee.toFixed(2)}`,
      "Net Payout": `$${net.toFixed(2)}`,
      Status: p.status || "Completed",
    };
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card p-5 rounded-3xl border border-white/5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute inset-0 bg-mesh-emerald opacity-20 pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Gross Sales</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="mt-4 relative z-10">
            <span className="text-2xl md:text-3xl font-black text-white">{fmt(grossRevenueCents)}</span>
            <p className="text-[10px] text-zinc-500 mt-1">Total revenue from course purchases</p>
          </div>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-white/5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute inset-0 bg-mesh-cyan opacity-20 pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Net Earnings</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div className="mt-4 relative z-10">
            <span className="text-2xl md:text-3xl font-black text-white">{fmt(netEarningsCents)}</span>
            <p className="text-[10px] text-zinc-500 mt-1">Available balance after platform fee</p>
          </div>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-white/5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute inset-0 bg-mesh-violet opacity-20 pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Platform Fee</span>
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Percent className="w-4 h-4 text-violet-400" />
            </div>
          </div>
          <div className="mt-4 relative z-10">
            <span className="text-2xl md:text-3xl font-black text-white">{fmt(platformFeeCents)}</span>
            <p className="text-[10px] text-zinc-500 mt-1">Platform service & hosting share (20%)</p>
          </div>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-white/5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute inset-0 bg-mesh-orange opacity-20 pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400">Total Orders</span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-orange-400" />
            </div>
          </div>
          <div className="mt-4 relative z-10">
            <span className="text-2xl md:text-3xl font-black text-white">{totalSalesCount}</span>
            <p className="text-[10px] text-zinc-500 mt-1">Verified course purchase events</p>
          </div>
        </div>
      </div>

      {/* Transaction Ledger Table */}
      <section className="glass-card rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Sales & Payout Ledger</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Complete record of course enrollments, commissions, and credits</p>
          </div>
          <span className="text-xs font-semibold text-zinc-400">{completedPayments.length} records</span>
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
              {completedPayments.length > 0 ? (
                completedPayments.map((p) => {
                  const grossCents = p.total_cents ?? Math.round((p.amount ?? 0) * 100);
                  const feeCents = Math.round(grossCents * 0.2);
                  const netCents = grossCents - feeCents;
                  const courseTitle = courseMap.get(p.course_id) || "Course Purchase";
                  const studentName = p.profiles?.full_name || p.profiles?.email?.split("@")[0] || "Student";

                  return (
                    <tr key={p.id} className="text-zinc-300 hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-6 text-zinc-400 font-medium whitespace-nowrap">
                        {formatDate(p.created_at)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white max-w-xs truncate">
                        {courseTitle}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-400">
                        {studentName}
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
                  <td colSpan={7} className="py-12 text-center text-zinc-500 text-xs">
                    No course sales recorded yet. Once students enroll in your paid courses, revenue entries will appear here.
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
