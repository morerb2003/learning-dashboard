"use client";

import { Printer } from "lucide-react";

export default function PrintCertificateButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-black text-zinc-950 shadow-xl"
    >
      <Printer className="h-4 w-4" />
      Print or Save PDF
    </button>
  );
}
