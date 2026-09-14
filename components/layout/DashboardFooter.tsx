import React from "react";
import Link from "next/link";

export default function DashboardFooter() {
  return (
    <footer className="mt-auto border-t border-white/5 bg-zinc-950/40 px-6 py-4 text-xs text-zinc-500 shrink-0">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl mx-auto">
        <p className="text-[11px] font-medium">
          © {new Date().getFullYear()} AURA Learning Platform
        </p>
        <div className="flex items-center gap-5 text-[11px]">
          <Link href="/settings" className="hover:text-zinc-300 transition-colors">
            Settings
          </Link>
          <Link href="/profile" className="hover:text-zinc-300 transition-colors">
            Profile
          </Link>
          <Link href="/community" className="hover:text-zinc-300 transition-colors">
            Community
          </Link>
          <span className="text-zinc-600 font-mono text-[10px]">v1.2.0</span>
        </div>
      </div>
    </footer>
  );
}
