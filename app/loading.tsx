import React from "react";
import { GraduationCap, Sparkles } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-screen bg-zinc-950/20">
      {/* Sidebar Skeleton (Hidden on mobile, matching layout) */}
      <aside className="hidden md:flex flex-col w-20 lg:w-64 border-r border-white/10 h-screen sticky top-0 px-3 py-6 justify-between">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-3 px-3 h-10">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 animate-pulse flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-zinc-600" />
            </div>
            <div className="hidden lg:block space-y-1.5 flex-1">
              <div className="h-3 w-16 bg-zinc-800 rounded animate-pulse" />
              <div className="h-2 w-10 bg-zinc-900 rounded animate-pulse" />
            </div>
          </div>

          {/* Navigation Links */}
          <ul className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <li key={i} className="flex items-center gap-4 px-4 py-3 rounded-xl bg-zinc-900/40 animate-pulse">
                <div className="w-5 h-5 rounded bg-zinc-800 shrink-0" />
                <div className="hidden lg:block h-3 bg-zinc-800 rounded w-24" />
              </li>
            ))}
          </ul>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3 px-3">
          <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse shrink-0" />
          <div className="hidden lg:block space-y-1.5 flex-1">
            <div className="h-2.5 bg-zinc-800 rounded w-16 animate-pulse" />
            <div className="h-2 bg-zinc-900 rounded w-24 animate-pulse" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto no-scrollbar md:p-6 p-4">
        {/* Mock Top bar */}
        <header className="h-20 flex items-center justify-between border-b border-white/5 px-4 mb-6 shrink-0 md:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 animate-pulse flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-zinc-600" />
            </div>
            <span className="font-bold text-white tracking-wider text-sm">AURA</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
        </header>

        {/* Bento Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto w-full pb-24 md:pb-0">
          
          {/* Hero Card Skeleton */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2 rounded-3xl p-6 glass-card border border-white/5 bg-zinc-900/20 min-h-[220px] flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-mesh-violet opacity-30 pointer-events-none" />
            <div className="space-y-4">
              <div className="h-5 w-36 bg-zinc-800 rounded-full animate-pulse" />
              <div className="space-y-2 mt-4">
                <div className="h-8 w-64 bg-zinc-800 rounded animate-pulse" />
                <div className="h-4 w-96 bg-zinc-900 rounded animate-pulse" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5 mt-6">
              {[1, 2, 3].map((x) => (
                <div key={x} className="space-y-2">
                  <div className="h-2 w-10 bg-zinc-900 rounded animate-pulse" />
                  <div className="h-5 w-16 bg-zinc-800 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Streak Card Skeleton */}
          <div className="col-span-1 rounded-3xl p-6 glass-card border border-white/5 bg-zinc-900/20 min-h-[220px] flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-mesh-orange opacity-30 pointer-events-none" />
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-2 w-16 bg-zinc-900 rounded animate-pulse" />
                <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse" />
              </div>
              <div className="w-10 h-10 rounded-2xl bg-zinc-800 animate-pulse" />
            </div>
            <div className="h-10 w-20 bg-zinc-800/50 rounded mx-auto my-4 animate-pulse" />
            <div className="flex justify-between gap-1.5 mt-2">
              {[1, 2, 3, 4, 5, 6, 7].map((x) => (
                <div key={x} className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="h-2 w-3 bg-zinc-900 rounded animate-pulse" />
                  <div className="w-full aspect-square rounded-lg bg-zinc-800 animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* 4 Course Card Skeletons */}
          {[1, 2, 3, 4].map((x) => (
            <div key={x} className="rounded-3xl p-6 glass-card border border-white/5 bg-zinc-900/20 h-52 flex flex-col justify-between relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 animate-pulse" />
                <div className="w-12 h-3 bg-zinc-900 rounded animate-pulse" />
              </div>
              <div className="space-y-3 mt-auto">
                <div className="space-y-1">
                  <div className="h-2 w-14 bg-zinc-900 rounded animate-pulse" />
                  <div className="h-5 w-40 bg-zinc-800 rounded animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <div className="h-2.5 w-12 bg-zinc-900 rounded animate-pulse" />
                    <div className="h-2.5 w-8 bg-zinc-900 rounded animate-pulse" />
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800/40 rounded-full overflow-hidden" />
                </div>
              </div>
            </div>
          ))}

          {/* Activity Chart Skeleton */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2 rounded-3xl p-6 glass-card border border-white/5 bg-zinc-900/20 min-h-[260px] flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <div className="space-y-1">
                <div className="h-2.5 w-16 bg-zinc-900 rounded animate-pulse" />
                <div className="h-4 w-28 bg-zinc-800 rounded animate-pulse" />
              </div>
              <div className="h-3 w-32 bg-zinc-900 rounded-full animate-pulse" />
            </div>
            <div className="flex-1 w-full h-[180px] bg-zinc-900/10 border border-white/5 rounded-2xl animate-pulse flex items-center justify-center text-zinc-700 text-xs">
              Fetching analytics data...
            </div>
          </div>

          {/* Goal Card Skeleton */}
          <div className="col-span-1 rounded-3xl p-6 glass-card border border-white/5 bg-zinc-900/20 min-h-[260px] flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="h-2.5 w-16 bg-zinc-900 rounded animate-pulse" />
                <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse" />
              </div>
              <div className="w-10 h-10 rounded-2xl bg-zinc-800 animate-pulse" />
            </div>
            <div className="h-8 w-16 bg-zinc-800 rounded my-4 animate-pulse" />
            <div className="space-y-3.5 border-t border-white/5 pt-4">
              {[1, 2].map((x) => (
                <div key={x} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-zinc-800 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-zinc-800 rounded w-24 animate-pulse" />
                    <div className="h-1 bg-zinc-900 rounded w-full animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
