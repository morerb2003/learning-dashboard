"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LockKeyhole,
  MessageSquareText,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  UserRoundCheck,
  Users,
  Zap,
  Award,
} from "lucide-react";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import HeroPreviewTabs from "@/components/landing/HeroPreviewTabs";
import FaqAccordion from "@/components/landing/FaqAccordion";
import CourseCatalogExplorer from "@/components/landing/CourseCatalogExplorer";
import InteractiveLessonPlayer from "@/components/landing/InteractiveLessonPlayer";
import CertificateShowcase from "@/components/landing/CertificateShowcase";
import CareerOutcomesReviews from "@/components/landing/CareerOutcomesReviews";
import LearningPathways from "@/components/landing/LearningPathways";
import InstructorEnterpriseBanner from "@/components/landing/InstructorEnterpriseBanner";
import {
  SpotlightCard,
  AnimatedCounter,
  FadeIn,
  Stagger,
  StaggerItem,
  TextReveal,
  FloatingBadge,
} from "@/components/motion";

const roleFeatures = [
  {
    eyebrow: "For students",
    title: "Own your learning journey",
    description:
      "Move from discovery to completion with a focused workspace that keeps every next step clear and achievable.",
    icon: GraduationCap,
    accent: "violet",
    spotlightColor: "rgba(139, 92, 246, 0.16)",
    items: [
      "Course enrollment & live progress tracking",
      "Interactive quizzes with instant explanation feedback",
      "Hands-on assignment submissions & grading",
      "Cryptographically verifiable completion certificates",
    ],
  },
  {
    eyebrow: "For teachers",
    title: "Teach with better signals",
    description:
      "Create structured learning paths and identify immediately where learners thrive or need targeted support.",
    icon: BookOpen,
    accent: "cyan",
    spotlightColor: "rgba(6, 182, 212, 0.16)",
    items: [
      "Modular course, lesson, quiz & assignment builder",
      "Real-time learner analytics & cohort drop-off trends",
      "Assignment review & feedback workflows",
      "Automated monthly revenue payouts with 80% split",
    ],
  },
  {
    eyebrow: "For admins",
    title: "Run the platform confidently",
    description:
      "Maintain security, monitor system health, moderate content, and oversee user activity from one high-clarity console.",
    icon: ShieldCheck,
    accent: "emerald",
    spotlightColor: "rgba(16, 185, 129, 0.16)",
    items: [
      "User, instructor approval & role management",
      "System audit trails & telemetry activity logs",
      "Content moderation & refund workflows",
      "Platform-wide financial and performance metrics",
    ],
  },
];

const faqs = [
  {
    question: "How do AURA's certificates compare to platforms like Coursera & Udemy?",
    answer:
      "Every AURA certificate includes a unique verification ID, cryptographically hashed completion record, and direct 1-click sharing to LinkedIn. Employers and university evaluators can verify student authenticity without requiring account registration.",
  },
  {
    question: "Can teachers publish, price, and monetize their own courses?",
    answer:
      "Yes! Teachers receive an 80/20 revenue split with automated monthly payouts via UPI or direct bank transfer. Instructors get full access to course cloning, bulk lesson imports, automated quiz grading, and real-time student drop-off telemetry.",
  },
  {
    question: "What does the learning experience include?",
    answer:
      "Each course provides a structured multi-module curriculum, high-definition video lectures, curated notes, live code sandboxes, interactive knowledge checks, and hands-on capstone projects reviewed by instructors.",
  },
  {
    question: "Is there an enterprise tier for engineering and design teams?",
    answer:
      "Yes. AURA for Enterprise offers centralized seat licensing, team analytics dashboards, SSO integration, dedicated technical support, and the ability to author custom internal company onboarding tracks.",
  },
  {
    question: "Is role-based security strictly enforced?",
    answer:
      "Yes. Student, instructor, and admin environments are secured by server-side authentication, Row-Level Security (RLS) in PostgreSQL, and rate-limited API routes backed by Upstash Redis.",
  },
];

const stats = [
  {
    numericValue: 18,
    suffix: "+",
    label: "Academic Tracks",
    icon: BookOpen,
    color: "text-cyan-400",
  },
  {
    numericValue: 35,
    suffix: "k+",
    label: "Certificates Issued",
    icon: Award,
    color: "text-violet-400",
  },
  {
    numericValue: 4.9,
    suffix: "★",
    label: "Average Rating",
    icon: Star,
    color: "text-amber-400",
  },
  {
    numericValue: 99.4,
    suffix: "%",
    label: "Platform Uptime",
    icon: LayoutDashboard,
    color: "text-emerald-400",
  },
];

export default function LandingView() {
  const [heroSearch, setHeroSearch] = useState("");

  return (
    <main className="min-h-screen overflow-hidden bg-[#030303] text-zinc-100 relative selection:bg-cyan-500/30 selection:text-white">
      {/* Dynamic Background Mesh Layers */}
      <div className="pointer-events-none fixed inset-0 bg-grid-tech opacity-35" />
      <div className="pointer-events-none fixed -top-40 -left-40 h-[650px] w-[650px] rounded-full bg-violet-600/10 blur-[130px] animate-pulse-glow" />
      <div className="pointer-events-none fixed top-1/3 -right-40 h-[600px] w-[600px] rounded-full bg-cyan-500/10 blur-[140px] animate-pulse-glow" />
      <div className="pointer-events-none fixed -bottom-20 left-1/4 h-[500px] w-[500px] rounded-full bg-indigo-600/8 blur-[120px]" />

      <PublicHeader user={null} />

      {/* ===================== HERO SECTION (Coursera/Udemy Benchmarked) ===================== */}
      <section className="relative mx-auto max-w-7xl px-5 pt-10 pb-16 lg:pt-16 lg:pb-28 lg:px-8">
        {/* Floating status badges */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <FloatingBadge
            icon={Zap}
            pulseColor="bg-cyan-400"
            duration={5}
            yOffset={6}
          >
            The Premier Fullstack Academy &amp; LMS
          </FloatingBadge>
          <div className="hidden sm:inline-flex">
            <FloatingBadge
              icon={Sparkles}
              pulseColor="bg-violet-400"
              delay={0.6}
              duration={6.5}
              yOffset={7}
            >
              Accredited Digital Credentials
            </FloatingBadge>
          </div>
        </div>

        <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="relative z-10">
            <h1 className="max-w-3xl text-4xl font-black leading-[0.96] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
              <span className="block text-zinc-100">
                <TextReveal text="Learn without limits." />
              </span>
              <span className="block mt-2 bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-400 bg-clip-text text-transparent drop-shadow-sm">
                <TextReveal text="Master production code." delay={0.2} />
              </span>
            </h1>

            <FadeIn delay={0.2} direction="up">
              <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
                Build real-world systems with structured curriculum, auto-graded quizzes, hands-on code reviews, and cryptographically verified certificates recognized by industry leaders.
              </p>
            </FadeIn>

            {/* Coursera/Udemy-style Hero Search Bar */}
            <FadeIn delay={0.25} direction="up">
              <div className="mt-8 relative max-w-lg">
                <div className="flex items-center rounded-2xl border border-white/12 bg-zinc-950/80 p-1.5 backdrop-blur-xl shadow-xl shadow-cyan-500/5 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400 transition-all">
                  <Search className="h-4 w-4 ml-3 text-zinc-400 shrink-0" />
                  <input
                    type="text"
                    value={heroSearch}
                    onChange={(e) => setHeroSearch(e.target.value)}
                    placeholder="What skill do you want to master today? (e.g. Next.js, AI, Postgres)"
                    className="w-full bg-transparent px-3 py-2 text-xs font-semibold text-white placeholder-zinc-500 focus:outline-none"
                  />
                  <a
                    href="#catalog"
                    className="shrink-0 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-400 px-4 py-2 text-xs font-black text-zinc-950 hover:brightness-110 active:scale-95 transition"
                  >
                    Explore
                  </a>
                </div>

                {/* Popular Keywords Chips (Udemy signature) */}
                <div className="mt-3 flex items-center gap-1.5 overflow-x-auto text-[11px] text-zinc-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 shrink-0">Popular:</span>
                  {["Next.js 16", "PostgreSQL RLS", "AI Agents", "Docker & Cloud", "Design Systems"].map((chip) => (
                    <a
                      key={chip}
                      href="#catalog"
                      className="rounded-lg bg-white/[0.04] border border-white/8 px-2.5 py-0.5 text-zinc-300 hover:text-white hover:border-cyan-400/40 transition shrink-0"
                    >
                      {chip}
                    </a>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* Hero Action Buttons */}
            <FadeIn delay={0.3} direction="up">
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="btn-shimmer inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-400 px-7 text-sm font-black text-zinc-950 shadow-2xl shadow-cyan-500/25 transition hover:brightness-110 active:scale-[0.97]"
                >
                  Start Learning Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#catalog"
                  className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.04] px-6 text-sm font-bold text-white transition hover:border-white/25 hover:bg-white/[0.08] active:scale-[0.97]"
                >
                  Browse Course Catalog
                  <ChevronRight className="h-4 w-4 text-zinc-400" />
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-semibold text-zinc-400">
                {[
                  "3 Tailored Role Workspaces",
                  "Verifiable Digital Badges",
                  "80/20 Instructor Revenue Split",
                ].map((item) => (
                  <span key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    {item}
                  </span>
                ))}
              </div>
            </FadeIn>
          </div>

          {/* Interactive Hero 3D Tilt Preview Mockup */}
          <div className="relative z-10">
            <HeroPreviewTabs />
          </div>
        </div>
      </section>

      {/* ===================== LOGO / TRUSTED-BY BANNER (Coursera benchmark) ===================== */}
      <section className="relative border-y border-white/8 bg-white/[0.01] py-8">
        <div className="mx-auto max-w-7xl px-5 text-center lg:px-8">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-400">
            Engineers &amp; instructors on AURA build with production technologies from
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-8 sm:gap-14 text-zinc-400 font-black text-sm tracking-widest uppercase opacity-85">
            <span className="hover:text-white transition">▲ Vercel</span>
            <span className="hover:text-white transition">⚡ Supabase</span>
            <span className="hover:text-white transition">✦ Stripe</span>
            <span className="hover:text-white transition">⬡ Docker</span>
            <span className="hover:text-white transition">🐘 PostgreSQL</span>
            <span className="hover:text-white transition">◆ Upstash</span>
          </div>
        </div>
      </section>

      {/* ===================== ANIMATED STATS BAR ===================== */}
      <section className="relative border-b border-white/8 bg-white/[0.02] backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl grid-cols-2 px-5 py-2 md:grid-cols-4 lg:px-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`flex items-center gap-4 px-4 py-8 md:px-8 ${
                  idx < stats.length - 1 ? "border-b md:border-b-0 md:border-r border-white/6" : ""
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/8 shadow-inner">
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-black text-white sm:text-3xl tracking-tight flex items-center">
                    <AnimatedCounter
                      to={stat.numericValue}
                      suffix={stat.suffix}
                    />
                  </p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    {stat.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===================== SIGNATURE SECTION 1: COURSE CATALOG EXPLORER (Udemy & Coursera benchmark) ===================== */}
      <CourseCatalogExplorer />

      {/* ===================== SIGNATURE SECTION 2: INTERACTIVE LESSON PLAYER SANDBOX ===================== */}
      <InteractiveLessonPlayer />

      {/* ===================== SIGNATURE SECTION 3: 4-STEP METHODOLOGY PATHWAY ===================== */}
      <LearningPathways />

      {/* ===================== ROLE WORKSPACES (SPOTLIGHT CARDS) ===================== */}
      <section id="features" className="relative mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
        <FadeIn direction="up">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">
              <Sparkles className="h-3 w-3" />
              Tailored Architecture
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
              One ecosystem. Three purpose-built workspaces.
            </h2>
            <p className="mt-4 text-sm sm:text-base leading-relaxed text-zinc-400">
              Students, instructors, and administrators operate inside dedicated
              environments crafted to accelerate their primary workflows.
            </p>
          </div>
        </FadeIn>

        <Stagger className="mt-14 grid gap-6 lg:grid-cols-3" staggerDelay={0.12}>
          {roleFeatures.map((feature) => {
            const Icon = feature.icon;
            const accentBadgeStyles = {
              violet: "border-violet-400/20 bg-violet-500/10 text-violet-300",
              cyan: "border-cyan-400/20 bg-cyan-500/10 text-cyan-300",
              emerald: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
            }[feature.accent];

            return (
              <StaggerItem key={feature.title}>
                <SpotlightCard
                  spotlightColor={feature.spotlightColor}
                  className="h-full flex flex-col justify-between"
                >
                  <div>
                    <div
                      className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border shadow-inner ${accentBadgeStyles}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <p className="mt-6 text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">
                      {feature.eyebrow}
                    </p>
                    <h3 className="mt-2 text-xl font-black text-white">
                      {feature.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-zinc-400">
                      {feature.description}
                    </p>
                  </div>

                  <ul className="mt-8 space-y-3 pt-6 border-t border-white/6">
                    {feature.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-3 text-xs font-semibold text-zinc-300"
                      >
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/6 text-zinc-300">
                          <Check className="h-3 w-3" />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </SpotlightCard>
              </StaggerItem>
            );
          })}
        </Stagger>
      </section>

      {/* ===================== SIGNATURE SECTION 4: CERTIFICATE SHOWCASE (Coursera signature) ===================== */}
      <CertificateShowcase />

      {/* ===================== SIGNATURE SECTION 5: CAREER OUTCOMES & REVIEWS (Coursera benchmark) ===================== */}
      <CareerOutcomesReviews />

      {/* ===================== SIGNATURE SECTION 6: INSTRUCTOR & ENTERPRISE DUAL BANNER (Udemy benchmark) ===================== */}
      <InstructorEnterpriseBanner />

      {/* ===================== FAQ ACCORDION ===================== */}
      <section id="faq" className="relative border-y border-white/8 bg-white/[0.015]">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-24 lg:grid-cols-[0.7fr_1.3fr] lg:px-8 lg:py-32">
          <FadeIn direction="left">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">
                Support &amp; Details
              </span>
              <h2 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight text-white">
                Frequently Asked
                <span className="block text-zinc-500">Questions.</span>
              </h2>
              <p className="mt-4 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Have more questions about courses, certifications, or instructor payouts? Explore our community discussions or sign up to get started.
              </p>
            </div>
          </FadeIn>

          <FadeIn direction="up">
            <FaqAccordion items={faqs} />
          </FadeIn>
        </div>
      </section>

      {/* ===================== FINAL CALL TO ACTION ===================== */}
      <section className="relative mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-violet-500/25 bg-gradient-to-b from-violet-950/30 via-zinc-950 to-zinc-950 px-6 py-20 text-center sm:px-14 shadow-2xl">
          <div className="absolute inset-0 bg-mesh-violet opacity-60 pointer-events-none" />
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
          <div className="grain-overlay" />

          <div className="relative mx-auto max-w-2xl z-10">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-violet-200 border border-white/15 shadow-xl">
              <UserRoundCheck className="h-7 w-7" />
            </span>
            <h2 className="mt-7 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
              Ready to master production software skills?
            </h2>
            <p className="mt-4 text-sm sm:text-base leading-relaxed text-zinc-300">
              Join thousands of students and instructors on an academic platform crafted for speed, verifiable skills, and real career impact.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                href="/register"
                className="btn-shimmer inline-flex h-13 w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-white px-8 text-sm font-black text-zinc-950 transition hover:bg-zinc-200 active:scale-[0.97]"
              >
                Create Free Account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#catalog"
                className="inline-flex h-13 w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.05] px-8 text-sm font-bold text-white transition hover:bg-white/10 active:scale-[0.97]"
              >
                Explore Course Catalog
              </a>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
