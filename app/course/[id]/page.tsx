import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  PlayCircle,
  Lock,
  CheckCircle2,
  BookOpen,
  FileText,
  Code2,
  Download,
  Clock,
  BarChart3,
  Users,
  Award,
  ChevronRight,
  Play,
  Circle,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────────
interface Lesson {
  id: number;
  title: string;
  duration: string;
}

interface Resource {
  id: number;
  title: string;
  type: "pdf" | "github" | "slides" | "zip";
  size?: string;
  url: string;
}

interface CourseContent {
  description: string;
  instructor: string;
  duration: string;
  students: string;
  level: string;
  color: string;
  lessons: Lesson[];
  resources: Resource[];
}

// ─── Per-Course Content Catalogue ───────────────────────────────────────────────
const COURSE_CONTENT: Record<string, CourseContent> = {
  react: {
    description:
      "Master advanced React architectural patterns. Explore composition strategies, custom hooks, compound components, state reducers, and high-performance render optimization techniques used in production apps.",
    instructor: "Dr. Sarah Adams",
    duration: "8h 15m",
    students: "2,492",
    level: "Advanced",
    color: "violet",
    lessons: [
      { id: 1, title: "Course Introduction & Environment Setup", duration: "5:30" },
      { id: 2, title: "Compound Components Pattern", duration: "18:45" },
      { id: 3, title: "Control Props & Inversion of Control", duration: "24:10" },
      { id: 4, title: "State Reducers & Extensible APIs", duration: "30:15" },
      { id: 5, title: "Custom Hooks & Ref Forwarding", duration: "22:40" },
      { id: 6, title: "useMemo, useCallback & Profiling", duration: "32:10" },
      { id: 7, title: "Context Selectors & Zustand Patterns", duration: "28:50" },
      { id: 8, title: "Capstone: Building a Design System", duration: "45:00" },
    ],
    resources: [
      { id: 1, title: "Slides: Advanced React Patterns", type: "pdf", size: "3.8 MB", url: "#" },
      { id: 2, title: "GitHub: Companion Repository", type: "github", url: "#" },
      { id: 3, title: "Hooks Cheat Sheet", type: "pdf", size: "890 KB", url: "#" },
      { id: 4, title: "Starter Project Files", type: "zip", size: "6.2 MB", url: "#" },
    ],
  },

  next: {
    description:
      "Build scalable Next.js applications using the modern App Router. Understand React Server Components, Server Actions, route handlers, middleware, layout nesting, streaming, and advanced caching strategies.",
    instructor: "James Carter",
    duration: "10h 30m",
    students: "3,110",
    level: "Intermediate",
    color: "cyan",
    lessons: [
      { id: 1, title: "Next.js 14 & the App Router Explained", duration: "10:15" },
      { id: 2, title: "Server Components vs Client Components", duration: "25:40" },
      { id: 3, title: "Dynamic Routing & Parallel Routes", duration: "18:22" },
      { id: 4, title: "Server Actions & Mutating Data", duration: "32:15" },
      { id: 5, title: "Caching, Revalidation & ISR", duration: "28:50" },
      { id: 6, title: "Edge Runtime & Middleware Guards", duration: "21:10" },
      { id: 7, title: "Streaming, Suspense & Loading UI", duration: "19:40" },
      { id: 8, title: "Deploying on Vercel & Self-hosting", duration: "14:00" },
    ],
    resources: [
      { id: 1, title: "App Router Migration Guide", type: "pdf", size: "2.1 MB", url: "#" },
      { id: 2, title: "GitHub: Next.js Boilerplate", type: "github", url: "#" },
      { id: 3, title: "Caching Strategy Reference", type: "pdf", size: "740 KB", url: "#" },
      { id: 4, title: "Deploy Checklist & Config", type: "zip", size: "1.3 MB", url: "#" },
    ],
  },

  framer: {
    description:
      "Create smooth, production-ready animations with Framer Motion. Learn animate presence, layout transitions, shared element transitions, drag gestures, scroll-triggered sequences, and SVG keyframe animations.",
    instructor: "Sophia Lopez",
    duration: "6h 45m",
    students: "1,850",
    level: "Intermediate",
    color: "emerald",
    lessons: [
      { id: 1, title: "Framer Motion API & Motion Components", duration: "8:20" },
      { id: 2, title: "Variants & Transition Orchestration", duration: "15:45" },
      { id: 3, title: "AnimatePresence & Exit Animations", duration: "20:30" },
      { id: 4, title: "Layout Animations & Shared Layouts", duration: "24:15" },
      { id: 5, title: "Scroll-based & Keyframe Animations", duration: "18:50" },
      { id: 6, title: "Drag Gestures & Constraints", duration: "16:35" },
      { id: 7, title: "SVG Path Animations & Motion Values", duration: "22:10" },
      { id: 8, title: "Performance Optimization & Debugging", duration: "14:30" },
    ],
    resources: [
      { id: 1, title: "Animation Patterns Reference", type: "pdf", size: "2.6 MB", url: "#" },
      { id: 2, title: "GitHub: Motion Demos", type: "github", url: "#" },
      { id: 3, title: "Variants Cheat Sheet", type: "pdf", size: "620 KB", url: "#" },
      { id: 4, title: "SVG Assets & Starter Kit", type: "zip", size: "4.8 MB", url: "#" },
    ],
  },

  supabase: {
    description:
      "Learn real-world database architecture, RLS security policies, and realtime syncing. Configure row-level security, PostgreSQL triggers, edge functions, OAuth providers, and file storage buckets.",
    instructor: "Markus Vance",
    duration: "14h 20m",
    students: "1,520",
    level: "Beginner",
    color: "orange",
    lessons: [
      { id: 1, title: "Supabase Architecture & Dashboard Tour", duration: "12:10" },
      { id: 2, title: "PostgreSQL Schema Design & Tables", duration: "22:45" },
      { id: 3, title: "Row Level Security (RLS) & Policies", duration: "30:15" },
      { id: 4, title: "Auth Providers & OAuth Integration", duration: "18:40" },
      { id: 5, title: "Realtime Subscriptions & Channels", duration: "25:30" },
      { id: 6, title: "Edge Functions & Database Triggers", duration: "28:00" },
      { id: 7, title: "File Storage & Bucket Policies", duration: "16:20" },
      { id: 8, title: "Production Deployment & Monitoring", duration: "20:00" },
    ],
    resources: [
      { id: 1, title: "Supabase Setup Runbook", type: "pdf", size: "1.9 MB", url: "#" },
      { id: 2, title: "GitHub: Supabase Starter", type: "github", url: "#" },
      { id: 3, title: "RLS Policy Templates", type: "pdf", size: "540 KB", url: "#" },
      { id: 4, title: "SQL Seed Scripts", type: "zip", size: "320 KB", url: "#" },
    ],
  },

  default: {
    description:
      "Master the foundational concepts and advanced techniques in this comprehensive course. Each lesson is carefully crafted to build your skills progressively, with hands-on examples and real-world projects.",
    instructor: "Dr. Alex Morgan",
    duration: "12h 40m",
    students: "4,281",
    level: "Intermediate",
    color: "violet",
    lessons: [
      { id: 1, title: "Introduction & Course Overview", duration: "8:32" },
      { id: 2, title: "Core Fundamentals Deep Dive", duration: "22:15" },
      { id: 3, title: "Advanced Patterns & Techniques", duration: "31:08" },
      { id: 4, title: "Building Real-World Components", duration: "45:00" },
      { id: 5, title: "Performance Optimization", duration: "28:44" },
      { id: 6, title: "Testing & Best Practices", duration: "34:20" },
      { id: 7, title: "Capstone Project Walkthrough", duration: "51:10" },
      { id: 8, title: "Final Assessment & Next Steps", duration: "15:00" },
    ],
    resources: [
      { id: 1, title: "Course Slides (PDF)", type: "pdf", size: "4.2 MB", url: "#" },
      { id: 2, title: "Source Code Repository", type: "github", url: "#" },
      { id: 3, title: "Cheat Sheet & Reference Guide", type: "pdf", size: "1.1 MB", url: "#" },
      { id: 4, title: "Project Starter Files", type: "zip", size: "8.7 MB", url: "#" },
    ],
  },
};

// ─── Match course content by title keyword ────────────────────────────────────
function getCourseContent(title: string): CourseContent {
  const t = title.toLowerCase();
  if (t.includes("react")) return COURSE_CONTENT.react;
  if (t.includes("next")) return COURSE_CONTENT.next;
  if (t.includes("framer") || t.includes("animation") || t.includes("motion")) return COURSE_CONTENT.framer;
  if (t.includes("supabase") || t.includes("postgres")) return COURSE_CONTENT.supabase;
  return COURSE_CONTENT.default;
}

// ─── Color themes ─────────────────────────────────────────────────────────────
const colorMap: Record<string, { badge: string; progress: string; icon: string; ring: string; glow: string }> = {
  violet: {
    badge: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    progress: "from-violet-500 to-indigo-500",
    icon: "bg-violet-500/10 border-violet-500/20 text-violet-400",
    ring: "border-violet-500/30",
    glow: "bg-mesh-violet",
  },
  cyan: {
    badge: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    progress: "from-cyan-500 to-blue-500",
    icon: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
    ring: "border-cyan-500/30",
    glow: "bg-mesh-cyan",
  },
  emerald: {
    badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    progress: "from-emerald-500 to-teal-500",
    icon: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    ring: "border-emerald-500/30",
    glow: "bg-mesh-emerald",
  },
  orange: {
    badge: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    progress: "from-orange-500 to-red-500",
    icon: "bg-orange-500/10 border-orange-500/20 text-orange-400",
    ring: "border-orange-500/30",
    glow: "bg-mesh-orange",
  },
};

// ─── Resource icon helper ─────────────────────────────────────────────────────
const ResourceIcon = ({ type }: { type: string }) => {
  if (type === "github") return <Code2 className="w-4 h-4" />;
  if (type === "zip") return <Download className="w-4 h-4" />;
  return <FileText className="w-4 h-4" />;
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const { data: course, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !course) notFound();

  // Match content to this specific course by title
  const content = getCourseContent(course.title);
  const colors = colorMap[content.color] ?? colorMap.violet;

  // Derive completed/locked state from the real DB progress value
  const totalLessons = content.lessons.length;
  const completedCount = Math.round((course.progress / 100) * totalLessons);

  const lessons = content.lessons.map((lesson, index) => ({
    ...lesson,
    completed: index < completedCount,
    // The next lesson after completed ones is the active one (unlocked)
    // Everything beyond that is locked
    locked: index > completedCount,
  }));

  const activeLesson = lessons.find((l) => !l.completed && !l.locked) ?? lessons[0];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Ambient background */}
      <div className={`fixed inset-0 ${colors.glow} opacity-20 pointer-events-none`} />
      <div className="fixed inset-0 bg-mesh-cyan opacity-10 pointer-events-none mix-blend-screen" />

      {/* Top Nav */}
      <nav className="sticky top-0 z-50 glass-card border-b border-white/5 px-4 md:px-8 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>
        <span className="text-xs font-bold text-zinc-500 hidden sm:block">AURA &bull; Course Detail</span>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${colors.badge}`}>
          <BarChart3 className="w-3 h-3" />
          {course.progress}% Complete
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="relative glass-card rounded-3xl overflow-hidden p-6 md:p-10">
          <div className={`absolute inset-0 ${colors.glow} opacity-60 pointer-events-none`} />
          <div className="grain-overlay" />

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="space-y-3 flex-1">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${colors.badge}`}>
                  <Award className="w-3 h-3" />
                  {content.level}
                </span>
                <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  {course.title}
                </h1>
                <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-2xl">
                  {content.description}
                </p>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    {content.duration} total
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <Users className="w-3.5 h-3.5 text-zinc-500" />
                    {content.students} enrolled
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
                    {totalLessons} lessons
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <Award className="w-3.5 h-3.5 text-zinc-500" />
                    {content.instructor}
                  </div>
                </div>
              </div>

              {/* Progress Circle */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="relative w-28 h-28">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="42" fill="none"
                      stroke="url(#prog-grad)" strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 42}`}
                      strokeDashoffset={`${2 * Math.PI * 42 * (1 - course.progress / 100)}`}
                      style={{ transition: "stroke-dashoffset 1s ease" }}
                    />
                    <defs>
                      <linearGradient id="prog-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-white">{course.progress}%</span>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Progress</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 font-medium">{completedCount}/{totalLessons} lessons done</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                <span>Course Progress</span>
                <span>{course.progress}%</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${colors.progress} rounded-full`}
                  style={{ width: `${course.progress}%`, transition: "width 1s ease" }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Main Grid ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Video Player + Resources */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <section className="relative glass-card rounded-3xl overflow-hidden">
              <div className="grain-overlay" />
              <div className="relative w-full aspect-video bg-zinc-900/80 flex items-center justify-center group cursor-pointer">
                <div className={`absolute inset-0 ${colors.glow} opacity-40`} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-all duration-300 group-hover:scale-110">
                    <Play className="w-7 h-7 md:w-10 md:h-10 text-white fill-white ml-1" />
                  </div>
                </div>
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Now Playing</span>
                </div>
                <div className="absolute bottom-4 right-4 text-xs font-bold text-zinc-400 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10">
                  Lesson {activeLesson.id} &bull; {activeLesson.duration}
                </div>
              </div>
              <div className="p-5">
                <h2 className="text-base font-bold text-white">
                  Lesson {activeLesson.id}: {activeLesson.title}
                </h2>
                <p className="text-xs text-zinc-500 mt-1">{content.instructor} &bull; {activeLesson.duration}</p>
              </div>
            </section>

            {/* Resources */}
            <section className="relative glass-card rounded-3xl p-6 overflow-hidden">
              <div className="grain-overlay" />
              <div className="relative z-10">
                <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-violet-400" />
                  Course Resources
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {content.resources.map((resource) => (
                    <a
                      key={resource.id}
                      href={resource.url}
                      className="group flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all duration-200"
                    >
                      <div className={`p-2.5 rounded-xl border ${colors.icon} shrink-0`}>
                        <ResourceIcon type={resource.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white group-hover:text-violet-300 transition-colors truncate">
                          {resource.title}
                        </p>
                        {resource.size && (
                          <p className="text-[10px] text-zinc-600 mt-0.5">{resource.size}</p>
                        )}
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Right: Lessons List */}
          <div className="lg:col-span-1">
            <section className="relative glass-card rounded-3xl overflow-hidden sticky top-24">
              <div className="grain-overlay" />
              <div className="relative z-10 p-5 border-b border-white/5">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-violet-400" />
                  Lessons
                </h2>
                <p className="text-[10px] text-zinc-500 mt-0.5 font-medium">
                  {completedCount} of {totalLessons} completed
                </p>
              </div>
              <ul className="relative z-10 divide-y divide-white/[0.04] max-h-[520px] overflow-y-auto no-scrollbar">
                {lessons.map((lesson) => {
                  const isActive = lesson.id === activeLesson.id;
                  return (
                    <li
                      key={lesson.id}
                      className={`flex items-center gap-3 px-5 py-4 transition-colors duration-150 ${
                        lesson.locked
                          ? "opacity-40 cursor-not-allowed"
                          : isActive
                          ? "bg-violet-500/10 cursor-pointer"
                          : "hover:bg-white/[0.03] cursor-pointer"
                      }`}
                    >
                      {/* Status Icon */}
                      <div className="shrink-0">
                        {lesson.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : lesson.locked ? (
                          <Lock className="w-4 h-4 text-zinc-600" />
                        ) : isActive ? (
                          <PlayCircle className="w-4 h-4 text-violet-400" />
                        ) : (
                          <Circle className="w-4 h-4 text-zinc-600" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold truncate ${
                          isActive ? "text-violet-300" : lesson.completed ? "text-zinc-300" : "text-zinc-400"
                        }`}>
                          {lesson.title}
                        </p>
                        <p className="text-[10px] text-zinc-600 mt-0.5">{lesson.duration}</p>
                      </div>

                      {isActive && (
                        <span className="shrink-0 text-[9px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                          Now
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
