import { MessageSquareText } from "lucide-react";

export default function CommunityLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5 pb-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-violet-300">
            <MessageSquareText className="h-3.5 w-3.5" />
            <span>Community Workspace</span>
          </div>
          <div className="h-8 w-64 bg-zinc-800 rounded animate-pulse" />
          <div className="h-4 w-96 bg-zinc-900 rounded animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 bg-zinc-800/60 rounded-xl animate-pulse" />
          <div className="h-10 w-32 bg-zinc-800/60 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Main Workspace Layout Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar / Channel List */}
        <div className="glass-card p-4 rounded-3xl border border-white/5 space-y-4 h-[600px]">
          <div className="h-10 bg-zinc-800/50 rounded-2xl animate-pulse" />
          <div className="space-y-2 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse"
              >
                <div className="w-9 h-9 rounded-full bg-zinc-800 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-zinc-800 rounded w-24" />
                  <div className="h-2 bg-zinc-900 rounded w-36" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feed / Discussion Skeleton */}
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="glass-card p-6 rounded-3xl border border-white/5 space-y-4 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-800" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 bg-zinc-800 rounded w-28" />
                    <div className="h-2 bg-zinc-900 rounded w-16" />
                  </div>
                </div>
                <div className="h-6 w-20 bg-zinc-800 rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="h-5 bg-zinc-800 rounded w-3/4" />
                <div className="h-3 bg-zinc-900 rounded w-full" />
                <div className="h-3 bg-zinc-900 rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
