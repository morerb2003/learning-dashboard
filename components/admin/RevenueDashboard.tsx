"use client";

import React, { useMemo, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Crown,
  Tag,
  Users,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────────────── */
export interface Payment {
  id: string;
  user_id: string;
  course_id: string | null;
  amount: number;
  discount_applied: number;
  payment_type: "course_purchase" | "subscription_pro";
  status: "completed" | "pending" | "failed";
  transaction_id: string;
  created_at: string;
  coupon_id: string | null;
  profiles: { full_name: string | null; email: string | null } | null;
  courses: { title: string | null } | null;
}

interface RevenueDashboardProps {
  payments: Payment[];
}

/* ─── Helpers ─────────────────────────────────────────────────────────────────── */
function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
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
export default function RevenueDashboard({ payments }: RevenueDashboardProps) {
  const [sortField, setSortField] = useState<"created_at" | "amount">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [typeFilter, setTypeFilter] = useState<"all" | "course_purchase" | "subscription_pro">("all");

  /* Aggregate stats */
  const completed = useMemo(() => payments.filter((p) => p.status === "completed"), [payments]);
  const totalRevenue = useMemo(() => completed.reduce((sum, p) => sum + Number(p.amount), 0), [completed]);
  const totalDiscount = useMemo(() => completed.reduce((sum, p) => sum + Number(p.discount_applied ?? 0), 0), [completed]);
  const courseRevenue = useMemo(
    () => completed.filter((p) => p.payment_type === "course_purchase").reduce((sum, p) => sum + Number(p.amount), 0),
    [completed]
  );
  const subRevenue = useMemo(
    () => completed.filter((p) => p.payment_type === "subscription_pro").reduce((sum, p) => sum + Number(p.amount), 0),
    [completed]
  );
  const uniqueBuyers = useMemo(() => new Set(completed.map((p) => p.user_id)).size, [completed]);
  const couponsUsed = useMemo(() => completed.filter((p) => p.coupon_id).length, [completed]);

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

  const SortIcon = ({ field }: { field: typeof sortField }) =>
    sortField === field ? (
      sortDir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />
    ) : null;

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={fmt(totalRevenue)}
          icon={DollarSign}
          color="bg-mesh-violet"
          sub={`${completed.length} transactions`}
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
          sub="Pro memberships"
        />
        <StatCard
          label="Unique Buyers"
          value={uniqueBuyers.toString()}
          icon={Users}
          color="bg-mesh-violet"
          sub={`${couponsUsed} coupon uses`}
        />
      </div>

      {/* Charts row */}
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
                { label: "Course Purchases", value: courseRevenue, total: totalRevenue, color: "from-violet-500 to-indigo-500" },
                { label: "Pro Subscriptions", value: subRevenue, total: totalRevenue, color: "from-amber-400 to-orange-500" },
              ].map((item) => {
                const pct = totalRevenue > 0 ? Math.round((item.value / totalRevenue) * 100) : 0;
                return (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-semibold text-zinc-400">
                      <span>{item.label}</span>
                      <span className="text-white">{fmt(item.value)} ({pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 space-y-2 border-t border-white/5">
              <div className="flex justify-between text-[10px] font-semibold text-zinc-500">
                <span>Total Discounts Given</span>
                <span className="text-rose-400">-{fmt(totalDiscount)}</span>
              </div>
              <div className="flex justify-between text-[10px] font-semibold text-zinc-500">
                <span>Coupons Redeemed</span>
                <span className="text-white">{couponsUsed}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-zinc-300 border-t border-white/5 pt-2">
                <span>Net Revenue</span>
                <span className="text-emerald-400">{fmt(totalRevenue)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="relative glass-card rounded-2xl overflow-hidden border border-white/5">
        <div className="absolute inset-0 bg-mesh-violet opacity-20 pointer-events-none" />
        <div className="grain-overlay" />
        <div className="relative z-10">
          {/* Table header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-white/5">
            <div>
              <h3 className="text-sm font-bold text-white">Transaction Log</h3>
              <p className="text-[10px] text-zinc-500">{tableRows.length} records shown</p>
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
                      Date <SortIcon field="created_at" />
                    </button>
                  </th>
                  <th className="text-left px-3 py-3 font-bold">Type</th>
                  <th className="text-left px-3 py-3 font-bold">Course</th>
                  <th className="text-right px-3 py-3 font-bold">
                    <button onClick={() => toggleSort("amount")} className="flex items-center gap-1 ml-auto cursor-pointer hover:text-white transition-colors">
                      Amount <SortIcon field="amount" />
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
    </div>
  );
}
