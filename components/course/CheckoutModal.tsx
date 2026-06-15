"use client";

import React, { useState } from "react";
import { X, CreditCard, Tag, Sparkles, AlertCircle, CheckCircle } from "lucide-react";
import { applyCouponAction, checkoutCourseAction, subscribeProAction } from "@/lib/course/payment";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title: string;
  price: number;
  courseId?: string; // If undefined, it is a subscription purchase
}

export default function CheckoutModal({
  isOpen,
  onClose,
  onSuccess,
  title,
  price,
  courseId,
}: CheckoutModalProps) {
  const [couponCode, setCouponCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState<number | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  // Calculate prices
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

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);
    setIsProcessing(true);

    try {
      let result;
      if (courseId) {
        // Course Purchase
        result = await checkoutCourseAction(courseId, couponCode);
      } else {
        // Pro Subscription Purchase
        result = await subscribeProAction(couponCode);
      }

      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsProcessing(false);
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setPaymentError(result.error ?? "Transaction declined");
        setIsProcessing(false);
      }
    } catch {
      setPaymentError("Payment failed due to an unexpected server issue.");
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
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900/90 p-6 shadow-2xl backdrop-blur-xl overflow-hidden">
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
              Your transaction has been processed. Syncing access controls with your dashboard now...
            </p>
          </div>
        ) : (
          /* Payment Processing View */
          <form onSubmit={handlePay} className="space-y-5 relative z-10">
            {/* Header info */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Secure Stripe Checkout
              </span>
              <h2 className="text-base font-black text-white mt-1 leading-tight line-clamp-1">{title}</h2>
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
              <div className="flex justify-between text-xs text-zinc-500 font-semibold">
                <span>Original Price</span>
                <span>${price.toFixed(2)}</span>
              </div>
              {discountPercent && (
                <div className="flex justify-between text-xs text-emerald-400 font-semibold">
                  <span>Discount ({discountPercent}%)</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-white border-t border-white/5 pt-2.5">
                <span>Total Amount Due</span>
                <span className="text-violet-400">${finalPrice.toFixed(2)}</span>
              </div>
            </div>

            {/* Coupon Application */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Coupon Code</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Enter coupon (e.g. AURA50)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="w-full bg-zinc-950/50 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50"
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
              {couponError && <p className="text-[10px] text-red-400 font-medium">{couponError}</p>}
              {couponSuccess && <p className="text-[10px] text-emerald-400 font-medium">{couponSuccess}</p>}
            </div>

            {/* Credit Card inputs */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Cardholder Name</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full bg-zinc-950/50 border border-white/5 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Card Number</label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="4242 4242 4242 4242"
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim())}
                    className="w-full bg-zinc-950/50 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Expiry Date</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value.replace(/\D/g, "").replace(/(.{2})/, "$1/").trim())}
                    className="w-full bg-zinc-950/50 border border-white/5 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">CVC</label>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    placeholder="CVC"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-zinc-950/50 border border-white/5 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50"
                  />
                </div>
              </div>
            </div>

            {/* Pay Action Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-xs font-black text-white transition-colors cursor-pointer shadow-lg shadow-violet-600/10"
            >
              {isProcessing ? "Processing Stripe Authorization..." : `Pay $${finalPrice.toFixed(2)} & Enroll`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
