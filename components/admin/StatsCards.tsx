"use client";

import { Activity, BookOpen, StickyNote, Users } from "lucide-react";

export interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalNotes: number;
  activeStudents: number;
}

interface StatsCardsProps {
  stats: AdminStats;
}

const statCards = [
  { key: "totalUsers", label: "Total Users", icon: Users, color: "text-cyan-300", bg: "bg-mesh-cyan" },
  { key: "totalCourses", label: "Total Courses", icon: BookOpen, color: "text-violet-300", bg: "bg-mesh-violet" },
  { key: "totalNotes", label: "Total Notes", icon: StickyNote, color: "text-orange-300", bg: "bg-mesh-orange" },
  { key: "activeStudents", label: "Active Students", icon: Activity, color: "text-emerald-300", bg: "bg-mesh-emerald" },
] as const;

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        const value = stats[stat.key] ?? 0;

        return (
          <article
            key={stat.key}
            className="relative min-h-36 overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] p-5 shadow-lg"
          >
            {/* Ambient Background Glow */}
            <div className={`absolute inset-0 ${stat.bg} opacity-35 pointer-events-none`} />
            <div className="grain-overlay" />
            
            <div className="relative z-10 flex items-start justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                {stat.label}
              </span>
              <div className={`rounded-lg border border-white/10 bg-white/[0.04] p-2 ${stat.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <p className="relative z-10 mt-8 text-3xl font-black tracking-tight text-white">
              {value.toLocaleString()}
            </p>
          </article>
        );
      })}
    </section>
  );
}
