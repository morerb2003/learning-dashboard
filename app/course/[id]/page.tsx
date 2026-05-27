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

// ─── Mock content seeded per course ────────────────────────────────────────────
const COURSE_CONTENT: Record<string, {
  description: string;
  instructor: string;
  duration: string;
  students: string;
  level: string;
  color: string;
  lessons: { id: number; title: string; duration: string; completed: boolean; locked: boolean }[];
  resources: { id: number; title: string; type: "pdf" | "github" | "slides" | "zip"; size?: string; url: string }[];
}> = {
  default: {
    description: "Master the foundational concepts and advanced techniques in this comprehensive course. Each lesson is carefully crafted to build your skills progressively, with hands-on examples and real-world projects.",
    instructor: "Dr. Alex Morgan",
    duration: "12h 40m",
    students: "4,281",
    level: "Intermediate",
    color: "violet",
    lessons: [
      { id: 1, title: "Introduction & Course Overview", duration: "8:32", completed: true, locked: false },
      { id: 2, title: "Core Fundamentals Deep Dive", duration: "22:15", completed: true, locked: false },
      { id: 3, title: "Advanced Patterns & Techniques", duration: "31:08", completed: true, locked: false },
      { id: 4, title: "Building Real-World Components", duration: "45:00", completed: false, locked: false },
      { id: 5, title: "Performance Optimization", duration: "28:44", completed: false, locked: false },
      { id: 6, title: "Testing & Best Practices", duration: "34:20", completed: false, locked: true },
      { id: 7, title: "Capstone Project Walkthrough", duration: "51:10", completed: false, locked: true },
      { id: 8, title: "Final Assessment & Next Steps", duration: "15:00", completed: false, locked: true },
    ],
    resources: [
      { id: 1, title: "Course Slides (PDF)", type: "pdf", size: "4.2 MB", url: "#" },
      { id: 2, title: "Source Code Repository", type: "github", url: "#" },
      { id: 3, title: "Cheat Sheet & Reference Guide", type: "pdf", size: "1.1 MB", url: "#" },
      { id: 4, title: "Project Starter Files", type: "zip", size: "8.7 MB", url: "#" },
    ],
  },
};

function getCourseContent(id: string) {
  return COURSE_CONTENT[id] ?? COURSE_CONTENT.default;
}

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
};

const ResourceIcon = ({ type }: { type: string }) => {
  if (type === "github") return <Code2 className="w-4 h-4" />;
  if (type === "zip") return <Download className="w-4 h-4" />;
  return <FileText className="w-4 h-4" />;
};

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Auth guard
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id } = await params;

  // Fetch real course from Supabase
  const { data: course, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !course) notFound();

  const content = getCourseContent(id);
  const colors = colorMap[content.color] ?? colorMap.violet;

  const completedLessons = content.lessons.filter((l) => l.completed).length;
  const totalLessons = content.lessons.length;

  // Find the first unlocked, incomplete lesson as "active"
  const activeLesson = content.lessons.find((l) => !l.completed && !l.locked) ?? content.lessons[0];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Background */}
      <div className={`fixed inset-0 ${colors.glow} opacity-20 pointer-events-none`} />
      <div className="fixed inset-0 bg-mesh-cyan opacity-10 pointer-events-none mix-blend-screen" />

      {/* Top Nav Bar */}
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
        {/* ── Hero Section ──────────────────────────────────────────── */}
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

                {/* Meta Stats */}
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
                    Instructor: {content.instructor}
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
                <p className="text-xs text-zinc-500 font-medium">{completedLessons}/{totalLessons} lessons done</p>
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
                  className={`h-full bg-gradient-to-r ${colors.progress} rounded-full transition-all duration-1000`}
                  style={{ width: `${course.progress}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Main Content Grid ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left Column: Video + Resources ─────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <section className="relative glass-card rounded-3xl overflow-hidden">
              <div className="grain-overlay" />
              {/* 16:9 aspect ratio video area */}
              <div className="relative w-full aspect-video bg-zinc-900/80 flex items-center justify-center group cursor-pointer">
                {/* Pseudo-thumbnail gradient */}
                <div className={`absolute inset-0 ${colors.glow} opacity-40`} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-all duration-300 group-hover:scale-110">
                    <Play className="w-7 h-7 md:w-10 md:h-10 text-white fill-white ml-1" />
                  </div>
                </div>
                {/* Current lesson tag */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Now Playing</span>
                </div>
                {/* Lesson number */}
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
                      className="group flex items-center gap-3 p-4 rounded-2xl bg-white/3 border border-white/5 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all duration-200"
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

          {/* ── Right Column: Lessons List ──────────────────────────── */}
          <div className="lg:col-span-1">
            <section className="relative glass-card rounded-3xl overflow-hidden sticky top-24">
              <div className="grain-overlay" />
              <div className="relative z-10 p-5 border-b border-white/5">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-violet-400" />
                  Lessons
                </h2>
                <p className="text-[10px] text-zinc-500 mt-0.5 font-medium">
                  {completedLessons} of {totalLessons} completed
                </p>
              </div>
              <ul className="relative z-10 divide-y divide-white/[0.04] max-h-[480px] overflow-y-auto no-scrollbar">
                {content.lessons.map((lesson) => {
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
                          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
                        ) : lesson.locked ? (
                          <Lock className="w-4 h-4 text-zinc-600" />
                        ) : isActive ? (
                          <PlayCircle className="w-4.5 h-4.5 text-violet-400" />
                        ) : (
                          <Circle className="w-4 h-4 text-zinc-600" />
                        )}
                      </div>

                      {/* Lesson Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold truncate ${isActive ? "text-violet-300" : lesson.completed ? "text-zinc-300" : "text-zinc-400"}`}>
                          {lesson.title}
                        </p>
                        <p className="text-[10px] text-zinc-600 mt-0.5">{lesson.duration}</p>
                      </div>

                      {/* Active indicator */}
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
