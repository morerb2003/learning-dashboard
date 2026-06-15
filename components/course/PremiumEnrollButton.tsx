"use client";

import { useState } from "react";
import { ShoppingCart, Sparkles } from "lucide-react";
import CheckoutModal from "./CheckoutModal";

interface PremiumEnrollButtonProps {
  courseId: string;
  courseTitle: string;
  price: number;
}

export default function PremiumEnrollButton({
  courseId,
  courseTitle,
  price,
}: PremiumEnrollButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 px-5 text-xs font-black text-zinc-950 shadow-xl shadow-orange-500/20 transition hover:brightness-110 sm:w-auto cursor-pointer"
      >
        <ShoppingCart className="h-4 w-4" />
        Buy Now &mdash; ${price.toFixed(2)}
      </button>

      {/* Premium badge indicator */}
      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-amber-400/30 bg-amber-400/10 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
        <Sparkles className="w-3 h-3" />
        Premium Course
      </span>

      <CheckoutModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={() => {
          setIsOpen(false);
          window.location.reload();
        }}
        title={courseTitle}
        price={price}
        courseId={courseId}
      />
    </>
  );
}
