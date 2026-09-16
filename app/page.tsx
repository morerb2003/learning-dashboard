import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Award,
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
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  UserRoundCheck,
  Users,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/roles";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import HeroPreviewTabs from "@/components/landing/HeroPreviewTabs";
import FaqAccordion from "@/components/landing/FaqAccordion";
import {
  SpotlightCard,
  AnimatedCounter,
  FadeIn,
  Stagger,
  StaggerItem,
  TextReveal,
  FloatingBadge,
} from "@/components/motion";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AURA | Learn Smarter. Teach Better.",
  description:
    "A modern learning platform for courses, quizzes, assignments, certificates, analytics, and community collaboration.",
};

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
      "Course enrollment & live progress",
      "Interactive quizzes with instant feedback",
      "Assignment submissions & grading",
      "Verifiable completion certificates",
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
      "Modular course & lesson builder",
      "Real-time learner analytics & trends",
      "Assignment review & feedback workflows",
      "Automated quiz assessment management",
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
      "User, instructor & role management",
      "System audit trails & activity logs",
      "Content moderation workflows",
      "Platform-wide performance metrics",
    ],
  },
];

const reasons = [
  { icon: Play, label: "Interactive modules & live media" },
  { icon: TrendingUp, label: "Real-time progress telemetry" },
  { icon: BarChart3, label: "Detailed instructor insights" },
  { icon: Award, label: "Cryptographically verified certs" },
  { icon: MessageSquareText, label: "Collaborative community forums" },
  { icon: LockKeyhole, label: "Enterprise role-based security" },
];

const faqs = [
  {
    question: "Who is AURA built for?",
    answer:
      "AURA provides tailor-made, distraction-free workspaces for students, teachers, and administrators, each optimized specifically for their goals and responsibilities.",
  },
  {
    question: "Can teachers publish and monetize complete courses?",
    answer:
      "Yes! Teachers can create multi-chapter courses, rich lessons, quizzes with automated scoring, and assignments, plus monitor student completion and metrics in real-time.",
  },
  {
    question: "How is student progress and certification verified?",
    answer:
      "Every lesson read, quiz passed, and assignment accepted counts toward verifiable milestones. Once complete, students receive shareable digital certificates with unique verification IDs.",
  },
  {
    question: "Is role-based security strictly enforced?",
    answer:
      "Yes. Student, teacher, and administrative interfaces are strictly guarded with server-side authentication, Row-Level Security (RLS) in PostgreSQL, and permission checks.",
  },
];

function roleDestination(role: string | null | undefined) {
  if (role === "admin") return "/admin";
  if (role === "teacher") return "/teacher";
  return "/learning";
}

export default async function LandingPage() {
  const supabase = await createClient();

  const [currentUser, { data: publicCourses }] = await Promise.all([
    getCurrentUser(),
    supabase
      .from("courses")
      .select("id, category, teacher_id")
      .eq("is_published", true),
  ]);

  if (currentUser) {
    redirect(roleDestination(currentUser.role));
  }

  const publishedCourses = publicCourses ?? [];
  const categoryCount = Math.max(
    1,
    new Set(publishedCourses.map((course) => course.category).filter(Boolean)).size
  );
  const instructorCount = Math.max(
    1,
    new Set(publishedCourses.map((course) => course.teacher_id).filter(Boolean)).size
  );
  const courseCount = Math.max(12, publishedCourses.length);

  const stats = [
    {
      numericValue: courseCount,
      suffix: "+",
      label: "Published Courses",
      icon: BookOpen,
      color: "text-violet-400",
    },
    {
      numericValue: categoryCount > 1 ? categoryCount : 8,
      suffix: " Fields",
      label: "Specializations",
      icon: Sparkles,
      color: "text-cyan-400",
    },
    {
      numericValue: instructorCount > 1 ? instructorCount : 24,
      suffix: "+",
      label: "Expert Instructors",
      icon: Users,
      color: "text-indigo-400",
    },
    {
      numericValue: 99.4,
      suffix: "%",
      label: "Platform Uptime",
      icon: LayoutDashboard,
      color: "text-emerald-400",
    },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#030303] text-zinc-100 relative selection:bg-cyan-500/30 selection:text-white">
      {/* Dynamic Background Mesh Layers */}
      <div className="pointer-events-none fixed inset-0 bg-grid-tech opacity-35" />
      <div className="pointer-events-none fixed -top-40 -left-40 h-[650px] w-[650px] rounded-full bg-violet-600/10 blur-[130px] animate-pulse-glow" />
      <div className="pointer-events-none fixed top-1/3 -right-40 h-[600px] w-[600px] rounded-full bg-cyan-500/10 blur-[140px] animate-pulse-glow" />
      <div className="pointer-events-none fixed -bottom-20 left-1/4 h-[500px] w-[500px] rounded-full bg-indigo-600/8 blur-[120px]" />

      <PublicHeader user={null} />

      {/* ===================== HERO SECTION ===================== */}
      <section className="relative mx-auto max-w-7xl px-5 pt-12 pb-20 lg:pt-20 lg:pb-32 lg:px-8">
        {/* Floating status badges above hero */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <FloatingBadge
            icon={Zap}
            pulseColor="bg-cyan-400"
            duration={5}
            yOffset={6}
          >
            Next-Gen Learning Operating System
          </FloatingBadge>
          <div className="hidden sm:inline-flex">
            <FloatingBadge
              icon={Sparkles}
              pulseColor="bg-violet-400"
              delay={0.6}
              duration={6.5}
              yOffset={7}
            >
              Realtime AI & Progress Telemetry
            </FloatingBadge>
          </div>
        </div>

        <div className="grid items-center gap-14 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="relative z-10">
            <h1 className="max-w-3xl text-5xl font-black leading-[0.94] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
              <span className="block text-zinc-100">
                <TextReveal text="Learn smarter." />
              </span>
              <span className="block mt-2 bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-400 bg-clip-text text-transparent drop-shadow-sm">
                <TextReveal text="Teach better." delay={0.2} />
              </span>
            </h1>

            <FadeIn delay={0.2} direction="up">
              <p className="mt-7 max-w-xl text-base leading-8 text-zinc-400 sm:text-lg">
                The modern fullstack platform uniting structured courses, smart
                quizzes, interactive assignments, certified credentials, and
                powerful instructor analytics in one unified workspace.
              </p>
            </FadeIn>

            {/* Hero CTAs */}
            <FadeIn delay={0.3} direction="up">
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="btn-shimmer inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-400 px-7 text-sm font-black text-zinc-950 shadow-2xl shadow-cyan-500/25 transition hover:brightness-110 active:scale-[0.97]"
                >
                  Start Learning Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login?next=/dashboard"
                  className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.04] px-6 text-sm font-bold text-white transition hover:border-white/25 hover:bg-white/[0.08] active:scale-[0.97]"
                >
                  Explore Course Catalog
                  <ChevronRight className="h-4 w-4 text-zinc-400" />
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-semibold text-zinc-400">
                {[
                  "3 Dedicated Role Workspaces",
                  "Verified Digital Badges",
                  "Zero Configuration Setup",
                ].map((item) => (
                  <span key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    {item}
                  </span>
                ))}
              </div>
            </FadeIn>
          </div>

          {/* Interactive Hero 3D Tilt Preview Mockup with Live Tab Switcher */}
          <div className="relative z-10">
            <HeroPreviewTabs />
          </div>
        </div>
      </section>

      {/* ===================== ANIMATED STATS BAR ===================== */}
      <section className="relative border-y border-white/8 bg-white/[0.02] backdrop-blur-xl">
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

      {/* ===================== ROLE WORKSPACES (SPOTLIGHT CARDS) ===================== */}
      <section id="features" className="relative mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
        <FadeIn direction="up">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">
              <Sparkles className="h-3 w-3" />
              Tailored Architecture
            </span>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
              One ecosystem. Three purpose-built workspaces.
            </h2>
            <p className="mt-5 text-base leading-7 text-zinc-400">
              Students, instructors, and managers operate inside dedicated
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
                    <p className="mt-6 text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
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

      {/* ===================== PLATFORM INTERACTIVE SHOWCASE ===================== */}
      <section id="platform" className="relative border-y border-white/8 bg-white/[0.015]">
        <div className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
          <FadeIn direction="up">
            <div className="text-center max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-violet-300">
                <BarChart3 className="h-3 w-3" />
                Live Platform Capabilities
              </span>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Clarity and momentum at every level.
              </h2>
              <p className="mt-4 text-base text-zinc-400">
                Real-time feedback loops replace guesswork with measurable student growth.
              </p>
            </div>
          </FadeIn>

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            {/* Teacher Analytics Spotlight Card */}
            <SpotlightCard
              spotlightColor="rgba(139, 92, 246, 0.18)"
              className="p-8!"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-violet-400">
                    Instructor Intelligence
                  </p>
                  <h3 className="mt-1 text-2xl font-black text-white">
                    Measure Engagement Trends
                  </h3>
                  <p className="mt-1 text-xs text-zinc-400">
                    Weekly quiz submissions & lesson throughput
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300 border border-violet-500/20">
                  <BarChart3 className="h-5 w-5" />
                </div>
              </div>

              {/* Animated Interactive Bar Chart Representation */}
              <div className="relative mt-8 flex h-56 items-end gap-3 rounded-2xl border border-white/6 bg-black/40 p-5">
                {[
                  { label: "Mon", h: 42 },
                  { label: "Tue", h: 64 },
                  { label: "Wed", h: 58 },
                  { label: "Thu", h: 84 },
                  { label: "Fri", h: 72 },
                  { label: "Sat", h: 92 },
                  { label: "Sun", h: 98 },
                ].map((bar, i) => (
                  <div key={bar.label} className="flex h-full flex-1 flex-col justify-end items-center gap-2">
                    <div className="w-full flex-1 flex items-end">
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-violet-600/70 via-indigo-500 to-cyan-300 transition-all duration-700 hover:brightness-125"
                        style={{ height: `${bar.h}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-bold uppercase text-zinc-500">{bar.label}</span>
                  </div>
                ))}
              </div>
            </SpotlightCard>

            {/* Course Workspace Spotlight Card */}
            <SpotlightCard
              spotlightColor="rgba(6, 182, 212, 0.18)"
              className="p-8!"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                    Student Velocity
                  </p>
                  <h3 className="mt-1 text-2xl font-black text-white">
                    Active Study Paths
                  </h3>
                  <p className="mt-1 text-xs text-zinc-400">
                    Continuous learning without losing context
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/20">
                  <BookOpen className="h-5 w-5" />
                </div>
              </div>

              <div className="relative mt-8 space-y-3.5">
                {[
                  { title: "Design Systems with React & Figma", progress: 88, icon: FileText, tag: "UI/UX" },
                  { title: "Distributed Systems with Node & Go", progress: 64, icon: Users, tag: "Backend" },
                  { title: "Production Database Modeling & RLS", progress: 42, icon: TrendingUp, tag: "Database" },
                ].map((course) => {
                  const Icon = course.icon;
                  return (
                    <div
                      key={course.title}
                      className="flex items-center gap-4 rounded-2xl border border-white/8 bg-black/40 p-4 transition-colors hover:border-white/18"
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-4 text-xs font-bold">
                          <span className="text-white truncate">{course.title}</span>
                          <span className="text-cyan-300 font-mono">{course.progress}%</span>
                        </div>
                        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/8">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SpotlightCard>
          </div>
        </div>
      </section>

      {/* ===================== WHY CHOOSE AURA ===================== */}
      <section id="why-aura" className="relative mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
        <div className="grid items-center gap-16 lg:grid-cols-[0.85fr_1.15fr]">
          <FadeIn direction="left">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">
                <CheckCircle2 className="h-3 w-3" />
                The AURA Advantage
              </span>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Engineered to turn daily study into mastered skills.
              </h2>
              <p className="mt-5 text-base leading-7 text-zinc-400">
                Every component inside AURA is connected. Progress on quizzes,
                lesson completions, and assignments immediately update your
                dashboard, portfolio, and completion certifications.
              </p>
              <Link
                href="/register"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white/8 border border-white/12 px-5 py-3 text-sm font-bold text-cyan-300 transition hover:bg-white/12 hover:text-white"
              >
                Create Free Account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </FadeIn>

          <Stagger className="grid gap-4 sm:grid-cols-2" staggerDelay={0.08}>
            {reasons.map((reason) => {
              const Icon = reason.icon;
              return (
                <StaggerItem key={reason.label}>
                  <div className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-5 backdrop-blur-md transition-all hover:border-white/18 hover:bg-white/[0.06]">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/6 text-zinc-200 border border-white/8">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-bold text-zinc-100">{reason.label}</span>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>

        {/* Testimonials */}
        <div className="mt-20 grid gap-6 md:grid-cols-2">
          {[
            {
              quote:
                "The AURA interface is unlike typical clunky LMS platforms. Everything from quizzes to assignment submissions is lightning fast and visually inspiring.",
              role: "Computer Science Student",
              author: "Alex Rivera",
            },
            {
              quote:
                "Having live course telemetry and automated quiz grading cuts my teaching admin work by 70%. It gives me time to focus on mentorship.",
              role: "Lead Fullstack Instructor",
              author: "Dr. Marcus Chen",
            },
          ].map((testimonial) => (
            <SpotlightCard
              key={testimonial.author}
              spotlightColor="rgba(255, 255, 255, 0.08)"
              className="p-8!"
            >
              <div className="flex gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-6 text-base font-bold leading-7 text-zinc-200">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <div className="mt-6 flex items-center justify-between border-t border-white/6 pt-4">
                <div>
                  <p className="text-sm font-black text-white">{testimonial.author}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </SpotlightCard>
          ))}
        </div>
      </section>

      {/* ===================== FAQ ACCORDION (WITH FRAMER MOTION) ===================== */}
      <section id="faq" className="relative border-y border-white/8 bg-white/[0.015]">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-24 lg:grid-cols-[0.7fr_1.3fr] lg:px-8 lg:py-32">
          <FadeIn direction="left">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">
                Support & Details
              </span>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-white">
                Frequently Asked
                <span className="block text-zinc-500">Questions.</span>
              </h2>
              <p className="mt-4 text-sm text-zinc-400 leading-6">
                Have more questions? Visit our community discussions or sign up to explore the curriculum.
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
            <h2 className="mt-7 text-4xl font-black tracking-tight text-white sm:text-5xl">
              Ready to experience modern learning?
            </h2>
            <p className="mt-4 text-base leading-7 text-zinc-300">
              Join thousands of students and teachers building skills on a platform
              crafted for speed, clarity, and real progress.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                href="/register"
                className="btn-shimmer inline-flex h-13 w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-white px-8 text-sm font-black text-zinc-950 transition hover:bg-zinc-200 active:scale-[0.97]"
              >
                Create Your Account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-13 w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.05] px-8 text-sm font-bold text-white transition hover:bg-white/10 active:scale-[0.97]"
              >
                Browse Catalog
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
