"use client";

import React, { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import PayoutRequestModal from "./PayoutRequestModal";

interface TeacherPayoutTriggerProps {
  availableBalanceCents: number;
}

export default function TeacherPayoutTrigger({
  availableBalanceCents,
}: TeacherPayoutTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={availableBalanceCents <= 0}
        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-400 px-3.5 py-1.5 text-xs font-bold text-zinc-950 transition hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        <span>Request Payout</span>
        <ArrowUpRight className="h-3.5 w-3.5" />
      </button>

      <PayoutRequestModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        availableBalanceCents={availableBalanceCents}
      />
    </>
  );
}
