import { GraduationCap } from "lucide-react";

export default function LearningLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 space-y-8 animate-pulse">
      {/* Top Nav Skeleton */}
      <div className="h-16 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-between px-6">
        <div className="h-4 w-36 bg-zinc-800 rounded" />
        <div className="h-6 w-24 bg-zinc-800 rounded-full" />
      </div>

      {/* Hero Header Skeleton */}
      <div className="space-y-3">
        <div className="h-4 w-40 bg-zinc-800 rounded-full" />
        <div className="h-8 w-64 bg-zinc-700 rounded-lg" />
        <div className="h-4 w-96 bg-zinc-900 rounded" />
      </div>

      {/* Course Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 h-60 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-zinc-800" />
                <div className="h-5 w-20 bg-zinc-800 rounded-full" />
              </div>
              <div className="h-5 w-44 bg-zinc-700 rounded" />
              <div className="h-3 w-32 bg-zinc-900 rounded" />
            </div>
            <div className="space-y-2 pt-4 border-t border-white/5">
              <div className="h-2 w-full bg-zinc-800 rounded-full" />
              <div className="h-8 w-full bg-zinc-800 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
