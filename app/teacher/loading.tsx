import { BookOpen } from "lucide-react";

export default function TeacherLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <div className="h-6 w-52 bg-zinc-800 rounded-lg" />
          <div className="h-3 w-80 bg-zinc-900 rounded mt-2" />
        </div>
        <div className="h-9 w-32 bg-zinc-800 rounded-xl" />
      </div>

      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-3xl border border-white/5 bg-white/[0.02] p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 bg-zinc-800 rounded" />
              <div className="w-8 h-8 rounded-xl bg-zinc-800" />
            </div>
            <div className="h-7 w-20 bg-zinc-700 rounded" />
          </div>
        ))}
      </div>

      {/* Table Placeholder Skeleton */}
      <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 space-y-4">
        <div className="h-5 w-44 bg-zinc-800 rounded" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between py-3 border-b border-white/5"
            >
              <div className="space-y-1.5">
                <div className="h-4 w-48 bg-zinc-800 rounded" />
                <div className="h-3 w-28 bg-zinc-900 rounded" />
              </div>
              <div className="h-6 w-20 bg-zinc-800 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
