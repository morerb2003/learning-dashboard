import { BookOpen } from "lucide-react";

export default function CourseDetailLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 space-y-8 animate-pulse">
      {/* Top Nav Skeleton */}
      <div className="h-16 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-between px-6">
        <div className="h-4 w-32 bg-zinc-800 rounded" />
        <div className="h-7 w-28 bg-zinc-800 rounded-xl" />
      </div>

      {/* Main Course Hero & Sidebar Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 space-y-4">
            <div className="h-4 w-28 bg-zinc-800 rounded-full" />
            <div className="h-9 w-3/4 bg-zinc-700 rounded-xl" />
            <div className="h-4 w-full bg-zinc-900 rounded" />
            <div className="h-4 w-2/3 bg-zinc-900 rounded" />
          </div>

          <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 space-y-4">
            <div className="h-5 w-40 bg-zinc-800 rounded" />
            {[1, 2, 3, 4].map((l) => (
              <div
                key={l}
                className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-zinc-900/30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-zinc-800" />
                  <div className="space-y-1">
                    <div className="h-4 w-44 bg-zinc-800 rounded" />
                    <div className="h-3 w-20 bg-zinc-900 rounded" />
                  </div>
                </div>
                <div className="h-4 w-12 bg-zinc-800 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Info Skeleton */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 space-y-4">
            <div className="h-5 w-32 bg-zinc-800 rounded" />
            <div className="space-y-3">
              <div className="h-4 w-full bg-zinc-900 rounded" />
              <div className="h-4 w-5/6 bg-zinc-900 rounded" />
            </div>
            <div className="h-11 w-full bg-zinc-800 rounded-2xl mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
