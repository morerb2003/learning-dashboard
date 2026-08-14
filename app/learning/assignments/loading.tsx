import { ClipboardList } from "lucide-react";

export default function AssignmentsLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="space-y-2 border-b border-white/5 pb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-300">
          <ClipboardList className="h-3.5 w-3.5" />
          <span>Coursework Workspace</span>
        </div>
        <div className="h-8 w-64 bg-zinc-800 rounded animate-pulse" />
        <div className="h-4 w-96 bg-zinc-900 rounded animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="glass-card p-6 rounded-3xl border border-white/5 space-y-4 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="h-6 w-20 bg-zinc-800 rounded-full" />
              <div className="h-4 w-24 bg-zinc-900 rounded" />
            </div>
            <div className="h-5 bg-zinc-800 rounded w-3/4" />
            <div className="h-12 bg-zinc-900/60 rounded-2xl" />
            <div className="h-10 bg-zinc-800/40 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
