"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Maximize2,
  CheckCircle2,
  HelpCircle,
  Code2,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

interface InteractiveQuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
}

export default function InteractiveLessonPlayer() {
  const [activeTab, setActiveTab] = useState<"video" | "quiz" | "code">("quiz");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<"1x" | "1.5x" | "2x">("1x");
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

  const quizOptions: InteractiveQuizOption[] = [
    {
      id: "a",
      text: "In the client browser during hydration using useEffect hooks",
      isCorrect: false,
      explanation: "Incorrect. Client-side fetching in useEffect is standard Client Component behavior, not React Server Components.",
    },
    {
      id: "b",
      text: "Strictly on the server, streaming HTML with zero client JavaScript bundle overhead",
      isCorrect: true,
      explanation: "Correct! React Server Components run exclusively on the server, allowing direct database access and zero JS bundle overhead for libraries.",
    },
    {
      id: "c",
      text: "Inside a browser Service Worker interceptor thread",
      isCorrect: false,
      explanation: "Incorrect. Service workers run on the client device, while Server Components run on Node/Edge runtime servers.",
    },
  ];

  const handleSelectOption = (id: string) => {
    setSelectedQuizOption(id);
    setIsAnswerSubmitted(true);
  };

  const selectedAnswer = quizOptions.find((o) => o.id === selectedQuizOption);

  return (
    <section id="demo-player" className="relative mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">
          <Sparkles className="h-3 w-3" />
          Interactive Learning Experience
        </span>
        <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
          Test-Drive the AURA Player Sandbox
        </h2>
        <p className="mt-4 text-sm sm:text-base text-zinc-400">
          Experience our distraction-free learning environment. Switch between interactive video streams, automated quiz evaluations, and hands-on code sandboxes.
        </p>
      </div>

      {/* Main Player Container */}
      <div className="mt-14 overflow-hidden rounded-3xl border border-white/12 bg-zinc-950/90 shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl">
        {/* Top Player Navigation & Course Title Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/8 bg-black/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-500 text-white font-bold text-xs shadow-md">
              03
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                Next.js 16 App Router & Fullstack Systems
              </p>
              <p className="text-[10px] text-zinc-400 font-mono">
                MODULE 1 • LESSON 3 OF 46 • INTERACTIVE CHECKPOINT
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 rounded-xl border border-white/8 bg-white/[0.03] p-1">
            <button
              onClick={() => setActiveTab("video")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                activeTab === "video"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Play className="h-3.5 w-3.5" />
              Video Lecture
            </button>
            <button
              onClick={() => setActiveTab("quiz")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                activeTab === "quiz"
                  ? "bg-violet-500/20 text-violet-300 border border-violet-400/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <HelpCircle className="h-3.5 w-3.5" />
              Live Quiz Checkpoint
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                activeTab === "code"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Code2 className="h-3.5 w-3.5" />
              Code Sandbox
            </button>
          </div>
        </div>

        {/* Player Body Grid */}
        <div className="grid lg:grid-cols-[1fr_320px]">
          {/* Main Stage */}
          <div className="relative min-h-[420px] bg-black/80 p-6 sm:p-8 flex flex-col justify-between">
            {/* Mode 1: Video Player Simulation */}
            {activeTab === "video" && (
              <div className="flex flex-1 flex-col justify-between">
                <div className="relative aspect-video w-full rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black overflow-hidden flex flex-col items-center justify-center p-6 text-center shadow-inner">
                  <div className="absolute inset-0 bg-grid-tech opacity-15 pointer-events-none" />

                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-400 text-zinc-950 shadow-xl shadow-cyan-400/40 hover:scale-110 active:scale-95 transition"
                  >
                    {isPlaying ? (
                      <Pause className="h-7 w-7 fill-current" />
                    ) : (
                      <Play className="h-7 w-7 fill-current ml-1" />
                    )}
                  </button>

                  <h3 className="mt-4 text-base font-bold text-white">
                    RSC Execution Mechanics & Streaming Protocols
                  </h3>
                  <p className="mt-1 text-xs text-zinc-400 max-w-sm">
                    {isPlaying
                      ? "Playing sample lecture stream (1080p 60fps)..."
                      : "Click play to preview the audio-visual lecture demonstration."}
                  </p>

                  {/* Player Controls Bar */}
                  <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/80 px-4 py-3 flex items-center justify-between gap-4 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="text-white hover:text-cyan-300"
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </button>
                      <span className="text-[11px] font-mono text-zinc-400">
                        04:15 / 18:40
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex-1 mx-4 h-1.5 rounded-full bg-white/10 overflow-hidden cursor-pointer">
                      <div className="h-full w-1/4 rounded-full bg-gradient-to-r from-cyan-400 to-violet-400" />
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-300 bg-white/6 px-2 py-0.5 rounded-md">
                        {(["1x", "1.5x", "2x"] as const).map((spd) => (
                          <button
                            key={spd}
                            onClick={() => setPlaybackSpeed(spd)}
                            className={`px-1 rounded ${
                              playbackSpeed === spd ? "text-cyan-300 font-black" : "text-zinc-500"
                            }`}
                          >
                            {spd}
                          </button>
                        ))}
                      </div>
                      <Volume2 className="h-4 w-4 text-zinc-400" />
                      <Maximize2 className="h-4 w-4 text-zinc-400" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mode 2: Interactive Quiz Checkpoint (Udemy / Coursera benchmark) */}
            {activeTab === "quiz" && (
              <div className="flex flex-1 flex-col justify-between py-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-violet-400 uppercase tracking-widest flex items-center gap-1.5">
                      <HelpCircle className="h-4 w-4" /> Concept Verification Checkpoint
                    </span>
                    <span className="text-xs font-mono text-zinc-400">Pass Rate: 94%</span>
                  </div>

                  <h3 className="mt-3 text-lg sm:text-xl font-black text-white">
                    When using React Server Components in Next.js 16, where does data fetching execute?
                  </h3>
                  <p className="mt-1 text-xs text-zinc-400">
                    Select the statement that accurately describes the execution lifecycle.
                  </p>

                  <div className="mt-6 space-y-3">
                    {quizOptions.map((opt) => {
                      const isSelected = selectedQuizOption === opt.id;
                      let optionClasses =
                        "border-white/10 bg-white/[0.02] text-zinc-300 hover:border-white/20 hover:bg-white/[0.05]";

                      if (isAnswerSubmitted) {
                        if (opt.isCorrect) {
                          optionClasses =
                            "border-emerald-500/50 bg-emerald-500/10 text-emerald-200 shadow-md shadow-emerald-500/10";
                        } else if (isSelected && !opt.isCorrect) {
                          optionClasses =
                            "border-rose-500/50 bg-rose-500/10 text-rose-200";
                        }
                      } else if (isSelected) {
                        optionClasses = "border-violet-400 bg-violet-500/10 text-white";
                      }

                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleSelectOption(opt.id)}
                          className={`w-full text-left rounded-2xl border p-4 text-xs font-semibold transition-all cursor-pointer flex items-start gap-3 ${optionClasses}`}
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/6 font-mono text-[11px] font-bold text-white">
                            {opt.id.toUpperCase()}
                          </span>
                          <span className="mt-0.5 leading-relaxed">{opt.text}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback explanation alert */}
                  <AnimatePresence>
                    {isAnswerSubmitted && selectedAnswer && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mt-5 rounded-2xl p-4 text-xs font-medium border ${
                          selectedAnswer.isCorrect
                            ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                            : "bg-rose-950/40 border-rose-500/30 text-rose-300"
                        }`}
                      >
                        <p className="font-bold flex items-center gap-1.5">
                          {selectedAnswer.isCorrect ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                              Great job! That is correct.
                            </>
                          ) : (
                            <>
                              <ShieldAlert className="h-4 w-4 text-rose-400" />
                              Incorrect option selected.
                            </>
                          )}
                        </p>
                        <p className="mt-1 text-zinc-300 leading-relaxed">
                          {selectedAnswer.explanation}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Mode 3: Code Sandbox */}
            {activeTab === "code" && (
              <div className="flex flex-1 flex-col justify-between">
                <div className="rounded-2xl border border-white/10 bg-zinc-950 p-4 font-mono text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-white/8 text-zinc-400">
                    <span className="text-[11px] text-zinc-300 font-bold">
                      app/dashboard/analytics/page.tsx
                    </span>
                    <span className="text-[10px] text-cyan-400 font-bold bg-cyan-400/10 px-2 py-0.5 rounded">
                      Async Server Component
                    </span>
                  </div>
                  <pre className="mt-4 text-zinc-300 overflow-x-auto leading-relaxed">
                    <code>{`import { db } from "@/lib/db";
import { Suspense } from "react";
import ActivityGraph from "@/components/ActivityGraph";

// Direct server-side DB query - zero API waterfalls!
export default async function AnalyticsPage() {
  const telemetry = await db.telemetry.getAggregates();

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Live Student Throughput</h1>
      <Suspense fallback={<p>Streaming telemetry...</p>}>
        <ActivityGraph initialData={telemetry} />
      </Suspense>
    </div>
  );
}`}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Right Syllabus Playlist Sidebar (Udemy signature) */}
          <div className="border-t lg:border-t-0 lg:border-l border-white/8 bg-zinc-950/60 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/8">
                <span className="text-xs font-black uppercase tracking-wider text-zinc-300">
                  Course Syllabus
                </span>
                <span className="text-[10px] text-cyan-400 font-bold">46 Lectures</span>
              </div>

              <div className="mt-4 space-y-2.5">
                {[
                  { title: "1. Next.js 16 Paradigm Shift", time: "14:20", done: true, type: "video" },
                  { title: "2. Streaming & Suspense Bounds", time: "18:45", done: true, type: "video" },
                  { title: "3. Checkpoint: Server Execution", time: "05:00", active: true, type: "quiz" },
                  { title: "4. Optimistic Server Actions", time: "22:10", locked: true, type: "video" },
                  { title: "5. Realtime PostgreSql RLS Lab", time: "45:00", locked: true, type: "assignment" },
                ].map((item, idx) => (
                  <div
                    key={item.title}
                    className={`flex items-center justify-between rounded-xl p-2.5 text-xs transition ${
                      item.active
                        ? "bg-violet-500/15 border border-violet-400/30 text-white font-bold"
                        : item.locked
                        ? "opacity-50 text-zinc-500"
                        : "text-zinc-300 hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {item.done ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      ) : item.active ? (
                        <Sparkles className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                      ) : (
                        <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[9px]">
                          {idx + 1}
                        </span>
                      )}
                      <span className="truncate">{item.title}</span>
                    </div>
                    <span className="text-[10px] font-mono shrink-0 ml-2">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Unlock All Lessons Card */}
            <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-950/20 p-4 text-center">
              <p className="text-xs font-bold text-white">
                Unlock All 46 Modules
              </p>
              <p className="mt-1 text-[11px] text-zinc-400">
                Enroll free to access quizzes, assignments, and verified certificates.
              </p>
              <Link
                href="/register"
                className="mt-3.5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-cyan-400 py-2 text-xs font-black text-zinc-950 hover:bg-cyan-300 transition"
              >
                Start Free Account
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
