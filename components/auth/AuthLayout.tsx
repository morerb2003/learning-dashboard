"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { BarChart3, BookOpenCheck, GraduationCap, LineChart, NotebookPen, Sparkles } from "lucide-react";

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}

const features = [
  {
    title: "Track Learning Progress",
    description: "See every course milestone and completion trend at a glance.",
    icon: LineChart,
  },
  {
    title: "Manage Courses",
    description: "Organize lessons, modules, and learning paths with clarity.",
    icon: BookOpenCheck,
  },
  {
    title: "Take Smart Notes",
    description: "Capture ideas beside the courses where they matter most.",
    icon: NotebookPen,
  },
  {
    title: "Analytics Dashboard",
    description: "Turn study activity into decisions you can act on.",
    icon: BarChart3,
  },
];

export default function AuthLayout({ eyebrow, title, subtitle, children }: AuthLayoutProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050507] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_82%_10%,rgba(139,92,246,0.18),transparent_30%),radial-gradient(circle_at_52%_88%,rgba(16,185,129,0.12),transparent_32%)]" />
      <div className="grain-overlay" />

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <motion.section
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="hidden border-r border-white/10 px-10 py-10 lg:flex lg:flex-col lg:justify-between xl:px-16"
        >
          <div>
            <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/4 px-4 py-3 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-300 text-zinc-950">
                <GraduationCap className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-bold">Learning Dashboard</p>
                <p className="text-xs font-medium text-zinc-400">Modern LMS workspace</p>
              </div>
            </div>

            <div className="mt-16 max-w-2xl">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                Learn with momentum
              </p>
              <h1 className="text-5xl font-black leading-[1.02] tracking-tight text-white xl:text-6xl">
                Build skills with a dashboard that keeps learning moving.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-300">
                Track progress, manage courses, take notes, and earn certificates from one focused learning command center.
              </p>
            </div>

            <div className="mt-12 grid max-w-2xl grid-cols-2 gap-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;

                return (
                  <motion.article
                    key={feature.title}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 + index * 0.06, duration: 0.45 }}
                    className="rounded-2xl border border-white/10 bg-white/4.5 p-4 shadow-2xl shadow-black/20 backdrop-blur-xl"
                  >
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-cyan-200">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-sm font-bold text-white">{feature.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{feature.description}</p>
                  </motion.article>
                );
              })}
            </div>
          </div>

          <div className="relative mt-12 overflow-hidden rounded-4xl border border-white/10 bg-white/4 p-5 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
            <div className="absolute right-6 top-6 h-24 w-24 rounded-full bg-cyan-300/20 blur-3xl" />
            <div className="grid grid-cols-[1fr_0.75fr] gap-4">
              <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-zinc-500">Weekly progress</p>
                    <p className="mt-1 text-3xl font-black">78%</p>
                  </div>
                  <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">+12%</span>
                </div>
                <div className="flex h-28 items-end gap-2">
                  {[42, 58, 38, 72, 64, 86, 78].map((height, index) => (
                    <div key={index} className="flex-1 rounded-t-xl bg-linear-to-t from-cyan-400 to-violet-300" style={{ height: `${height}%` }} />
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold text-zinc-500">Certificates</p>
                  <p className="mt-2 text-2xl font-black">12</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold text-zinc-500">Smart notes</p>
                  <p className="mt-2 text-2xl font-black">248</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-120"
          >
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-300 text-zinc-950">
                <GraduationCap className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-bold">Learning Dashboard</p>
                <p className="text-xs font-medium text-zinc-400">Modern LMS workspace</p>
              </div>
            </div>

            <div className="rounded-4xl border border-white/10 bg-zinc-950/65 p-5 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-8">
              <div className="mb-8">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">{eyebrow}</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{subtitle}</p>
              </div>
              {children}
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  );
}
