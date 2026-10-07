"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  BookOpen,
  Star,
  Clock,
  Layers,
  Award,
  ChevronRight,
  Play,
  CheckCircle2,
  Sparkles,
  Users,
  X,
  FileText,
  HelpCircle,
  ArrowRight,
  Filter,
} from "lucide-react";
import { SpotlightCard } from "@/components/motion";

interface LessonItem {
  title: string;
  duration: string;
  type: "video" | "quiz" | "assignment";
  isFreePreview?: boolean;
}

interface Chapter {
  title: string;
  lessons: LessonItem[];
}

interface CatalogCourse {
  id: string;
  title: string;
  tagline: string;
  category: "fullstack" | "ai" | "cloud" | "design" | "database";
  level: "Beginner" | "Intermediate" | "Advanced" | "All Levels";
  rating: number;
  reviewCount: number;
  studentsCount: number;
  durationHours: number;
  lessonsCount: number;
  assignmentsCount: number;
  instructorName: string;
  instructorRole: string;
  instructorAvatar: string;
  badge?: "Bestseller" | "Specialization" | "New" | "Trending";
  gradient: string;
  price: string;
  chapters: Chapter[];
}

const COURSES: CatalogCourse[] = [
  {
    id: "fullstack-nextjs-architecture",
    title: "Next.js 16 App Router & Fullstack Systems",
    tagline:
      "Architect production-ready applications with Server Components, Server Actions, streaming SSR, and edge caching.",
    category: "fullstack",
    level: "Intermediate",
    rating: 4.9,
    reviewCount: 3840,
    studentsCount: 14200,
    durationHours: 32,
    lessonsCount: 46,
    assignmentsCount: 6,
    instructorName: "Dr. Marcus Chen",
    instructorRole: "Principal Architect, ex-Vercel",
    instructorAvatar: "MC",
    badge: "Bestseller",
    gradient: "from-cyan-500/20 via-sky-600/20 to-blue-600/30",
    price: "Free with AURA Pro",
    chapters: [
      {
        title: "Module 1: Server Components Foundations & Streaming",
        lessons: [
          { title: "The Evolution of React 19 & RSC Architecture", duration: "14:20", type: "video", isFreePreview: true },
          { title: "Streaming SSR with Suspense Boundaries", duration: "18:45", type: "video", isFreePreview: true },
          { title: "Knowledge Check: Server vs Client Boundaries", duration: "10:00", type: "quiz" },
        ],
      },
      {
        title: "Module 2: Server Actions, Cache Tags & Data Mutations",
        lessons: [
          { title: "Zero-API Mutations with optimistic updates", duration: "22:10", type: "video" },
          { title: "Cache Invalidation & revalidateTag patterns", duration: "19:30", type: "video" },
          { title: "Hands-on Lab: Realtime Collaborative Board", duration: "45:00", type: "assignment" },
        ],
      },
      {
        title: "Module 3: Enterprise Auth, PostgreSQL RLS & Telemetry",
        lessons: [
          { title: "Session cookies, JWTs, and Supabase RLS", duration: "25:15", type: "video" },
          { title: "Building a Live Student Telemetry Pipeline", duration: "20:00", type: "video" },
          { title: "Final Capstone Assessment & Certificate", duration: "60:00", type: "quiz" },
        ],
      },
    ],
  },
  {
    id: "ai-agents-llm-orchestration",
    title: "AI Agents & Autonomous LLM Systems",
    tagline:
      "Design multi-agent workflows, tool execution loops, vector embeddings, and rag pipelines using TypeScript and Python.",
    category: "ai",
    level: "Advanced",
    rating: 4.95,
    reviewCount: 2910,
    studentsCount: 9850,
    durationHours: 38,
    lessonsCount: 52,
    assignmentsCount: 8,
    instructorName: "Elena Rostova",
    instructorRole: "Senior AI Research Scientist",
    instructorAvatar: "ER",
    badge: "Trending",
    gradient: "from-violet-500/20 via-fuchsia-600/20 to-indigo-600/30",
    price: "Free with AURA Pro",
    chapters: [
      {
        title: "Module 1: Function Calling & Agentic Control Loops",
        lessons: [
          { title: "Architecture of ReAct and Plan-and-Solve Agents", duration: "16:40", type: "video", isFreePreview: true },
          { title: "Tool Schema Construction & Parameter Validation", duration: "21:15", type: "video", isFreePreview: true },
          { title: "Interactive Quiz: Autonomous Execution Safeguards", duration: "12:00", type: "quiz" },
        ],
      },
      {
        title: "Module 2: Vector Search & Hybrid Retrieval RAG",
        lessons: [
          { title: "pgvector Indexing, HNSW vs IVFFlat", duration: "24:30", type: "video" },
          { title: "Context Window Compression & Re-ranking", duration: "18:50", type: "video" },
          { title: "Project: Autonomous Research Subagent", duration: "50:00", type: "assignment" },
        ],
      },
    ],
  },
  {
    id: "design-systems-micro-interactions",
    title: "Design Systems & High-End Motion UX",
    tagline:
      "Build stunning, accessible design systems with Tailwind CSS, Framer Motion, fluid typography, and glassmorphic micro-interactions.",
    category: "design",
    level: "All Levels",
    rating: 4.88,
    reviewCount: 4120,
    studentsCount: 16400,
    durationHours: 24,
    lessonsCount: 38,
    assignmentsCount: 5,
    instructorName: "Jordan Vance",
    instructorRole: "Staff Product Designer",
    instructorAvatar: "JV",
    badge: "Specialization",
    gradient: "from-emerald-500/20 via-teal-600/20 to-cyan-600/30",
    price: "Free with AURA Pro",
    chapters: [
      {
        title: "Module 1: Design Tokens & Fluid Foundations",
        lessons: [
          { title: "Creating Math-Calibrated Typographic Scales", duration: "15:00", type: "video", isFreePreview: true },
          { title: "HSL Color Science & Dark Mode Contrast Ratios", duration: "17:30", type: "video", isFreePreview: true },
          { title: "Lab: Build a Modular Token System in Tailwind", duration: "30:00", type: "assignment" },
        ],
      },
      {
        title: "Module 2: Framer Motion & Physics-Based Springs",
        lessons: [
          { title: "Layout Animations & Shared Element Transitions", duration: "22:15", type: "video" },
          { title: "Magnetic Hover Buttons & 3D Tilt Cards", duration: "19:40", type: "video" },
          { title: "Quiz: Micro-interaction Performance Best Practices", duration: "15:00", type: "quiz" },
        ],
      },
    ],
  },
  {
    id: "distributed-systems-cloud-architecture",
    title: "Distributed Systems & Cloud DevOps",
    tagline:
      "Master Kubernetes, Docker containerization, Redis pub/sub messaging, idempotency keys, and automated CI/CD pipelines.",
    category: "cloud",
    level: "Intermediate",
    rating: 4.89,
    reviewCount: 2180,
    studentsCount: 8200,
    durationHours: 36,
    lessonsCount: 44,
    assignmentsCount: 7,
    instructorName: "Siddharth Nair",
    instructorRole: "Site Reliability Director",
    instructorAvatar: "SN",
    badge: "Specialization",
    gradient: "from-amber-500/20 via-orange-600/20 to-rose-600/30",
    price: "Free with AURA Pro",
    chapters: [
      {
        title: "Module 1: Distributed Reliability & Idempotency",
        lessons: [
          { title: "Idempotent Webhooks & Distributed Locks", duration: "18:20", type: "video", isFreePreview: true },
          { title: "Rate Limiting with Upstash Redis Sliding Window", duration: "21:00", type: "video", isFreePreview: true },
          { title: "Checkpoint Quiz: Handling Network Partitions", duration: "12:00", type: "quiz" },
        ],
      },
      {
        title: "Module 2: Container Orchestration & Zero-Downtime Deployments",
        lessons: [
          { title: "Docker Multi-stage Builds for Next.js", duration: "19:45", type: "video" },
          { title: "Blue-Green & Canary Rollouts", duration: "24:10", type: "video" },
          { title: "Capstone: Fault-Tolerant Microservices Cluster", duration: "60:00", type: "assignment" },
        ],
      },
    ],
  },
  {
    id: "database-engineering-postgres-mastery",
    title: "Production PostgreSQL & Advanced Modeling",
    tagline:
      "From zero to high-throughput: master indexing, Row-Level Security, partition pruning, triggers, and query execution plans.",
    category: "database",
    level: "Intermediate",
    rating: 4.92,
    reviewCount: 1940,
    studentsCount: 7350,
    durationHours: 28,
    lessonsCount: 40,
    assignmentsCount: 6,
    instructorName: "Dr. Marcus Chen",
    instructorRole: "Database Systems Researcher",
    instructorAvatar: "MC",
    badge: "New",
    gradient: "from-indigo-500/20 via-blue-600/20 to-cyan-600/30",
    price: "Free with AURA Pro",
    chapters: [
      {
        title: "Module 1: Query Execution & Index Strategies",
        lessons: [
          { title: "Deconstructing EXPLAIN ANALYZE Buffers", duration: "20:10", type: "video", isFreePreview: true },
          { title: "B-Tree vs GiST vs GIN Indexes", duration: "22:40", type: "video", isFreePreview: true },
          { title: "Quiz: SQL Performance Optimization", duration: "15:00", type: "quiz" },
        ],
      },
      {
        title: "Module 2: Multi-Tenant Row Level Security & Functions",
        lessons: [
          { title: "Writing Bulletproof RLS Policies for Multi-Tenancy", duration: "25:30", type: "video" },
          { title: "PL/pgSQL Triggers & Audit Log Generation", duration: "21:15", type: "video" },
          { title: "Lab: Implement Enterprise Audit Trail Triggers", duration: "45:00", type: "assignment" },
        ],
      },
    ],
  },
];

const CATEGORIES = [
  { id: "all", label: "All Specializations", icon: Sparkles },
  { id: "fullstack", label: "Fullstack & Next.js", icon: BookOpen },
  { id: "ai", label: "AI & Machine Learning", icon: Layers },
  { id: "design", label: "Design Systems", icon: Award },
  { id: "cloud", label: "Cloud & DevOps", icon: Clock },
  { id: "database", label: "PostgreSQL & Data", icon: Star },
];

export default function CourseCatalogExplorer() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCourseModal, setActiveCourseModal] = useState<CatalogCourse | null>(null);
  const [activePreviewLesson, setActivePreviewLesson] = useState<LessonItem | null>(null);

  const filteredCourses = useMemo(() => {
    return COURSES.filter((course) => {
      const matchesCategory =
        selectedCategory === "all" || course.category === selectedCategory;
      const matchesSearch =
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.instructorName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <section id="catalog" className="relative mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
      {/* Header with Coursera / Udemy benchmark tone */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-white/8">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">
            <BookOpen className="h-3 w-3" />
            Curated Academic Catalog
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
            Explore In-Demand Specializations
          </h2>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-zinc-400">
            Structured curriculum designed by senior software architects. Every course includes hands-on code sandboxes, auto-graded quizzes, and accredited certificates.
          </p>
        </div>

        {/* Live Search Input (Udemy / Coursera benchmark) */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses, skills, teachers..."
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 backdrop-blur-md transition focus:border-cyan-400 focus:bg-white/[0.07] focus:outline-none focus:ring-1 focus:ring-cyan-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Domain Category Filter Pills */}
      <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-lg shadow-cyan-500/10"
                  : "border border-white/6 bg-white/[0.02] text-zinc-400 hover:border-white/15 hover:text-zinc-200"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Courses Grid */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCourses.map((course) => (
          <SpotlightCard
            key={course.id}
            spotlightColor="rgba(6, 182, 212, 0.14)"
            className="group flex flex-col justify-between overflow-hidden border border-white/8 bg-zinc-950/70 p-0 transition-all duration-300 hover:border-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/10"
          >
            {/* Visual Header / Banner */}
            <div className={`relative h-44 w-full bg-gradient-to-br ${course.gradient} p-5 flex flex-col justify-between border-b border-white/6 overflow-hidden`}>
              <div className="absolute inset-0 bg-grid-tech opacity-20 pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between">
                {course.badge && (
                  <span className="rounded-full bg-cyan-400/20 border border-cyan-300/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-cyan-300 backdrop-blur-md">
                    {course.badge}
                  </span>
                )}
                <span className="ml-auto rounded-full bg-black/40 px-2.5 py-0.5 text-[10px] font-bold text-zinc-300 backdrop-blur-md border border-white/10">
                  {course.level}
                </span>
              </div>

              {/* Play preview overlay indicator */}
              <button
                type="button"
                onClick={() => {
                  setActiveCourseModal(course);
                  const firstPreview = course.chapters[0]?.lessons.find((l) => l.isFreePreview);
                  if (firstPreview) setActivePreviewLesson(firstPreview);
                }}
                className="relative z-10 mt-auto flex items-center gap-2 self-start rounded-xl bg-black/60 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md border border-white/15 transition hover:bg-white hover:text-black hover:scale-105 active:scale-95"
              >
                <Play className="h-3.5 w-3.5 fill-current text-cyan-400" />
                <span>Quick Syllabus Peek</span>
              </button>
            </div>

            {/* Course Content */}
            <div className="flex flex-1 flex-col p-6">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span className="text-white">{course.rating}</span>
                <span className="text-zinc-400 font-normal">
                  ({course.reviewCount.toLocaleString()} reviews)
                </span>
                <span className="mx-1.5 text-zinc-600">•</span>
                <span className="text-zinc-400 font-normal">
                  {course.studentsCount.toLocaleString()} learners
                </span>
              </div>

              <h3 className="mt-2.5 text-lg font-black text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                {course.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400 line-clamp-2">
                {course.tagline}
              </p>

              {/* Instructor badge */}
              <div className="mt-4 flex items-center gap-2.5 pt-4 border-t border-white/6">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-violet-500 text-[10px] font-bold text-white shadow-sm">
                  {course.instructorAvatar}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-zinc-200 truncate">{course.instructorName}</p>
                  <p className="text-[10px] text-zinc-400 truncate">{course.instructorRole}</p>
                </div>
              </div>

              {/* Course Meta Specs */}
              <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-white/[0.02] border border-white/6 p-2.5 text-center text-[10px] font-bold text-zinc-300">
                <div className="flex flex-col items-center">
                  <span className="text-zinc-400 flex items-center gap-1"><Clock className="h-3 w-3" /> Hours</span>
                  <span className="mt-0.5 text-white">{course.durationHours} hrs</span>
                </div>
                <div className="flex flex-col items-center border-x border-white/6">
                  <span className="text-zinc-400 flex items-center gap-1"><Layers className="h-3 w-3" /> Lessons</span>
                  <span className="mt-0.5 text-white">{course.lessonsCount}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-zinc-400 flex items-center gap-1"><Award className="h-3 w-3" /> Credential</span>
                  <span className="mt-0.5 text-emerald-400">Included</span>
                </div>
              </div>

              {/* Bottom CTA Row */}
              <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-white/6">
                <div>
                  <span className="text-[10px] font-semibold text-zinc-400 block uppercase tracking-wider">Access</span>
                  <span className="text-xs font-black text-cyan-300">{course.price}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveCourseModal(course);
                      const firstPreview = course.chapters[0]?.lessons.find((l) => l.isFreePreview);
                      if (firstPreview) setActivePreviewLesson(firstPreview);
                    }}
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-zinc-300 transition hover:bg-white/10 hover:text-white"
                  >
                    Syllabus
                  </button>
                  <Link
                    href={`/register?course=${course.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-400 px-3.5 py-2 text-xs font-black text-zinc-950 transition hover:bg-cyan-300 active:scale-95 shadow-md shadow-cyan-400/20"
                  >
                    Enroll
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </SpotlightCard>
        ))}
      </div>

      {/* Interactive Curriculum Drawer / Modal (Coursera / Udemy signature peek) */}
      <AnimatePresence>
        {activeCourseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setActiveCourseModal(null);
                setActivePreviewLesson(null);
              }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/15 bg-zinc-950 p-6 sm:p-8 shadow-2xl shadow-cyan-500/20"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 pb-6 border-b border-white/10">
                <div>
                  <span className="rounded-full bg-cyan-400/10 border border-cyan-400/30 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-300">
                    Curriculum & Syllabus Breakdown
                  </span>
                  <h3 className="mt-3 text-2xl font-black text-white">
                    {activeCourseModal.title}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-400">
                    Instructed by <span className="font-bold text-zinc-200">{activeCourseModal.instructorName}</span> • {activeCourseModal.durationHours} Hours total content • {activeCourseModal.lessonsCount} lessons
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActiveCourseModal(null);
                    setActivePreviewLesson(null);
                  }}
                  className="rounded-full bg-white/6 p-2 text-zinc-400 hover:bg-white/12 hover:text-white transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Free Lesson Preview Player Box if selected */}
              {activePreviewLesson && (
                <div className="my-6 rounded-2xl border border-cyan-400/30 bg-cyan-950/30 p-5 backdrop-blur-md">
                  <div className="flex items-center justify-between pb-3 border-b border-cyan-400/20">
                    <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold">
                      <Play className="h-4 w-4 fill-current" />
                      <span>Free Interactive Preview Lesson: &ldquo;{activePreviewLesson.title}&rdquo;</span>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-md">
                      {activePreviewLesson.duration}
                    </span>
                  </div>

                  <div className="mt-4 relative aspect-video w-full rounded-xl bg-black border border-white/10 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-cyan-600/15 via-transparent to-violet-600/15 pointer-events-none" />
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-400 text-zinc-950 shadow-xl shadow-cyan-400/30 mb-3 animate-pulse">
                      <Play className="h-6 w-6 fill-current ml-0.5" />
                    </div>
                    <h4 className="text-sm font-bold text-white">
                      Sample Lecture Video Stream
                    </h4>
                    <p className="mt-1 text-xs text-zinc-400 max-w-md">
                      In this preview, Dr. Marcus demonstrates high-throughput React Server Component patterns and live Postgres connection pooling.
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                      <Link
                        href={`/register?course=${activeCourseModal.id}`}
                        className="rounded-xl bg-white px-4 py-2 text-xs font-black text-zinc-950 transition hover:bg-zinc-200"
                      >
                        Enroll to Watch Full 32 Hours
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Module Chapters Accordion */}
              <div className="mt-6 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                  Course Modules & Learning Milestones
                </h4>

                {activeCourseModal.chapters.map((chapter, cIdx) => (
                  <div
                    key={chapter.title}
                    className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 transition-all"
                  >
                    <div className="flex items-center justify-between font-bold text-sm text-zinc-200">
                      <span className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/6 text-xs text-cyan-300 font-mono">
                          {cIdx + 1}
                        </span>
                        {chapter.title}
                      </span>
                      <span className="text-xs text-zinc-400 font-normal">
                        {chapter.lessons.length} items
                      </span>
                    </div>

                    <div className="mt-3.5 divide-y divide-white/5 border-t border-white/5 pt-1">
                      {chapter.lessons.map((lesson) => (
                        <div
                          key={lesson.title}
                          className="flex items-center justify-between py-2.5 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {lesson.type === "video" && (
                              <Play className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
                            )}
                            {lesson.type === "quiz" && (
                              <HelpCircle className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                            )}
                            {lesson.type === "assignment" && (
                              <FileText className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                            )}
                            <span className="truncate text-zinc-300">{lesson.title}</span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 ml-3">
                            {lesson.isFreePreview ? (
                              <button
                                onClick={() => setActivePreviewLesson(lesson)}
                                className="rounded-md bg-cyan-400/15 border border-cyan-400/30 px-2 py-0.5 text-[10px] font-bold text-cyan-300 hover:bg-cyan-400 hover:text-black transition"
                              >
                                Preview
                              </button>
                            ) : (
                              <span className="text-[10px] text-zinc-400 font-mono">
                                {lesson.duration}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal Bottom CTA */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/10">
                <div className="text-left w-full sm:w-auto">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-widest block font-bold">Certification Status</span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Verifiable Certificate awarded upon completion
                  </span>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Link
                    href={`/register?course=${activeCourseModal.id}`}
                    className="w-full sm:w-auto text-center rounded-xl bg-gradient-to-r from-cyan-400 to-sky-300 px-6 py-2.5 text-xs font-black text-zinc-950 transition hover:brightness-110 shadow-lg shadow-cyan-400/20"
                  >
                    Enroll Now Free
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
