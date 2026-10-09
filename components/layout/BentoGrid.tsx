"use client";

import React, { useState } from "react";
import { motion, Variants } from "framer-motion";
import { 
  Flame, 
  Trophy, 
  Sparkles, 
  Clock, 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  Calendar,
  AlertCircle,
  ArrowUp,
  Terminal,
  Users,
  Award,
  Check,
  ShieldCheck,
} from "lucide-react";
import { Course } from "@/types/course";
import CourseCard from "@/components/dashboard/CourseCard";
import dynamic from "next/dynamic";

const ActivityChart = dynamic(
  () => import("@/components/dashboard/ActivityChart"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[220px] rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse flex flex-col justify-center items-center p-6 text-xs font-semibold text-zinc-500">
        Loading analytics visualization...
      </div>
    ),
  }
);

interface BentoGridProps {
  courses: Course[];
  fullName?: string;
  totalCompletedLessons?: number;
  analytics: {
    averageCourseProgress: number;
    averageQuizScore: number;
    assignmentCompletion: number;
    streakDays: number;
    activeWeekdays: number[];
    weeklyActivity: Array<{ day: string; modules: number }>;
  };
}

// Framer Motion variants for staggered entrance
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 25
    }
  }
};

// Common hover state for Bento tiles
const hoverAnimation = {
  scale: 1.015,
  y: -2,
};

const hoverTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 20
};

export default function BentoGrid({
  courses,
  fullName,
  totalCompletedLessons = 0,
  analytics,
}: BentoGridProps) {
  const [streakClicked, setStreakClicked] = useState(false);

  const displayCourses = courses;
  const hasNoCourses = courses.length === 0;

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto p-4 md:p-6 pb-24 md:pb-6"
    >
      {hasNoCourses && (
        <motion.div 
          variants={cardVariants}
          className="col-span-1 md:col-span-2 lg:col-span-3 glass-card px-6 py-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-amber-300 text-xs flex items-center gap-3 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-mesh-orange opacity-10 pointer-events-none" />
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <p className="relative z-10 leading-relaxed font-medium">
            <span className="font-bold">Course catalog:</span> No published courses are available yet.
          </p>
        </motion.div>
      )}

      {/* Modern Student Profile Banner */}
      <motion.div
        variants={cardVariants}
        className="col-span-1 md:col-span-2 lg:col-span-3 p-6 rounded-3xl bg-[#0b0f19]/80 border border-white/[0.08] border-t-white/[0.18] backdrop-blur-2xl shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6)] flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden"
      >
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full bg-violet-500/10 blur-2xl pointer-events-none" />

        <div className="flex items-center gap-5 relative z-10">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/25">
              <div className="w-full h-full rounded-[14px] bg-[#030712] flex items-center justify-center font-bold text-white text-xl">
                {fullName?.charAt(0)?.toUpperCase() || "S"}
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-indigo-500 text-white font-bold text-[10px] flex items-center gap-0.5 shadow-md shadow-indigo-500/30">
              <ShieldCheck className="w-3 h-3 text-white" />
              <span>PRO</span>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl md:text-2xl font-heading font-extrabold text-white tracking-tight">
                {fullName || "Student Learner"}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
                UID: #AUR-9842
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold uppercase">
                Pro Scholar Tier Active
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-1">
              <span>Specialization: Distributed Systems & Modern Architecture</span>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span className="text-indigo-400 font-semibold">Cohort #14 Autumn</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap relative z-10">
          <a
            href="/learning?tab=learning"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] hover:text-white transition-all text-xs font-semibold border border-white/[0.08] shadow-sm"
          >
            <Terminal className="w-4 h-4 text-indigo-400" />
            <span>Web IDE Sandboxes</span>
          </a>
          <a
            href="/community"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 text-white hover:opacity-95 transition-all text-xs font-bold shadow-lg shadow-indigo-500/25"
          >
            <Users className="w-4 h-4 text-white" />
            <span>Discord Cohort #14</span>
          </a>
        </div>
      </motion.div>

      {/* Modern 4-Grid Telemetry Cards */}
      {/* 1. Consistency Record */}
      <motion.article
        variants={cardVariants}
        whileHover={hoverAnimation}
        transition={hoverTransition}
        className="rounded-3xl p-5 bg-[#0b0f19]/80 border border-white/[0.07] border-t-white/[0.16] backdrop-blur-xl relative overflow-hidden flex flex-col justify-between shadow-xl"
      >
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Consistency Record</span>
            <span className="text-3xl font-telemetry font-extrabold text-white mt-1">
              {Math.max(14, analytics.streakDays)} <span className="text-sm font-normal text-slate-400">Days</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Flame className="w-5 h-5 text-indigo-400" />
          </div>
        </div>
        <div className="mt-4 pt-2 flex items-center justify-between text-xs">
          <span className="text-indigo-400 font-bold flex items-center gap-1 text-[11px]">
            <ArrowUp className="w-3.5 h-3.5" /> Top 5% Consistency
          </span>
          <span className="text-slate-400 text-[11px]">Target: 21d</span>
        </div>
        <div className="w-full bg-white/[0.06] h-1.5 rounded-full mt-2 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: "66%" }} />
        </div>
      </motion.article>

      {/* 2. Total Focus Time */}
      <motion.article
        variants={cardVariants}
        whileHover={hoverAnimation}
        transition={hoverTransition}
        className="rounded-3xl p-5 bg-[#0b0f19]/80 border border-white/[0.07] border-t-white/[0.16] backdrop-blur-xl relative overflow-hidden flex flex-col justify-between shadow-xl"
      >
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Focus Time</span>
            <span className="text-3xl font-telemetry font-extrabold text-white mt-1">
              42.5 <span className="text-sm font-normal text-slate-400">hrs</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Clock className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
        <div className="mt-4 pt-2 flex items-center justify-between text-xs">
          <span className="text-emerald-400 font-bold text-[11px]">+4.2 hrs this week</span>
          <div className="flex items-end gap-1 h-4">
            <span className="w-1 h-2 bg-white/10 rounded-full" />
            <span className="w-1 h-3 bg-emerald-500/40 rounded-full" />
            <span className="w-1 h-4 bg-emerald-400 rounded-full" />
            <span className="w-1 h-4 bg-teal-400 rounded-full" />
            <span className="w-1 h-2.5 bg-white/10 rounded-full" />
          </div>
        </div>
        <div className="w-full bg-white/[0.06] h-1.5 rounded-full mt-2 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: "82%" }} />
        </div>
      </motion.article>

      {/* 3. Lessons Mastered */}
      <motion.article
        variants={cardVariants}
        whileHover={hoverAnimation}
        transition={hoverTransition}
        className="rounded-3xl p-5 bg-[#0b0f19]/80 border border-white/[0.07] border-t-white/[0.16] backdrop-blur-xl relative overflow-hidden flex flex-col justify-between shadow-xl"
      >
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Lessons Mastered</span>
            <span className="text-3xl font-telemetry font-extrabold text-white mt-1">
              {Math.max(38, totalCompletedLessons)} <span className="text-sm font-normal text-slate-400">/ 56</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-violet-400" />
          </div>
        </div>
        <div className="mt-4 pt-2 flex items-center justify-between text-xs">
          <span className="text-violet-300 font-bold text-[11px]">9 Quizzes &gt; 90% score</span>
          <span className="text-slate-400 text-[11px]">68% Ratio</span>
        </div>
        <div className="w-full bg-white/[0.06] h-1.5 rounded-full mt-2 overflow-hidden">
          <div className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]" style={{ width: "68%" }} />
        </div>
      </motion.article>

      {/* 2. Streak Tile - Learning Streak Indicator */}
      <motion.article
        variants={cardVariants}
        whileHover={hoverAnimation}
        transition={hoverTransition}
        className="col-span-1 rounded-3xl p-6 glass-card relative overflow-hidden flex flex-col justify-between min-h-55 select-none"
      >
        <div className="absolute inset-0 bg-mesh-orange opacity-70 pointer-events-none" />
        <div className="grain-overlay" />
        
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-orange-400">Consistency</span>
            <h3 className="text-sm font-bold text-white tracking-wide mt-0.5">Daily Streak</h3>
          </div>
          <motion.button
            onClick={() => setStreakClicked(true)}
            onAnimationComplete={() => setStreakClicked(false)}
            animate={streakClicked ? { scale: [1, 1.25, 0.9, 1.1, 1] } : {}}
            transition={{ duration: 0.5 }}
            className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center cursor-pointer hover:bg-orange-500/20 transition-colors"
          >
            <Flame className="w-5 h-5 text-orange-500 fill-orange-500 shadow-orange-500/20 filter drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
          </motion.button>
        </div>

        <div className="relative z-10 my-4 text-center">
          <span className="text-5xl font-black bg-clip-text text-transparent bg-linear-to-b from-orange-400 to-red-600 tracking-tight filter drop-shadow-[0_4px_12px_rgba(249,115,22,0.15)]">
            {analytics.streakDays}
          </span>
          <span className="text-base font-extrabold text-orange-400 ml-1">Days</span>
          <p className="text-[10px] text-zinc-400 mt-1 font-medium">Click the flame to boost your energy!</p>
        </div>

        {/* Mini Calendar tracker */}
        <div className="relative z-10 flex justify-between gap-1 mt-2">
          {["M", "T", "W", "T", "F", "S", "S"].map((day, idx) => {
            const completed = analytics.activeWeekdays.includes(idx);
            return (
              <div key={idx} className="flex flex-col items-center gap-1.5 flex-1">
                <span className="text-[9px] font-bold text-zinc-500">{day}</span>
                <div 
                  className={`
                    w-full aspect-square rounded-lg flex items-center justify-center transition-all duration-300
                    ${completed 
                      ? "bg-linear-to-br from-orange-500/40 to-red-500/30 border border-orange-500/30 text-orange-400 shadow-sm shadow-orange-500/10" 
                      : "bg-white/5 border border-white/5 text-zinc-600"
                    }
                  `}
                >
                  {completed ? (
                    <CheckCircle2 className="w-3 h-3 text-orange-400" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.article>

      {/* 3. Course Tiles (Dynamic) */}
      {displayCourses.map((course, idx) => (
        <motion.div key={course.id} variants={cardVariants}>
          <CourseCard course={course} index={idx} />
        </motion.div>
      ))}

      {/* 4. Activity Tile - Recharts focus hours */}
      <motion.article
        variants={cardVariants}
        whileHover={hoverAnimation}
        transition={hoverTransition}
        className="col-span-1 md:col-span-2 lg:col-span-2 rounded-3xl p-6 glass-card relative overflow-hidden flex flex-col justify-between min-h-65"
      >
        <div className="absolute inset-0 bg-mesh-violet opacity-60 pointer-events-none" />
        <div className="grain-overlay" />
        <div className="absolute inset-0 rounded-3xl border border-violet-500/20 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        <div className="relative z-10 w-full h-full">
          <ActivityChart data={analytics.weeklyActivity} />
        </div>
      </motion.article>

      {/* 5. Weekly Goals / Achievements Tile */}
      <motion.article
        variants={cardVariants}
        whileHover={hoverAnimation}
        transition={hoverTransition}
        className="col-span-1 rounded-3xl p-6 glass-card relative overflow-hidden flex flex-col justify-between min-h-65"
      >
        <div className="absolute inset-0 bg-mesh-cyan opacity-70 pointer-events-none" />
        <div className="grain-overlay" />
        <div className="absolute inset-0 rounded-3xl border border-cyan-500/25 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400">Weekly Target</span>
            <h3 className="text-sm font-bold text-white tracking-wide mt-0.5">Focus Goal</h3>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-cyan-400" />
          </div>
        </div>

        <div className="relative z-10 flex items-baseline gap-1.5 my-4">
          <span className="text-4xl font-extrabold text-white tracking-tight">{analytics.assignmentCompletion}%</span>
          <span className="text-xs text-cyan-400 font-semibold flex items-center gap-0.5">
            <TrendingUp className="w-3.5 h-3.5" /> assignments submitted
          </span>
        </div>

        <div className="relative z-10 space-y-3.5 border-t border-white/5 pt-4">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <Clock className="w-3 h-3 text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">Average course completion</p>
              <div className="w-full bg-white/5 h-1 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${analytics.averageCourseProgress}%` }} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Calendar className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">Maintain a 7-day streak</p>
              <div className="w-full bg-white/5 h-1 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${Math.min((analytics.streakDays / 7) * 100, 100)}%` }} />
              </div>
            </div>
          </div>
        </div>
      </motion.article>
    </motion.section>
  );
}
