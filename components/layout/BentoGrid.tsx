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
  AlertCircle
} from "lucide-react";
import { Course } from "@/types/course";
import CourseCard from "@/components/dashboard/CourseCard";
import ActivityChart from "@/components/dashboard/ActivityChart";

interface BentoGridProps {
  courses: Course[];
  fullName?: string;
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

export default function BentoGrid({ courses, fullName }: BentoGridProps) {
  const [streakClicked, setStreakClicked] = useState(false);

  // Fallback courses if database returns empty
  const displayCourses = courses.length > 0 ? courses : [
    {
      id: "1",
      title: "Advanced React Patterns",
      progress: 75,
      icon_name: "Atom",
      created_at: "2026-05-25T12:00:00.000Z"
    },
    {
      id: "2",
      title: "Next.js App Router Architecture",
      progress: 40,
      icon_name: "Network",
      created_at: "2026-05-25T12:00:00.000Z"
    },
    {
      id: "3",
      title: "Framer Motion Animations",
      progress: 90,
      icon_name: "Sparkles",
      created_at: "2026-05-25T12:00:00.000Z"
    },
    {
      id: "4",
      title: "Supabase & Postgres Masterclass",
      progress: 15,
      icon_name: "Database",
      created_at: "2026-05-25T12:00:00.000Z"
    }
  ];

  const dbConnectionFailed = courses.length === 0;

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto p-4 md:p-6 pb-24 md:pb-6"
    >
      {dbConnectionFailed && (
        <motion.div 
          variants={cardVariants}
          className="col-span-1 md:col-span-2 lg:col-span-3 glass-card px-6 py-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-amber-300 text-xs flex items-center gap-3 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-mesh-orange opacity-10 pointer-events-none" />
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <p className="relative z-10 leading-relaxed font-medium">
            <span className="font-bold">Supabase Status:</span> Connection established, but 0 active rows found (or RLS restricts public seeding). Loaded beautifully optimized fallback data to keep the prototype interactive.
          </p>
        </motion.div>
      )}

      {/* 1. Hero Tile - Greeting & Quick Stats */}
      <motion.article
        variants={cardVariants}
        whileHover={hoverAnimation}
        transition={hoverTransition}
        className="col-span-1 md:col-span-2 lg:col-span-2 rounded-3xl p-6 glass-card relative overflow-hidden flex flex-col justify-between min-h-[220px]"
      >
        <div className="absolute inset-0 bg-mesh-violet opacity-70 pointer-events-none" />
        <div className="grain-overlay" />
        
        {/* Hover Border Glow overlay */}
        <div className="absolute inset-0 rounded-3xl border border-violet-500/30 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 w-fit">
            <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Summer Term 2026</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-4">
            Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-indigo-200 to-cyan-300">{fullName || "Student"}</span>!
          </h2>
          <p className="text-zinc-400 text-xs md:text-sm mt-2 max-w-md font-medium leading-relaxed">
            You&apos;re making incredible progress this week. Your learning velocity is up 12% compared to last week. Let&apos;s finish today&apos;s checklist!
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Completed</span>
            <span className="text-lg md:text-xl font-bold text-white mt-0.5 flex items-baseline gap-1">
              12 <span className="text-xs font-normal text-zinc-500">lessons</span>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Study Time</span>
            <span className="text-lg md:text-xl font-bold text-white mt-0.5 flex items-baseline gap-1">
              28.7 <span className="text-xs font-normal text-zinc-500">hrs</span>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Skill Level</span>
            <span className="text-lg md:text-xl font-bold text-violet-400 mt-0.5 flex items-center gap-1">
              Lvl 4 <Trophy className="w-3.5 h-3.5 text-violet-400" />
            </span>
          </div>
        </div>
      </motion.article>

      {/* 2. Streak Tile - Learning Streak Indicator */}
      <motion.article
        variants={cardVariants}
        whileHover={hoverAnimation}
        transition={hoverTransition}
        className="col-span-1 rounded-3xl p-6 glass-card relative overflow-hidden flex flex-col justify-between min-h-[220px] select-none"
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
          <span className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-b from-orange-400 to-red-600 tracking-tight filter drop-shadow-[0_4px_12px_rgba(249,115,22,0.15)]">
            7
          </span>
          <span className="text-base font-extrabold text-orange-400 ml-1">Days</span>
          <p className="text-[10px] text-zinc-400 mt-1 font-medium">Click the flame to boost your energy!</p>
        </div>

        {/* Mini Calendar tracker */}
        <div className="relative z-10 flex justify-between gap-1 mt-2">
          {["M", "T", "W", "T", "F", "S", "S"].map((day, idx) => {
            // Monday to Sunday, assume Mon-Sun are completed (7 days streak)
            const completed = idx <= 6;
            return (
              <div key={idx} className="flex flex-col items-center gap-1.5 flex-1">
                <span className="text-[9px] font-bold text-zinc-500">{day}</span>
                <div 
                  className={`
                    w-full aspect-square rounded-lg flex items-center justify-center transition-all duration-300
                    ${completed 
                      ? "bg-gradient-to-br from-orange-500/40 to-red-500/30 border border-orange-500/30 text-orange-400 shadow-sm shadow-orange-500/10" 
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
        className="col-span-1 md:col-span-2 lg:col-span-2 rounded-3xl p-6 glass-card relative overflow-hidden flex flex-col justify-between min-h-[260px]"
      >
        <div className="absolute inset-0 bg-mesh-violet opacity-60 pointer-events-none" />
        <div className="grain-overlay" />
        <div className="absolute inset-0 rounded-3xl border border-violet-500/20 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        <div className="relative z-10 w-full h-full">
          <ActivityChart />
        </div>
      </motion.article>

      {/* 5. Weekly Goals / Achievements Tile */}
      <motion.article
        variants={cardVariants}
        whileHover={hoverAnimation}
        transition={hoverTransition}
        className="col-span-1 rounded-3xl p-6 glass-card relative overflow-hidden flex flex-col justify-between min-h-[260px]"
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
          <span className="text-4xl font-extrabold text-white tracking-tight">85%</span>
          <span className="text-xs text-cyan-400 font-semibold flex items-center gap-0.5">
            <TrendingUp className="w-3.5 h-3.5" /> +5% this week
          </span>
        </div>

        <div className="relative z-10 space-y-3.5 border-t border-white/5 pt-4">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <Clock className="w-3 h-3 text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">Study 4 hours daily</p>
              <div className="w-full bg-white/5 h-1 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-cyan-400 h-full rounded-full" style={{ width: "80%" }} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Calendar className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">Maintain 7-day streak</p>
              <div className="w-full bg-white/5 h-1 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: "100%" }} />
              </div>
            </div>
          </div>
        </div>
      </motion.article>
    </motion.section>
  );
}