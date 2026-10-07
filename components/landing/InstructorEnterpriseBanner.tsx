"use client";

import React from "react";
import Link from "next/link";
import {
  GraduationCap,
  Building2,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Users,
  Sparkles,
  BarChart3,
  Award,
} from "lucide-react";
import { SpotlightCard } from "@/components/motion";

export default function InstructorEnterpriseBanner() {
  return (
    <section className="relative mx-auto max-w-7xl px-5 py-20 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Banner 1: Teach on AURA (Udemy hallmark) */}
        <SpotlightCard
          spotlightColor="rgba(6, 182, 212, 0.16)"
          className="relative overflow-hidden border border-white/10 bg-gradient-to-br from-cyan-950/20 via-zinc-950 to-zinc-950 p-8 sm:p-10 flex flex-col justify-between"
        >
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 shadow-inner">
              <GraduationCap className="h-6 w-6" />
            </div>

            <span className="mt-6 inline-block text-[10px] font-black uppercase tracking-[0.22em] text-cyan-400">
              For Educators & Experts
            </span>
            <h3 className="mt-2 text-2xl sm:text-3xl font-black text-white tracking-tight">
              Teach on AURA. Share Your Craft.
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Publish structured courses, design auto-graded quizzes, and monetize your technical expertise with an 80/20 instructor revenue split and deep student telemetry.
            </p>

            <ul className="mt-6 space-y-2.5 text-xs text-zinc-300">
              <li className="flex items-center gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400/20 text-cyan-300 text-[10px]">✓</span>
                Interactive lesson editor with bulk lesson importer & cloning
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400/20 text-cyan-300 text-[10px]">✓</span>
                Real-time cohort drop-off analytics & quiz submission logs
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400/20 text-cyan-300 text-[10px]">✓</span>
                Automated monthly payouts via UPI and Direct Bank Transfer
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-white/8 flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">
              80% Instructor Net Payout
            </span>
            <Link
              href="/register?role=pending_teacher"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-black text-zinc-950 hover:bg-cyan-300 transition shadow-lg shadow-cyan-400/20"
            >
              Apply as Instructor
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </SpotlightCard>

        {/* Banner 2: AURA for Enterprise (Coursera hallmark) */}
        <SpotlightCard
          spotlightColor="rgba(139, 92, 246, 0.16)"
          className="relative overflow-hidden border border-white/10 bg-gradient-to-br from-violet-950/20 via-zinc-950 to-zinc-950 p-8 sm:p-10 flex flex-col justify-between"
        >
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-400/20 text-violet-300 shadow-inner">
              <Building2 className="h-6 w-6" />
            </div>

            <span className="mt-6 inline-block text-[10px] font-black uppercase tracking-[0.22em] text-violet-400">
              For Engineering Teams & Orgs
            </span>
            <h3 className="mt-2 text-2xl sm:text-3xl font-black text-white tracking-tight">
              AURA for Teams & Enterprise.
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Upskill entire engineering and product design teams with team analytics dashboards, centralized billing, custom learning tracks, and enterprise SSO.
            </p>

            <ul className="mt-6 space-y-2.5 text-xs text-zinc-300">
              <li className="flex items-center gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-400/20 text-violet-300 text-[10px]">✓</span>
                Team-wide progress tracking and completion benchmark reports
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-400/20 text-violet-300 text-[10px]">✓</span>
                Custom private courses and internal onboarding academies
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-400/20 text-violet-300 text-[10px]">✓</span>
                Audit logs, SAML SSO, and priority dedicated technical support
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-white/8 flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">
              Custom Seat Packaging
            </span>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.05] px-5 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition"
            >
              Explore Team Plans
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </SpotlightCard>
      </div>
    </section>
  );
}
