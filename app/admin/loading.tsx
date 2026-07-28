import { Shield } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <div className="h-6 w-48 bg-zinc-800 rounded-lg" />
          <div className="h-3 w-72 bg-zinc-900 rounded mt-2" />
        </div>
        <div className="h-9 w-28 bg-zinc-800 rounded-xl" />
      </div>

      {/* KPI Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-3xl border border-white/5 bg-white/[0.02] p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-zinc-800 rounded" />
              <div className="w-8 h-8 rounded-xl bg-zinc-800" />
            </div>
            <div className="h-8 w-16 bg-zinc-700 rounded" />
            <div className="h-2.5 w-24 bg-zinc-900 rounded" />
          </div>
        ))}
      </div>

      {/* Grid Panels Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {[1, 2].map((panel) => (
          <div
            key={panel}
            className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="h-4 w-36 bg-zinc-800 rounded" />
              <div className="h-3 w-20 bg-zinc-800 rounded" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((row) => (
                <div
                  key={row}
                  className="flex items-center justify-between py-2 border-b border-white/5"
                >
                  <div className="space-y-1">
                    <div className="h-3.5 w-32 bg-zinc-800 rounded" />
                    <div className="h-2.5 w-24 bg-zinc-900 rounded" />
                  </div>
                  <div className="h-5 w-16 bg-zinc-800 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
