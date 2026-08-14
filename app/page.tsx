import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
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
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/roles";

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
      "Move from discovery to completion with a focused workspace that keeps every next step clear.",
    icon: GraduationCap,
    accent: "violet",
    items: [
      "Course enrollment",
      "Progress tracking",
      "Quizzes and assignments",
      "Completion certificates",
    ],
  },
  {
    eyebrow: "For teachers",
    title: "Teach with better signals",
    description:
      "Create structured learning experiences and understand where students are thriving or getting stuck.",
    icon: BookOpen,
    accent: "cyan",
    items: [
      "Course and lesson creation",
      "Student analytics",
      "Assignment workflows",
      "Quiz management",
    ],
  },
  {
    eyebrow: "For admins",
    title: "Run the platform confidently",
    description:
      "Keep users, content, moderation, and platform activity organized from one secure control center.",
    icon: ShieldCheck,
    accent: "emerald",
    items: [
      "User and role management",
      "Content moderation",
      "Activity logs",
      "Platform analytics",
    ],
  },
];

const reasons = [
  { icon: Play, label: "Interactive learning" },
  { icon: TrendingUp, label: "Real-time progress" },
  { icon: BarChart3, label: "Teacher analytics" },
  { icon: Award, label: "Verified certificates" },
  { icon: MessageSquareText, label: "Community discussions" },
  { icon: LockKeyhole, label: "Secure authentication" },
];

const faqs = [
  {
    question: "Who is AURA built for?",
    answer:
      "AURA gives students, teachers, and administrators dedicated workspaces designed around their responsibilities.",
  },
  {
    question: "Can teachers create complete courses?",
    answer:
      "Yes. Teachers can create courses, lessons, quizzes, and assignments, then monitor enrollment and performance.",
  },
  {
    question: "How is student progress tracked?",
    answer:
      "Lesson completion, quiz attempts, assignment submissions, and course progress are recorded throughout the learning journey.",
  },
  {
    question: "Is role-based access supported?",
    answer:
      "Yes. Student, teacher, and admin routes are protected with server-side authentication and role checks.",
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
  const categoryCount = new Set(
    publishedCourses.map((course) => course.category).filter(Boolean)
  ).size;
  const instructorCount = new Set(
    publishedCourses.map((course) => course.teacher_id).filter(Boolean)
  ).size;

  const stats = [
    {
      value: String(publishedCourses.length),
      label: "Published courses",
      icon: BookOpen,
    },
    {
      value: String(categoryCount),
      label: "Course categories",
      icon: Sparkles,
    },
    {
      value: String(instructorCount),
      label: "Active instructors",
      icon: Users,
    },
    {
      value: "3",
      label: "Role workspaces",
      icon: LayoutDashboard,
    },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#030303] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-mesh-violet opacity-40" />
      <div className="pointer-events-none fixed inset-0 bg-mesh-cyan opacity-20 mix-blend-screen" />

      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#030303]/75 backdrop-blur-2xl">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 lg:px-8"
        >
          <Link href="/" className="flex items-center gap-3" aria-label="AURA home">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500 to-cyan-400 shadow-lg shadow-violet-500/20">
              <GraduationCap className="h-5 w-5 text-white" />
            </span>
            <span>
              <span className="block text-sm font-black tracking-[0.22em] text-white">
                AURA
              </span>
              <span className="block text-[9px] font-bold uppercase tracking-[0.28em] text-zinc-500">
                Learning OS
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-7 text-xs font-bold text-zinc-400 md:flex">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#platform" className="transition hover:text-white">
              Platform
            </a>
            <a href="#why-aura" className="transition hover:text-white">
              Why AURA
            </a>
            <a href="#faq" className="transition hover:text-white">
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden h-10 items-center justify-center rounded-xl px-4 text-xs font-bold text-zinc-300 transition hover:bg-white/5 hover:text-white sm:inline-flex"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-zinc-950 transition hover:bg-cyan-100"
            >
              Get started
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </nav>
      </header>

      <section className="relative mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-7xl items-center gap-14 px-5 py-20 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:py-24">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-violet-200">
            <Sparkles className="h-3.5 w-3.5" />
            One platform. Every learning moment.
          </div>
          <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[0.96] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
            Learn smarter.
            <span className="block bg-linear-to-r from-cyan-300 via-sky-300 to-violet-400 bg-clip-text text-transparent">
              Teach better.
            </span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-8 text-zinc-400 sm:text-lg">
            A modern learning platform for courses, quizzes, assignments,
            certificates, analytics, and community collaboration.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-cyan-300 via-sky-300 to-violet-300 px-6 text-sm font-black text-zinc-950 shadow-2xl shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:brightness-110"
            >
              Start learning free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login?next=/dashboard"
              className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 text-sm font-bold text-white transition hover:border-white/20 hover:bg-white/10"
            >
              Explore courses
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-zinc-500">
            {["Role-based workspaces", "Google authentication", "Progress certificates"].map(
              (item) => (
                <span key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  {item}
                </span>
              )
            )}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-2xl lg:max-w-none">
          <div className="absolute -inset-12 rounded-full bg-violet-500/15 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/80 p-3 shadow-2xl shadow-black/50 backdrop-blur-xl">
            <div className="grain-overlay" />
            <div className="rounded-[1.45rem] border border-white/8 bg-[#08080a] p-4 sm:p-5">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                    <LayoutDashboard className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white">Student workspace</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                      Live learning overview
                    </p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/15 bg-emerald-400/8 px-2.5 py-1 text-[9px] font-bold text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  Connected
                </span>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-[1.35fr_0.65fr]">
                <div className="relative overflow-hidden rounded-2xl border border-violet-400/15 bg-violet-400/5 p-5">
                  <div className="absolute inset-0 bg-mesh-violet opacity-70" />
                  <div className="relative">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-300">
                      Continue learning
                    </p>
                    <h2 className="mt-3 text-lg font-black text-white">
                      Product Design Fundamentals
                    </h2>
                    <p className="mt-1 text-[10px] text-zinc-500">
                      Module 8 of 12
                    </p>
                    <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full w-[68%] rounded-full bg-linear-to-r from-violet-400 to-cyan-300" />
                    </div>
                    <div className="mt-2 flex justify-between text-[9px] font-bold text-zinc-500">
                      <span>Course progress</span>
                      <span className="text-cyan-300">68%</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                    <Award className="h-4 w-4" />
                  </div>
                  <p className="mt-5 text-2xl font-black text-white">7</p>
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                    Certificates earned
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { label: "Quiz score", value: "92%", icon: ClipboardCheck },
                  { label: "Day streak", value: "14", icon: Activity },
                  { label: "Completed", value: "24", icon: CheckCircle2 },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-white/6 bg-white/3 p-3 sm:p-4"
                    >
                      <Icon className="h-3.5 w-3.5 text-zinc-500" />
                      <p className="mt-3 text-base font-black text-white sm:text-xl">
                        {item.value}
                      </p>
                      <p className="mt-1 text-[8px] font-bold uppercase tracking-wider text-zinc-600">
                        {item.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="absolute -bottom-6 -left-5 hidden rounded-2xl border border-white/10 bg-zinc-900/90 p-4 shadow-xl backdrop-blur-xl sm:block">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-black text-white">Lesson complete</p>
                <p className="mt-0.5 text-[9px] font-semibold text-zinc-500">
                  Progress synced instantly
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-y border-white/5 bg-white/[0.018]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 px-5 md:grid-cols-4 lg:px-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex items-center gap-4 border-white/5 px-3 py-8 md:border-r md:px-6 md:last:border-r-0"
              >
                <Icon className="h-5 w-5 text-violet-300" />
                <div>
                  <p className="text-2xl font-black text-white">{stat.value}</p>
                  <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                    {stat.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section id="features" className="relative mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
        <div className="max-w-2xl">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">
            Built for the whole learning ecosystem
          </p>
          <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
            One platform. Three focused experiences.
          </h2>
          <p className="mt-5 text-base leading-7 text-zinc-400">
            Every role gets the tools it needs without the clutter it does not.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {roleFeatures.map((feature) => {
            const Icon = feature.icon;
            const accentClasses = {
              violet: "border-violet-400/15 bg-violet-400/5 text-violet-300",
              cyan: "border-cyan-400/15 bg-cyan-400/5 text-cyan-300",
              emerald: "border-emerald-400/15 bg-emerald-400/5 text-emerald-300",
            }[feature.accent];

            return (
              <article
                key={feature.title}
                className="group relative overflow-hidden rounded-3xl border border-white/8 bg-white/[0.025] p-7 transition duration-300 hover:-translate-y-1 hover:border-white/15"
              >
                <div className="grain-overlay" />
                <div
                  className={`relative flex h-12 w-12 items-center justify-center rounded-2xl border ${accentClasses}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <p className="relative mt-7 text-[9px] font-black uppercase tracking-[0.22em] text-zinc-500">
                  {feature.eyebrow}
                </p>
                <h3 className="relative mt-2 text-xl font-black text-white">
                  {feature.title}
                </h3>
                <p className="relative mt-3 text-sm leading-6 text-zinc-500">
                  {feature.description}
                </p>
                <ul className="relative mt-7 space-y-3">
                  {feature.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 text-xs font-semibold text-zinc-300"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/5 text-zinc-400">
                        <Check className="h-3 w-3" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      <section id="platform" className="relative border-y border-white/5 bg-white/[0.015]">
        <div className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-300">
              See the platform in action
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
              Clarity at every level.
            </h2>
          </div>

          <div className="mt-14 grid gap-5 lg:grid-cols-2">
            <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-[#08080a] p-6 sm:p-8">
              <div className="absolute inset-0 bg-mesh-violet opacity-50" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-violet-300">
                    Teacher analytics
                  </p>
                  <h3 className="mt-2 text-xl font-black text-white">
                    Understand engagement quickly
                  </h3>
                </div>
                <BarChart3 className="h-6 w-6 text-violet-300" />
              </div>
              <div className="relative mt-8 flex h-52 items-end gap-3 rounded-2xl border border-white/5 bg-black/20 p-5">
                {[38, 55, 46, 72, 64, 88, 78, 94].map((height, index) => (
                  <div key={index} className="flex h-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-md bg-linear-to-t from-violet-600/50 to-cyan-300"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-[#08080a] p-6 sm:p-8">
              <div className="absolute inset-0 bg-mesh-cyan opacity-40" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-cyan-300">
                    Course workspace
                  </p>
                  <h3 className="mt-2 text-xl font-black text-white">
                    Keep learning momentum visible
                  </h3>
                </div>
                <BookOpen className="h-6 w-6 text-cyan-300" />
              </div>
              <div className="relative mt-8 space-y-3">
                {[
                  { title: "Design systems", progress: 86, icon: FileText },
                  { title: "Research methods", progress: 62, icon: Users },
                  { title: "Product strategy", progress: 41, icon: TrendingUp },
                ].map((course) => {
                  const Icon = course.icon;
                  return (
                    <div
                      key={course.title}
                      className="flex items-center gap-4 rounded-2xl border border-white/6 bg-black/20 p-4"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/8 text-cyan-300">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-4 text-xs font-bold">
                          <span className="text-white">{course.title}</span>
                          <span className="text-cyan-300">{course.progress}%</span>
                        </div>
                        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-cyan-300"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="why-aura" className="relative mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
        <div className="grid items-center gap-16 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">
              Why choose AURA
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
              Built to turn activity into progress.
            </h2>
            <p className="mt-5 text-base leading-7 text-zinc-400">
              AURA connects every part of the learning loop, from the first
              lesson to the final certificate.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex items-center gap-2 text-sm font-black text-cyan-300 transition hover:text-white"
            >
              Create your account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {reasons.map((reason) => {
              const Icon = reason.icon;
              return (
                <div
                  key={reason.label}
                  className="flex items-center gap-4 rounded-2xl border border-white/7 bg-white/[0.025] p-5"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-zinc-300">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-bold text-white">{reason.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-24 grid gap-5 md:grid-cols-2">
          {[
            {
              quote:
                "The workspace keeps every course, deadline, and milestone easy to understand.",
              role: "Student experience",
            },
            {
              quote:
                "The analytics turn classroom activity into clear, actionable teaching signals.",
              role: "Teacher experience",
            },
          ].map((testimonial) => (
            <figure
              key={testimonial.role}
              className="rounded-3xl border border-white/8 bg-white/[0.025] p-7 sm:p-8"
            >
              <div className="flex gap-1 text-amber-300">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
              <blockquote className="mt-6 text-lg font-bold leading-8 text-zinc-200">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
                {testimonial.role}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section id="faq" className="relative border-y border-white/5 bg-white/[0.015]">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-24 lg:grid-cols-[0.7fr_1.3fr] lg:px-8 lg:py-32">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">
              Frequently asked
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-white">
              Good questions.
              <span className="block text-zinc-600">Clear answers.</span>
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-2xl border border-white/8 bg-white/[0.025] p-5 open:border-cyan-400/20 open:bg-cyan-400/[0.035]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-sm font-black text-white">
                  {faq.question}
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-zinc-400 transition group-open:rotate-90">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </summary>
                <p className="mt-4 max-w-2xl pr-10 text-sm leading-6 text-zinc-500">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-violet-400/15 bg-violet-400/5 px-6 py-16 text-center sm:px-12">
          <div className="absolute inset-0 bg-mesh-violet opacity-80" />
          <div className="grain-overlay" />
          <div className="relative mx-auto max-w-2xl">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/8 text-violet-200">
              <UserRoundCheck className="h-5 w-5" />
            </span>
            <h2 className="mt-6 text-4xl font-black tracking-tight text-white">
              Ready to start learning?
            </h2>
            <p className="mt-4 text-sm leading-7 text-zinc-400">
              Join a learning workspace designed to keep progress visible and
              every next step within reach.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-black text-zinc-950 transition hover:bg-cyan-100"
            >
              Register now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="relative border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-center gap-2 font-black tracking-[0.18em] text-zinc-400">
            <GraduationCap className="h-4 w-4 text-violet-300" />
            AURA
          </div>
          <p>Modern learning for students, teachers, and teams.</p>
          <div className="flex gap-5 font-bold">
            <Link href="/login" className="transition hover:text-white">
              Login
            </Link>
            <Link href="/register" className="transition hover:text-white">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
