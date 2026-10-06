"use client";

import React, { useState } from "react";
import { X, Wallet, ArrowRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface PayoutRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalanceCents: number;
}

export default function PayoutRequestModal({
  isOpen,
  onClose,
  availableBalanceCents,
}: PayoutRequestModalProps) {
  const router = useRouter();
  const maxAvailable = availableBalanceCents / 100;
  const [amount, setAmount] = useState<string>(maxAvailable > 0 ? maxAvailable.toString() : "0");
  const [method, setMethod] = useState<"upi" | "bank">("upi");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid payout amount.");
      return;
    }

    if (parsedAmount > maxAvailable) {
      setError(`Amount cannot exceed your available balance of ₹${maxAvailable.toLocaleString("en-IN")}.`);
      return;
    }

    if (!details.trim()) {
      setError(method === "upi" ? "Please enter your UPI ID." : "Please enter your Bank Account & IFSC details.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/teacher/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents: Math.round(parsedAmount * 100),
          payoutMethod: method,
          payoutDetails: details.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to submit payout request.");
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSuccess(false);
        onClose();
        router.refresh();
      }, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process payout.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900/95 p-6 shadow-2xl backdrop-blur-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl border border-white/5 bg-white/5 p-1.5 text-zinc-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <CheckCircle2 className="h-8 w-8 animate-bounce" />
            </div>
            <h3 className="text-base font-black text-white">Payout Request Submitted!</h3>
            <p className="text-xs text-zinc-400 max-w-xs">
              Your request has been placed in the review queue. Disbursal to your specified {method.toUpperCase()} account will be processed within 1-2 business days following manual administrator verification.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Wallet className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Request Earnings Payout</h3>
                <p className="text-[11px] text-zinc-400">
                  Available: <span className="font-bold text-emerald-400">₹{maxAvailable.toLocaleString("en-IN")}</span>
                </p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-2xl border border-red-500/20 bg-red-500/5 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Payout Amount */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Withdrawal Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-500">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={maxAvailable}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-950/60 py-2.5 pl-8 pr-4 text-sm font-bold text-white focus:border-emerald-500/50 focus:outline-none"
                />
              </div>
            </div>

            {/* Method Toggle */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Payout Channel
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod("upi")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                    method === "upi"
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                      : "border-white/5 bg-white/[0.02] text-zinc-400 hover:text-white"
                  }`}
                >
                  Instant UPI
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("bank")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                    method === "bank"
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                      : "border-white/5 bg-white/[0.02] text-zinc-400 hover:text-white"
                  }`}
                >
                  Bank Transfer (NEFT)
                </button>
              </div>
            </div>

            {/* Destination Details */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                {method === "upi" ? "UPI ID (VPA)" : "Account Number & IFSC Code"}
              </label>
              <input
                type="text"
                placeholder={method === "upi" ? "e.g. instructor@okhdfcbank" : "A/C: 1234567890 | IFSC: HDFC0001234"}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-zinc-950/60 py-2.5 px-3.5 text-xs text-white placeholder-zinc-500 focus:border-emerald-500/50 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || maxAvailable <= 0}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-xs font-bold text-zinc-950 transition hover:brightness-110 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing Payout...
                </>
              ) : (
                <>
                  <span>Submit Payout Request</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
