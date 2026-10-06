"use client";

import React, { useState } from "react";
import { X, ShieldCheck, Tag, Sparkles, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { applyCouponAction } from "@/lib/course/payment";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title: string;
  price: number;
  courseId?: string; // If undefined, it is a subscription purchase
  planCode?: "pro" | "premium";
  billingCycle?: "monthly" | "yearly";
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void | Promise<void>;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, callback: () => void) => void;
    };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutModal({
  isOpen,
  onClose,
  onSuccess,
  title,
  price,
  courseId,
  planCode = "pro",
  billingCycle = "monthly",
}: CheckoutModalProps) {
  const [couponCode, setCouponCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState<number | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  // Approximate client preview (server calculates authoritative quote)
  const discountAmount = discountPercent ? (price * discountPercent) / 100 : 0;
  const finalPrice = Math.max(0, price - discountAmount);

  const handleApplyCoupon = async () => {
    setCouponError(null);
    setCouponSuccess(null);
    if (!couponCode.trim()) return;

    try {
      const res = await applyCouponAction(couponCode);
      if (res.success && res.discountPercent) {
        setDiscountPercent(res.discountPercent);
        setCouponSuccess(`Applied! ${res.discountPercent}% discount`);
      } else {
        setCouponError(res.error ?? "Invalid coupon code");
        setDiscountPercent(null);
      }
    } catch {
      setCouponError("Unable to apply coupon");
    }
  };

  const handleStartCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);
    setIsProcessing(true);

    try {
      // 1. Create trusted server payment intent & Razorpay order
      const res = await fetch("/api/payments/intents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseType: courseId ? "course" : "subscription",
          courseId: courseId || undefined,
          planCode: courseId ? undefined : planCode,
          billingCycle: courseId ? undefined : billingCycle,
          couponCode: couponCode.trim() || undefined,
          idempotencyKey: crypto.randomUUID(),
        }),
      });

      const intentData = await res.json();

      if (!res.ok) {
        throw new Error(intentData.error || "Unable to initialize checkout intent.");
      }

      // 2. Razorpay Checkout Flow
      if (intentData.provider === "razorpay" && intentData.razorpayOrderId) {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded || !window.Razorpay) {
          throw new Error("Unable to load Razorpay Checkout SDK. Check your internet connection.");
        }

        const razorpayKey = intentData.razorpayKeyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

        const options: RazorpayOptions = {
          key: razorpayKey,
          amount: intentData.total_cents,
          currency: intentData.currency || "INR",
          name: "AURA Learning Dashboard",
          description: title,
          order_id: intentData.razorpayOrderId,
          handler: async function (response: RazorpayResponse) {
            setIsProcessing(true);
            try {
              // 3. Authoritative server confirmation
              const confirmRes = await fetch(`/api/payments/intents/${intentData.id}/confirm`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(response),
              });

              const confirmData = await confirmRes.json();
              if (!confirmRes.ok) {
                throw new Error(confirmData.error || "Payment verification failed.");
              }

              setIsSuccess(true);
              setTimeout(() => {
                setIsProcessing(false);
                onSuccess();
                onClose();
              }, 1500);
            } catch (confirmErr) {
              setPaymentError(
                confirmErr instanceof Error
                  ? confirmErr.message
                  : "Server verification failed. Please contact support."
              );
              setIsProcessing(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            },
          },
          theme: {
            color: "#7c3aed",
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        return;
      }

      // 3. Fallback for Mock Gateway (local / test environments)
      const mockConfirmRes = await fetch(`/api/payments/intents/${intentData.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const mockConfirmData = await mockConfirmRes.json();
      if (!mockConfirmRes.ok) {
        throw new Error(mockConfirmData.error || "Mock confirmation failed.");
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsProcessing(false);
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setPaymentError(
        err instanceof Error ? err.message : "Payment initialization failed."
      );
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900/95 p-6 shadow-2xl backdrop-blur-xl overflow-hidden">
        <div className="absolute inset-0 bg-mesh-violet opacity-30 pointer-events-none" />
        <div className="grain-overlay" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl border border-white/5 bg-white/5 p-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {isSuccess ? (
          /* Payment Success View */
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4 relative z-10">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-8 h-8 animate-bounce" />
            </div>
            <h3 className="text-lg font-black text-white">Payment Successful!</h3>
            <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
              Your transaction has been verified with Razorpay. Activating your course access now...
            </p>
          </div>
        ) : (
          /* Payment Processing View */
          <form onSubmit={handleStartCheckout} className="space-y-5 relative z-10">
            {/* Header info */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-300" /> Razorpay Gateway
                </span>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
                  Secure Checkout
                </span>
              </div>
              <h2 className="text-base font-black text-white mt-1 leading-tight line-clamp-1">
                {title}
              </h2>
            </div>

            {/* Error alerts */}
            {paymentError && (
              <div className="flex items-center gap-2 p-3 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-300 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{paymentError}</span>
              </div>
            )}

            {/* Pricing Summary */}
            <div className="rounded-2xl border border-white/5 bg-zinc-950/40 p-4 space-y-2.5">
              <div className="flex justify-between text-xs text-zinc-400 font-semibold">
                <span>Original Price</span>
                <span>₹{price.toFixed(2)}</span>
              </div>
              {discountPercent && (
                <div className="flex justify-between text-xs text-emerald-400 font-semibold">
                  <span>Discount ({discountPercent}%)</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-white border-t border-white/5 pt-2.5">
                <span>Total Amount Due</span>
                <span className="text-cyan-300">₹{finalPrice.toFixed(2)}</span>
              </div>
            </div>

            {/* Coupon Application */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                Coupon Code
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Enter coupon (e.g. AURA50)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="w-full bg-zinc-950/50 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 uppercase"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-4 bg-zinc-900 border border-white/10 hover:border-violet-500/30 text-xs font-black text-white rounded-xl transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </div>
              {couponError && (
                <p className="text-[10px] text-red-400 font-medium">{couponError}</p>
              )}
              {couponSuccess && (
                <p className="text-[10px] text-emerald-400 font-medium">{couponSuccess}</p>
              )}
            </div>

            {/* Razorpay Badging & Methods */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3 text-xs text-zinc-400 space-y-2">
              <div className="flex items-center gap-2 text-zinc-300 font-bold text-[11px]">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Supported Payment Methods:</span>
              </div>
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                <span className="rounded-lg bg-white/5 px-2 py-1 border border-white/5 text-zinc-300 font-medium">
                  UPI / QR (GPay, PhonePe, Paytm)
                </span>
                <span className="rounded-lg bg-white/5 px-2 py-1 border border-white/5 text-zinc-300 font-medium">
                  Credit & Debit Cards
                </span>
                <span className="rounded-lg bg-white/5 px-2 py-1 border border-white/5 text-zinc-300 font-medium">
                  NetBanking
                </span>
                <span className="rounded-lg bg-white/5 px-2 py-1 border border-white/5 text-zinc-300 font-medium">
                  EMI & Wallets
                </span>
              </div>
            </div>

            {/* Pay Action Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:brightness-110 disabled:opacity-50 text-xs font-black text-white transition-all cursor-pointer shadow-lg shadow-violet-600/20"
            >
              {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>
                {isProcessing
                  ? "Connecting to Razorpay..."
                  : `Pay ₹${finalPrice.toFixed(2)} with Razorpay`}
              </span>
            </button>

            <p className="text-[10px] text-center text-zinc-500">
              Protected by Upstash Redis rate limiting & authoritative server verification
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
