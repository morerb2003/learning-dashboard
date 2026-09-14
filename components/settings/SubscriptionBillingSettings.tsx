"use client";

import React, { useState } from "react";
import { Check, CreditCard, Download, ExternalLink, ShieldCheck, Zap } from "lucide-react";

export default function SubscriptionBillingSettings() {
  const [couponCode, setCouponCode] = useState("");
  const [couponStatus, setCouponStatus] = useState<string | null>(null);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode) return;
    if (couponCode.toUpperCase() === "WELCOME100") {
      setCouponStatus("Coupon WELCOME100 applied! 100% off next billing cycle.");
    } else {
      setCouponStatus(`Coupon '${couponCode}' is valid for 20% discount on next renewal.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 md:p-8 rounded-3xl glass-card border border-white/5 space-y-8">
        {/* Active Plan Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-zinc-900 border border-cyan-500/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                Active &bull; Auto-Renews
              </span>
              <span className="text-xs font-bold text-zinc-400">Annual Membership</span>
            </div>
            <h3 className="text-2xl font-black text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-cyan-400" /> AURA Pro Learner
            </h3>
            <p className="text-xs text-zinc-300">
              Unlimited course enrollments, verified completion certificates, and direct instructor Q&A access.
            </p>
          </div>

          <div className="text-right space-y-2 self-start md:self-auto">
            <div className="text-2xl font-black text-white">$149<span className="text-xs font-normal text-zinc-400">/year</span></div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => alert("Subscription upgrade options: Pro Plus ($249/yr) with 1-on-1 mentorship.")}
                className="px-4 py-2 rounded-xl bg-cyan-400 text-zinc-950 text-xs font-bold hover:brightness-110 transition"
              >
                Upgrade Plan
              </button>
              <button
                type="button"
                onClick={() => alert("To cancel, please click 'Confirm Cancellation' in the confirmation prompt.")}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-bold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="pt-6 border-t border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-violet-400" /> Saved Payment Methods
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">Primary cards utilized for membership renewal.</p>
            </div>
            <button
              type="button"
              onClick={() => alert("Payment gateway integration modal opened.")}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition"
            >
              + Add Card
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-7 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] font-bold font-mono text-zinc-300">
                VISA
              </div>
              <div>
                <div className="text-xs font-bold text-white">Visa ending in 4242</div>
                <div className="text-[10px] text-zinc-400">Expires 08/2028 &bull; Default payment method</div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
              Primary
            </span>
          </div>
        </div>

        {/* Apply Coupon Form */}
        <form onSubmit={handleApplyCoupon} className="pt-6 border-t border-white/5 space-y-3">
          <h4 className="text-sm font-bold text-white">Promotional Coupon or Referral Reward</h4>
          <div className="flex gap-2 max-w-md">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="e.g. WELCOME100"
              className="flex-1 h-10 px-4 rounded-xl bg-zinc-900/60 border border-white/10 text-xs text-white uppercase focus:outline-none focus:border-cyan-400/50"
            />
            <button
              type="submit"
              className="px-5 h-10 rounded-xl bg-cyan-400 text-zinc-950 font-bold text-xs hover:brightness-110 transition"
            >
              Apply Code
            </button>
          </div>
          {couponStatus && (
            <p className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> {couponStatus}
            </p>
          )}
        </form>

        {/* Invoices & History */}
        <div className="pt-6 border-t border-white/5 space-y-3">
          <h4 className="text-sm font-bold text-white">Billing Receipts & History</h4>
          <div className="divide-y divide-white/5 border border-white/5 rounded-2xl overflow-hidden bg-zinc-900/30">
            {[
              { id: "INV-2025-001", date: "Oct 24, 2025", amount: "$149.00", status: "Paid", plan: "AURA Pro (Annual)" },
              { id: "INV-2024-089", date: "Oct 24, 2024", amount: "$149.00", status: "Paid", plan: "AURA Pro (Annual)" },
            ].map((inv) => (
              <div key={inv.id} className="p-4 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white">{inv.plan}</div>
                  <div className="text-[10px] text-zinc-400">{inv.id} &bull; {inv.date}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-white">{inv.amount}</span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    {inv.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => alert(`Downloading PDF invoice for ${inv.id}...`)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition"
                    title="Download Invoice"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
