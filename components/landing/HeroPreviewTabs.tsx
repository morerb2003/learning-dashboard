"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Award,
  BookOpen,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Activity,
  Users,
  Sparkles,
  Play,
  ArrowUpRight,
  ClipboardCheck,
} from "lucide-react";
import TiltCard from "@/components/motion/TiltCard";

type RoleTab = "student" | "teacher" | "admin";

export default function HeroPreviewTabs() {
  const [activeTab, setActiveTab] = useState<RoleTab>("student");

  return (
    <div className="relative mx-auto w-full max-w-2xl lg:max-w-none">
      {/* Dynamic ambient backdrop aura */}
      <div className="absolute -inset-10 rounded-full bg-violet-600/15 blur-3xl animate-pulse-glow" />
      <div className="absolute -inset-4 rounded-3xl bg-cyan-500/10 blur-2xl" />

      {/* Interactive Tabs Header */}
      <div className="relative mb-3 flex items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-zinc-950/80 p-1.5 backdrop-blur-xl shadow-lg sm:w-fit sm:mx-auto">
        <button
          type="button"
          onClick={() => setActiveTab("student")}
          className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
            activeTab === "student"
              ? "text-white"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          {activeTab === "student" && (
            <motion.div
              layoutId="heroTabBg"
              className="absolute inset-0 rounded-xl bg-violet-500/20 border border-violet-400/30"
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <LayoutDashboard className="h-3.5 w-3.5 text-violet-400" />
            Student View
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("teacher")}
          className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
            activeTab === "teacher"
              ? "text-white"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          {activeTab === "teacher" && (
            <motion.div
              layoutId="heroTabBg"
              className="absolute inset-0 rounded-xl bg-cyan-500/20 border border-cyan-400/30"
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
            Teacher View
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("admin")}
          className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
            activeTab === "admin"
              ? "text-white"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          {activeTab === "admin" && (
            <motion.div
              layoutId="heroTabBg"
              className="absolute inset-0 rounded-xl bg-emerald-500/20 border border-emerald-400/30"
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Admin View
          </span>
        </button>
      </div>

      <TiltCard maxTilt={8} glareOpacity={0.2}>
        <div className="relative overflow-hidden rounded-[2.2rem] border border-white/12 bg-zinc-950/85 p-3 sm:p-4 shadow-2xl shadow-black/70 backdrop-blur-2xl">
          <div className="grain-overlay" />

          {/* Top Mockup Status Bar */}
          <div className="rounded-[1.6rem] border border-white/8 bg-[#09090c] p-4 sm:p-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                    activeTab === "student"
                      ? "bg-violet-500/15 text-violet-300"
                      : activeTab === "teacher"
                      ? "bg-cyan-500/15 text-cyan-300"
                      : "bg-emerald-500/15 text-emerald-300"
                  }`}
                >
                  {activeTab === "student" && (
                    <LayoutDashboard className="h-5 w-5" />
                  )}
                  {activeTab === "teacher" && <BookOpen className="h-5 w-5" />}
                  {activeTab === "admin" && <ShieldCheck className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-xs font-black tracking-wide text-white">
                    {activeTab === "student" && "Student Workspace"}
                    {activeTab === "teacher" && "Instructor Command Center"}
                    {activeTab === "admin" && "Platform Operations Hub"}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Learning Node
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Connected
                </span>
              </div>
            </div>

            {/* Dynamic View Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === "student" && (
                <motion.div
                  key="student"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="mt-4 space-y-4"
                >
                  <div className="grid gap-4 sm:grid-cols-[1.35fr_0.65fr]">
                    <div className="relative overflow-hidden rounded-2xl border border-violet-400/20 bg-violet-400/5 p-5">
                      <div className="absolute inset-0 bg-mesh-violet opacity-70" />
                      <div className="relative">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-300">
                            Current Course
                          </span>
                          <span className="flex items-center gap-1 text-[10px] font-bold text-violet-300">
                            In Progress <ArrowUpRight className="h-3 w-3" />
                          </span>
                        </div>
                        <h4 className="mt-2 text-base font-black text-white sm:text-lg">
                          Next.js & Fullstack Architecture
                        </h4>
                        <p className="mt-0.5 text-xs text-zinc-400">
                          Lesson 8: Real-time Supabase Subscriptions
                        </p>

                        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "74%" }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-400 to-cyan-300"
                          />
                        </div>
                        <div className="mt-2 flex justify-between text-[10px] font-bold text-zinc-400">
                          <span>Progress</span>
                          <span className="text-cyan-300">74% Complete</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                          <Award className="h-5 w-5" />
                        </div>
                        <Sparkles className="h-4 w-4 text-cyan-300/60" />
                      </div>
                      <div>
                        <p className="text-2xl font-black text-white sm:text-3xl">7</p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          Verified Certs
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Quiz Score", value: "96%", icon: ClipboardCheck, color: "text-emerald-400" },
                      { label: "Day Streak", value: "18 Days", icon: Activity, color: "text-amber-400" },
                      { label: "Completed", value: "32 Units", icon: CheckCircle2, color: "text-cyan-400" },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.label}
                          className="rounded-2xl border border-white/6 bg-white/[0.03] p-3.5"
                        >
                          <Icon className={`h-4 w-4 ${item.color}`} />
                          <p className="mt-2 text-sm font-black text-white sm:text-lg">
                            {item.value}
                          </p>
                          <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                            {item.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {activeTab === "teacher" && (
                <motion.div
                  key="teacher"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="mt-4 space-y-4"
                >
                  <div className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-5">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">
                        Enrollment Signal
                      </p>
                      <h4 className="mt-2 text-base font-black text-white sm:text-lg">
                        1,420 Active Students
                      </h4>
                      <div className="mt-4 flex h-24 items-end gap-2 rounded-xl border border-white/5 bg-black/30 p-3">
                        {[40, 65, 55, 80, 70, 95, 85, 100].map((h, i) => (
                          <div key={i} className="flex h-full flex-1 items-end">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${h}%` }}
                              transition={{ duration: 0.6, delay: i * 0.05 }}
                              className="w-full rounded-t-sm bg-gradient-to-t from-cyan-600 to-cyan-300"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          Course Health
                        </p>
                        <p className="mt-1 text-2xl font-black text-white">4.9 / 5.0</p>
                        <p className="mt-0.5 text-xs text-emerald-400 font-semibold">
                          +14% completion rate
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-zinc-400 font-medium">
                        98% positive reviews from 340 submissions
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "admin" && (
                <motion.div
                  key="admin"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="mt-4 space-y-4"
                >
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
                      <Users className="h-4 w-4 text-emerald-300" />
                      <p className="mt-2 text-xl font-black text-white">3,890</p>
                      <p className="text-[10px] uppercase font-bold text-zinc-500">Registered Users</p>
                    </div>
                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-4">
                      <BookOpen className="h-4 w-4 text-violet-300" />
                      <p className="mt-2 text-xl font-black text-white">48</p>
                      <p className="text-[10px] uppercase font-bold text-zinc-500">Live Courses</p>
                    </div>
                    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4">
                      <TrendingUp className="h-4 w-4 text-cyan-300" />
                      <p className="mt-2 text-xl font-black text-white">99.9%</p>
                      <p className="text-[10px] uppercase font-bold text-zinc-500">Uptime SLA</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </TiltCard>

      {/* Floating Micro Status Badges around the preview */}
      <div className="absolute -bottom-5 -left-4 hidden sm:block">
        <motion.div
          animate={{ y: [-4, 4, -4] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-center gap-3 rounded-2xl border border-white/12 bg-zinc-950/90 p-3.5 shadow-2xl backdrop-blur-xl"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-black text-white">Module complete</p>
            <p className="text-[10px] font-semibold text-zinc-400">
              Synced to cloud profile
            </p>
          </div>
        </motion.div>
      </div>

      <div className="absolute -top-4 -right-3 hidden sm:block">
        <motion.div
          animate={{ y: [4, -4, 4] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="flex items-center gap-2 rounded-full border border-violet-400/25 bg-zinc-950/90 px-4 py-2 shadow-2xl backdrop-blur-xl"
        >
          <span className="h-2 w-2 rounded-full bg-violet-400 animate-ping" />
          <span className="text-xs font-bold text-violet-200">
            Realtime Analytics
          </span>
        </motion.div>
      </div>
    </div>
  );
}
