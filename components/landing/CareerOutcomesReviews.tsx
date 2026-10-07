"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Star,
  CheckCircle2,
  TrendingUp,
  Award,
  Sparkles,
  ArrowUpRight,
  Briefcase,
  Quote,
} from "lucide-react";
import { SpotlightCard } from "@/components/motion";

interface OutcomeStory {
  name: string;
  avatar: string;
  initialRole: string;
  outcomeRole: string;
  company: string;
  courseCompleted: string;
  rating: number;
  salaryGrowth: string;
  category: "pivot" | "engineering" | "design" | "promotion";
  quote: string;
}

const STORIES: OutcomeStory[] = [
  {
    name: "Alex Rivera",
    avatar: "AR",
    initialRole: "Junior Support Specialist",
    outcomeRole: "Fullstack Systems Engineer",
    company: "FinTech Scaleup",
    courseCompleted: "Next.js 16 App Router & Fullstack Systems",
    rating: 5,
    salaryGrowth: "+65% Compensation",
    category: "pivot",
    quote:
      "AURA was the turning point in my engineering career. Instead of passive tutorials, building hands-on assignments with automated grading and adding the verifiable credential to my LinkedIn gave hiring teams 100% confidence.",
  },
  {
    name: "Elena Rostova",
    avatar: "ER",
    initialRole: "Data Analyst",
    outcomeRole: "AI Systems Architect",
    company: "Autonomous AI Lab",
    courseCompleted: "AI Agents & Autonomous LLM Systems",
    rating: 5,
    salaryGrowth: "+80% Compensation",
    category: "engineering",
    quote:
      "The curriculum in AI orchestration went far beyond superficial wrapper demos. We built production-grade tool loops and vector RAG indices that directly mapped to the technical problems our company was tackling.",
  },
  {
    name: "Jordan Vance",
    avatar: "JV",
    initialRole: "UI Designer",
    outcomeRole: "Lead Design Systems Engineer",
    company: "Enterprise SaaS",
    courseCompleted: "Design Systems & High-End Motion UX",
    rating: 5,
    salaryGrowth: "+40% Promotion",
    category: "design",
    quote:
      "Learning math-calibrated typography and Framer Motion spring physics on AURA helped me bridge the gap between design and production engineering. I was promoted to Lead within 4 months.",
  },
  {
    name: "Siddharth Nair",
    avatar: "SN",
    initialRole: "Backend Developer",
    outcomeRole: "Principal Site Reliability Architect",
    company: "Cloud Infrastructure",
    courseCompleted: "Distributed Systems & Cloud DevOps",
    rating: 5,
    salaryGrowth: "+50% Compensation",
    category: "promotion",
    quote:
      "The live telemetry and Postgres Row-Level Security deep-dives are best in class. The instructors have real production scars, not just academic textbook theory.",
  },
];

export default function CareerOutcomesReviews() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredStories =
    selectedCategory === "all"
      ? STORIES
      : STORIES.filter((s) => s.category === selectedCategory);

  return (
    <section id="reviews" className="relative mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
      {/* Top Coursera-style Outcome Impact Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-r from-violet-950/40 via-zinc-950 to-cyan-950/40 p-8 sm:p-12 shadow-2xl">
        <div className="absolute inset-0 bg-grid-tech opacity-15 pointer-events-none" />

        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">
              <TrendingUp className="h-3 w-3" />
              Verified Learner Outcomes
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
              Real Skills. Real Career Transformations.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-zinc-300 max-w-xl">
              According to our 2026 Learner Impact Study, AURA graduates report accelerated promotion cycles, career pivots, and tangible mastery backed by accredited digital credentials.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-5 text-center">
              <p className="text-3xl sm:text-4xl font-black text-white">89%</p>
              <p className="mt-1 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Career Advancement
              </p>
              <p className="mt-1 text-[11px] text-zinc-400">
                reported a promotion, raise, or new job offer
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/40 p-5 text-center">
              <p className="text-3xl sm:text-4xl font-black text-white">4.9★</p>
              <p className="mt-1 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                Average Rating
              </p>
              <p className="mt-1 text-[11px] text-zinc-400">
                from 18,000+ verified course reviews
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mt-14 flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-white/8">
        <div>
          <h3 className="text-xl font-black text-white">
            Alumni Stories & Verified Reviews
          </h3>
          <p className="text-xs text-zinc-400">
            Hear directly from developers and designers who leveled up their craft.
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: "all", label: "All Stories" },
            { id: "pivot", label: "Career Pivots" },
            { id: "engineering", label: "Engineering" },
            { id: "design", label: "Design Systems" },
            { id: "promotion", label: "Promotions" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                selectedCategory === tab.id
                  ? "bg-white text-zinc-950 font-black shadow-md"
                  : "bg-white/[0.04] text-zinc-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stories Grid */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {filteredStories.map((story) => (
          <SpotlightCard
            key={story.name}
            spotlightColor="rgba(139, 92, 246, 0.12)"
            className="flex flex-col justify-between p-7 border border-white/8 bg-zinc-950/70"
          >
            <div>
              {/* Top rating and transition badge */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex gap-1 text-amber-400">
                  {Array.from({ length: story.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-black text-emerald-300">
                  {story.salaryGrowth}
                </span>
              </div>

              {/* Career Transition Pill (Coursera signature outcome) */}
              <div className="mt-5 rounded-xl bg-white/[0.03] border border-white/6 p-3 flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">
                    Before
                  </span>
                  <span className="text-zinc-300 font-semibold truncate block">
                    {story.initialRole}
                  </span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-cyan-400 shrink-0 mx-1" />
                <div className="min-w-0 text-right">
                  <span className="text-[10px] text-cyan-400 uppercase tracking-widest block font-bold">
                    Now at {story.company}
                  </span>
                  <span className="text-white font-bold truncate block">
                    {story.outcomeRole}
                  </span>
                </div>
              </div>

              {/* Testimonial Quote */}
              <blockquote className="mt-5 text-sm leading-relaxed text-zinc-300 font-medium">
                &ldquo;{story.quote}&rdquo;
              </blockquote>
            </div>

            {/* Author Footer */}
            <div className="mt-6 flex items-center justify-between pt-5 border-t border-white/6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 to-cyan-500 font-bold text-xs text-white">
                  {story.avatar}
                </div>
                <div>
                  <p className="text-xs font-black text-white flex items-center gap-1.5">
                    {story.name}
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                  </p>
                  <p className="text-[10px] text-zinc-400 font-medium truncate max-w-[200px]">
                    {story.courseCompleted}
                  </p>
                </div>
              </div>

              <span className="text-[10px] text-zinc-400 font-mono">
                Verified Alumnus
              </span>
            </div>
          </SpotlightCard>
        ))}
      </div>
    </section>
  );
}
