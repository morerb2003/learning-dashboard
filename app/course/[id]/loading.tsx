import { BookOpen } from "lucide-react";

export default function CourseDetailLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner Skeleton */}
      <div className="glass-card p-6 md:p-10 rounded-3xl border border-white/5 space-y-6 relative overflow-hidden">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-violet-400" />
          </div>
          <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse" />
        </div>

        <div className="space-y-3 max-w-3xl">
          <div className="h-9 w-3/4 bg-zinc-800 rounded-xl animate-pulse" />
          <div className="h-4 w-full bg-zinc-900 rounded animate-pulse" />
          <div className="h-4 w-2/3 bg-zinc-900 rounded animate-pulse" />
        </div>

        <div className="flex flex-wrap gap-4 pt-4 border-t border-white/5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-28 bg-zinc-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>

      {/* Course Curriculum & Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-6 w-44 bg-zinc-800 rounded animate-pulse mb-4" />
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-3.5 bg-zinc-800 rounded w-48" />
                  <div className="h-2.5 bg-zinc-900 rounded w-20" />
                </div>
              </div>
              <div className="h-7 w-20 bg-zinc-800 rounded-xl" />
            </div>
          ))}
        </div>

        {/* Sidebar Card */}
        <div className="glass-card p-6 rounded-3xl border border-white/5 space-y-6 h-fit">
          <div className="h-48 bg-zinc-900 rounded-2xl animate-pulse" />
          <div className="h-12 bg-linear-to-r from-violet-500/20 to-cyan-500/20 rounded-2xl animate-pulse" />
          <div className="space-y-2">
            <div className="h-3 bg-zinc-800 rounded w-full" />
            <div className="h-3 bg-zinc-800 rounded w-4/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
