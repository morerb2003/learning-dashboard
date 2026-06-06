"use client";

import { Activity, BookOpen, GraduationCap, ListVideo } from "lucide-react";

export interface TeacherStats {
  totalCourses: number;
  totalStudents: number;
  totalLessons: number;
  avgCompletion: number;
}

interface TeacherStatsCardsProps {
  stats: TeacherStats;
}

const statCards = [
  {
    key: "totalCourses" as const,
    label: "Total Courses",
    icon: BookOpen,
    color: "text-violet-300",
    bg: "bg-mesh-violet",
    suffix: "",
  },
  {
    key: "totalStudents" as const,
    label: "Students",
    icon: GraduationCap,
    color: "text-cyan-300",
    bg: "bg-mesh-cyan",
    suffix: "",
  },
  {
    key: "totalLessons" as const,
    label: "Lessons",
    icon: ListVideo,
    color: "text-emerald-300",
    bg: "bg-mesh-emerald",
    suffix: "",
  },
  {
    key: "avgCompletion" as const,
    label: "Completion Rate",
    icon: Activity,
    color: "text-orange-300",
    bg: "bg-mesh-orange",
    suffix: "%",
  },
] as const;

export default function TeacherStatsCards({ stats }: TeacherStatsCardsProps) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        const value = stats[stat.key] ?? 0;

        return (
          <article
            key={stat.key}
            className="relative min-h-36 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-lg transition-all duration-300 hover:border-white/15 hover:bg-white/[0.05] group"
          >
            {/* Ambient Background Glow */}
            <div className={`absolute inset-0 ${stat.bg} opacity-35 pointer-events-none transition-opacity duration-300 group-hover:opacity-50`} />
            <div className="grain-overlay" />

            <div className="relative z-10 flex items-start justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                {stat.label}
              </span>
              <div className={`rounded-lg border border-white/10 bg-white/[0.04] p-2 ${stat.color} transition-transform duration-300 group-hover:scale-110`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <p className="relative z-10 mt-8 text-3xl font-black tracking-tight text-white">
              {value.toLocaleString()}
              {stat.suffix}
            </p>
          </article>
        );
      })}
    </section>
  );
}
