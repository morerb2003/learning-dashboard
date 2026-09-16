"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service or console
    console.error("Application error:", error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#030303] text-zinc-100 px-5">
      <div className="relative max-w-md w-full overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/80 p-8 text-center shadow-2xl backdrop-blur-xl">
        <div className="grain-overlay" />
        <div className="relative z-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="h-7 w-7" />
          </div>

          <h2 className="mt-6 text-2xl font-black tracking-tight text-white">
            Something went wrong
          </h2>

          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            An unexpected error occurred while loading this page. Our telemetry
            has been notified.
          </p>

          {error.digest && (
            <p className="mt-3 font-mono text-[11px] text-zinc-600 bg-white/[0.02] border border-white/5 py-1 px-2.5 rounded-lg inline-block">
              Error Digest: {error.digest}
            </p>
          )}

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="btn-shimmer inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-white px-5 text-xs font-black text-zinc-950 transition hover:bg-zinc-200 active:scale-[0.97] cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try again
            </button>

            <Link
              href="/"
              className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-5 text-xs font-bold text-white transition hover:bg-white/[0.08] active:scale-[0.97]"
            >
              <Home className="h-3.5 w-3.5" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
