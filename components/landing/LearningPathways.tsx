"use client";

import React, { useState } from "react";
import {
  Compass,
  Code2,
  CheckCircle2,
  Award,
  ArrowRight,
  Sparkles,
  Zap,
} from "lucide-react";
import { SpotlightCard } from "@/components/motion";

const STEPS = [
  {
    step: "01",
    title: "Guided Academic Roadmaps",
    tagline: "Curated learning paths calibrated to market demands.",
    description:
      "No more disjointed tutorials. Every course offers sequenced modules that build systematically from foundational principles to production-level architecture.",
    icon: Compass,
    accentColor: "cyan",
    highlight: "Zero knowledge gaps",
  },
  {
    step: "02",
    title: "Hands-on Code & Sandbox Practice",
    tagline: "Learn by building actual production artifacts.",
    description:
      "Solidify concepts with integrated coding exercises, interactive quizzes with instant explanation feedback, and downloadable starter templates.",
    icon: Code2,
    accentColor: "violet",
    highlight: "Immediate feedback loops",
  },
  {
    step: "03",
    title: "Real-Time Telemetry & Progress",
    tagline: "Know exactly where you stand and what to conquer next.",
    description:
      "AURA tracks your exact study velocity, quiz completion streaks, lesson retention milestones, and assignment submission reviews in your personal dashboard.",
    icon: Zap,
    accentColor: "emerald",
    highlight: "Live momentum metrics",
  },
  {
    step: "04",
    title: "Verifiable Credential & Portfolio",
    tagline: "Stand out to hiring managers and technical recruiters.",
    description:
      "Upon completing all modules and passing final evaluations, receive an accredited digital certificate with a public cryptographic verification link.",
    icon: Award,
    accentColor: "amber",
    highlight: "1-Click LinkedIn share",
  },
];

export default function LearningPathways() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section className="relative border-y border-white/8 bg-white/[0.015] py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">
            <Sparkles className="h-3 w-3" />
            The Academic Methodology
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
            How Learning on AURA Works
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-400">
            A battle-tested progression engineered to take you from foundational understanding to verifiable senior-level capability.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((item, idx) => {
            const Icon = item.icon;
            const isSelected = activeStep === idx;

            return (
              <SpotlightCard
                key={item.step}
                spotlightColor="rgba(6, 182, 212, 0.12)"
                onClick={() => setActiveStep(idx)}
                className={`relative flex flex-col justify-between p-7 border cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? "border-cyan-400/40 bg-zinc-950/80 shadow-xl shadow-cyan-500/10 scale-[1.02]"
                    : "border-white/8 bg-zinc-950/40 hover:border-white/18"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-md border border-cyan-400/20">
                      STEP {item.step}
                    </span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] text-zinc-200 border border-white/8">
                      <Icon className="h-5 w-5 text-cyan-300" />
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-black text-white">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs font-bold text-cyan-300/80">
                    {item.tagline}
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-zinc-400">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/6 flex items-center justify-between text-[11px] font-bold text-emerald-400">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {item.highlight}
                  </span>
                </div>
              </SpotlightCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
