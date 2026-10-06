"use client";

import React, { useMemo, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Crown,
  Tag,
  Users,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";

/* ─── Types ──────────────────────────────────────────────────────────────────── */
export type PaymentStatus = "completed" | "pending" | "failed" | "refunded";

export interface Payment {
  id: string;
  user_id: string;
  course_id: string | null;
  amount: number;
  discount_applied: number;
  payment_type: "course_purchase" | "subscription_pro";
  status: PaymentStatus;
  transaction_id: string;
  created_at: string;
  coupon_id: string | null;
  profiles: { full_name: string | null; email: string | null } | null;
  courses: { title: string | null } | null;
}

export interface ServerMetrics {
  totalGrossSales: number;
  platformRevenue: number;
  teacherEarnings: number;
  totalTransactions: number;
  successfulPayments: number;
  failedPayments: number;
  refundsCount: number;
  refundsTotal: number;
  activeSubscriptionsCount: number;
  monthlyRecurringRevenue: number;
  courseSalesRevenue: number;
  subscriptionRevenue: number;
  pendingTeacherPayoutsCount: number;
  pendingTeacherPayoutsTotal: number;
}

export interface AdminPayoutItem {
  id: string;
  teacher_id: string;
  amount_cents: number;
  currency: string;
  payout_method: string;
  payout_details: string;
  status: "pending" | "approved" | "paid" | "rejected";
  created_at: string;
  teacher: { full_name: string | null; email: string | null } | null;
}

interface RevenueDashboardProps {
  payments: Payment[];
  ledgerTotals: {
    platform: number;
    teachers: number;
  };
  serverMetrics?: ServerMetrics;
  payouts?: AdminPayoutItem[];
}

/* ─── Helpers ─────────────────────────────────────────────────────────────────── */
function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function renderSortIcon(
  field: "created_at" | "amount",
  sortField: "created_at" | "amount",
  sortDir: "asc" | "desc"
) {
  if (sortField !== field) return null;
  return sortDir === "desc" ? (
    <ChevronDown className="w-3 h-3" />
  ) : (
    <ChevronUp className="w-3 h-3" />
  );
}

function buildMonthlySeries(payments: Payment[]) {
  const map: Record<string, number> = {};
  for (const p of payments) {
    if (p.status !== "completed") continue;
    const key = p.created_at.slice(0, 7); // "YYYY-MM"
    map[key] = (map[key] ?? 0) + Number(p.amount);
  }
  const sorted = Object.keys(map).sort();
  return sorted.map((k) => ({
    label: new Date(`${k}-01`).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    value: map[k],
  }));
}

/* ─── Mini Bar Chart ──────────────────────────────────────────────────────────── */
function BarChart({ data }: { data: { label: string; value: number }[] }) {
  if (!data.length) return <p className="text-xs text-zinc-500 py-4 text-center">No revenue data yet.</p>;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1.5 h-32 w-full">
      {data.map((d) => (
        <div key={d.label} className="flex flex-col items-center gap-1 flex-1 min-w-0 group">
          <span className="text-[9px] text-zinc-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {fmt(d.value)}
          </span>
          <div
            className="w-full rounded-t-md bg-gradient-to-t from-violet-600 to-indigo-400 transition-all duration-700"
            style={{ height: `${Math.max(4, (d.value / max) * 112)}px` }}
          />
          <span className="text-[8px] text-zinc-600 font-semibold truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Stat Card ───────────────────────────────────────────────────────────────── */
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  sub?: string;
}) {
  return (
    <div className={`relative glass-card rounded-2xl overflow-hidden p-5 border border-white/5`}>
      <div className={`absolute inset-0 ${color} opacity-40 pointer-events-none`} />
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-black text-white mt-1">{value}</p>
          {sub && <p className="text-[10px] text-zinc-500 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10`}>
          <Icon className="w-5 h-5 text-violet-300" />
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────────────── */
export default function RevenueDashboard({
  payments,
  ledgerTotals,
  serverMetrics,
  payouts = [],
}: RevenueDashboardProps) {
  const router = useRouter();
  const [sortField, setSortField] = useState<"created_at" | "amount">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [typeFilter, setTypeFilter] = useState<"all" | "course_purchase" | "subscription_pro">("all");
  const [processingPayoutId, setProcessingPayoutId] = useState<string | null>(null);

  /* Fallback or authoritative server metrics */
  const completed = useMemo(() => payments.filter((p) => p.status === "completed"), [payments]);
  const grossSales = serverMetrics?.totalGrossSales ?? completed.reduce((sum, p) => sum + Number(p.amount), 0);
  const courseRevenue = serverMetrics?.courseSalesRevenue ?? completed.filter((p) => p.payment_type === "course_purchase").reduce((sum, p) => sum + Number(p.amount), 0);
  const subRevenue = serverMetrics?.subscriptionRevenue ?? completed.filter((p) => p.payment_type === "subscription_pro").reduce((sum, p) => sum + Number(p.amount), 0);
  const platformEarnings = serverMetrics?.platformRevenue ?? ledgerTotals.platform;
  const teacherEarnings = serverMetrics?.teacherEarnings ?? ledgerTotals.teachers;
  const mrr = serverMetrics?.monthlyRecurringRevenue ?? 0;
  const activeSubsCount = serverMetrics?.activeSubscriptionsCount ?? 0;
  const refundsTotal = serverMetrics?.refundsTotal ?? 0;
  const refundsCount = serverMetrics?.refundsCount ?? 0;
  const failedCount = serverMetrics?.failedPayments ?? payments.filter((p) => p.status === "failed").length;
  const pendingPayoutsCount = serverMetrics?.pendingTeacherPayoutsCount ?? payouts.filter((p) => p.status === "pending").length;
  const pendingPayoutsTotal = serverMetrics?.pendingTeacherPayoutsTotal ?? payouts.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount_cents / 100, 0);

  const monthlySeries = useMemo(() => buildMonthlySeries(payments), [payments]);

  /* Filtered & sorted table rows */
  const tableRows = useMemo(() => {
    const filtered = typeFilter === "all" ? payments : payments.filter((p) => p.payment_type === typeFilter);
    return [...filtered].sort((a, b) => {
      const va = sortField === "amount" ? Number(a.amount) : new Date(a.created_at).getTime();
      const vb = sortField === "amount" ? Number(b.amount) : new Date(b.created_at).getTime();
      return sortDir === "asc" ? va - vb : vb - va;
    });
  }, [payments, typeFilter, sortField, sortDir]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const handleUpdatePayoutStatus = async (
    payoutId: string,
    status: "approved" | "paid" | "rejected"
  ) => {
    setProcessingPayoutId(payoutId);
    try {
      const res = await fetch("/api/admin/payouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId, status }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to update payout.");
      } else {
        router.refresh();
      }
    } catch {
      alert("Failed to update payout.");
    } finally {
      setProcessingPayoutId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Primary Monetization KPI Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Total Gross Sales"
          value={fmt(grossSales)}
          icon={DollarSign}
          color="bg-mesh-violet"
          sub={`${completed.length} successful payments`}
        />
        <StatCard
          label="Platform Revenue (20%)"
          value={fmt(platformEarnings)}
          icon={TrendingUp}
          color="bg-mesh-cyan"
          sub="Net platform commission"
        />
        <StatCard
          label="Teacher Earnings (80%)"
          value={fmt(teacherEarnings)}
          icon={Users}
          color="bg-mesh-orange"
          sub="Accrued instructor share"
        />
        <StatCard
          label="Monthly Recurring (MRR)"
          value={fmt(mrr)}
          icon={Crown}
          color="bg-mesh-violet"
          sub={`${activeSubsCount} active subscriptions`}
        />
        <StatCard
          label="Course Sales"
          value={fmt(courseRevenue)}
          icon={ShoppingCart}
          color="bg-mesh-cyan"
          sub="One-time purchases"
        />
        <StatCard
          label="Subscription Revenue"
          value={fmt(subRevenue)}
          icon={Crown}
          color="bg-mesh-orange"
          sub="Pro / Pro Creator sales"
        />
      </div>

      {/* ── Secondary Intelligence & Risk Grid ──────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Transactions"
          value={payments.length.toString()}
          icon={DollarSign}
          color="bg-mesh-violet"
          sub={`${completed.length} success &bull; ${failedCount} failed`}
        />
        <StatCard
          label="Failed Payments"
          value={failedCount.toString()}
          icon={AlertTriangle}
          color="bg-mesh-orange"
          sub="Failed attempts &amp; cancellations"
        />
        <StatCard
          label="Refunds Processed"
          value={fmt(refundsTotal)}
          icon={RotateCcw}
          color="bg-mesh-cyan"
          sub={`${refundsCount} refunds under policy`}
        />
        <StatCard
          label="Pending Teacher Payouts"
          value={fmt(pendingPayoutsTotal)}
          icon={Clock}
          color="bg-mesh-violet"
          sub={`${pendingPayoutsCount} requests awaiting review`}
        />
      </div>

      {/* ── Charts & Revenue Mix row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Revenue Bar Chart */}
        <div className="lg:col-span-2 relative glass-card rounded-2xl overflow-hidden p-5 border border-white/5">
          <div className="absolute inset-0 bg-mesh-violet opacity-30 pointer-events-none" />
          <div className="grain-overlay" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Monthly Revenue</h3>
                <p className="text-[10px] text-zinc-500">Completed transactions grouped by month</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{monthlySeries.length} months</span>
              </div>
            </div>
            <BarChart data={monthlySeries} />
          </div>
        </div>

        {/* Revenue split */}
        <div className="relative glass-card rounded-2xl overflow-hidden p-5 border border-white/5 space-y-4">
          <div className="absolute inset-0 bg-mesh-cyan opacity-25 pointer-events-none" />
          <div className="grain-overlay" />
          <div className="relative z-10 space-y-4">
            <h3 className="text-sm font-bold text-white">Revenue Mix</h3>
            <div className="space-y-3">
              {[
                { label: "Course Purchases", value: courseRevenue, total: grossSales, color: "from-violet-500 to-indigo-500" },
                { label: "Pro Subscriptions", value: subRevenue, total: grossSales, color: "from-amber-400 to-orange-500" },
              ].map((item) => {
                const pct = grossSales > 0 ? Math.round((item.value / grossSales) * 100) : 0;
                return (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-400">{item.label}</span>
                      <span className="text-white">{fmt(item.value)} ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${item.color} transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-white/5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400 font-semibold">Teacher Commission Split</span>
                <span className="font-bold text-emerald-400">80% Teacher / 20% AURA</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">
                Platform fee automatically ledgered in minor paise units on every sale.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Pending Teacher Payouts Review Section ─────────────────────────────── */}
      {payouts.length > 0 && (
        <div className="relative glass-card rounded-2xl overflow-hidden p-5 border border-white/5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white">Teacher Payout Requests Review</h3>
              <p className="text-[10px] text-zinc-500">
                Manual review queue. Disburse via UPI/NEFT before marking paid.
              </p>
            </div>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full w-fit">
              Manual Transfer Workflow
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-white/5 text-zinc-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-2.5 font-bold">Teacher</th>
                  <th className="text-left px-3 py-2.5 font-bold">Amount</th>
                  <th className="text-left px-3 py-2.5 font-bold">Method</th>
                  <th className="text-left px-3 py-2.5 font-bold">Details</th>
                  <th className="text-left px-3 py-2.5 font-bold">Status</th>
                  <th className="text-right px-4 py-2.5 font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white truncate max-w-[140px]">
                        {p.teacher?.full_name || "Instructor"}
                      </p>
                      <p className="text-zinc-600 text-[9px] truncate">{p.teacher?.email || p.teacher_id.slice(0, 8)}</p>
                    </td>
                    <td className="px-3 py-3 font-black text-white whitespace-nowrap">
                      {fmt(p.amount_cents / 100)}
                    </td>
                    <td className="px-3 py-3 uppercase font-bold text-zinc-400">
                      {p.payout_method}
                    </td>
                    <td className="px-3 py-3 text-zinc-300 truncate max-w-[180px]">
                      {p.payout_details}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          p.status === "paid"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : p.status === "approved"
                            ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                            : p.status === "pending"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.status === "pending" || p.status === "approved" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          {processingPayoutId === p.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                          ) : (
                            <>
                              <button
                                onClick={() => handleUpdatePayoutStatus(p.id, "paid")}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold hover:bg-emerald-500/20 transition"
                              >
                                Mark Paid
                              </button>
                              <button
                                onClick={() => handleUpdatePayoutStatus(p.id, "rejected")}
                                className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-[10px] font-bold hover:bg-red-500/20 transition"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-zinc-600 text-[10px]">Settled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Transactions Table ─────────────────────────────────────────────────── */}
      <div className="relative glass-card rounded-2xl overflow-hidden border border-white/5">
        <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white">Payment Transactions Ledger</h3>
            <p className="text-[10px] text-zinc-500">Audited transaction records and receipt status</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
              className="rounded-xl border border-white/5 bg-zinc-950/60 px-3 py-1.5 text-[10px] font-semibold text-zinc-300 outline-none"
            >
              <option value="all">All types</option>
              <option value="course_purchase">Course Purchases</option>
              <option value="subscription_pro">Subscriptions</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-white/5 text-zinc-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-bold">User</th>
                <th className="text-left px-3 py-3 font-bold">
                  <button onClick={() => toggleSort("created_at")} className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors">
                    Date {renderSortIcon("created_at", sortField, sortDir)}
                  </button>
                </th>
                <th className="text-left px-3 py-3 font-bold">Type</th>
                <th className="text-left px-3 py-3 font-bold">Course / Plan</th>
                <th className="text-right px-3 py-3 font-bold">
                  <button onClick={() => toggleSort("amount")} className="flex items-center gap-1 ml-auto cursor-pointer hover:text-white transition-colors">
                    Amount {renderSortIcon("amount", sortField, sortDir)}
                  </button>
                </th>
                <th className="text-right px-5 py-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {tableRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-zinc-600">No transactions recorded yet.</td>
                </tr>
              )}
              {tableRows.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-white truncate max-w-[140px]">
                      {p.profiles?.full_name ?? "Unknown"}
                    </p>
                    <p className="text-zinc-600 text-[9px] truncate">{p.profiles?.email ?? p.user_id.slice(0, 8)}</p>
                  </td>
                  <td className="px-3 py-3 text-zinc-400 whitespace-nowrap">
                    {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-3 py-3">
                    {p.payment_type === "subscription_pro" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-300 text-[9px] font-bold uppercase">
                        <Crown className="w-2.5 h-2.5" /> Pro
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-300 text-[9px] font-bold uppercase">
                        <ShoppingCart className="w-2.5 h-2.5" /> Course
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-zinc-400 max-w-[120px]">
                    <span className="truncate block">{p.courses?.title ?? (p.payment_type === "subscription_pro" ? "Pro Membership" : "—")}</span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <p className="font-black text-white">{fmt(Number(p.amount))}</p>
                    {Number(p.discount_applied) > 0 && (
                      <p className="text-[9px] text-zinc-600 flex items-center justify-end gap-0.5">
                        <Tag className="w-2 h-2" /> -{fmt(Number(p.discount_applied))}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        p.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : p.status === "refunded"
                          ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                          : p.status === "pending"
                          ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
