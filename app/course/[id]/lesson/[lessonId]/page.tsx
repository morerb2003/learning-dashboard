import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/roles";
import { getLessonProgressForCourse } from "@/lib/course/progress";
import MarkCompleteButton from "@/components/course/MarkCompleteButton";
import VideoPlayer from "@/components/course/VideoPlayer";

export const dynamic = "force-dynamic";

interface LessonPageProps {
  params: Promise<{ id: string; lessonId: string }>;
}


export default async function LessonPage({ params }: LessonPageProps) {
  const { id, lessonId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=/course/${id}/lesson/${lessonId}`);
  }

  const supabase = await createClient();

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, title, progress, icon_name, created_at")
    .eq("id", id)
    .single();

  if (courseError || !course) notFound();

  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", lessonId)
    .eq("course_id", id)
    .single();

  if (lessonError || !lesson) notFound();

  // Fetch all lessons in this course for prev/next navigation
  // video_url is included so VideoPlayer can resolve each lesson's embed URL
  const { data: allLessons } = await supabase
    .from("lessons")
    .select("id, title, lesson_order, video_url")
    .eq("course_id", id)
    .order("lesson_order", { ascending: true });

  const isAdmin = user.role === "admin";
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id, last_accessed_at")
    .eq("user_id", user.id)
    .eq("course_id", id)
    .maybeSingle();

  if (!isAdmin && !enrollment) {
    redirect(`/course/${id}`);
  }

  if (enrollment) {
    await supabase
      .from("enrollments")
      .update({ last_accessed_at: new Date().toISOString() })
      .eq("id", enrollment.id);
  }

  // Fetch real lesson progress for this course
  const progressRows = await getLessonProgressForCourse(id);
  const completedLessonIds = new Set(progressRows.map((p) => p.lesson_id));
  const isCompleted = completedLessonIds.has(lessonId);

  // Total and completed counts for progress display
  const totalLessons = allLessons?.length ?? 0;
  const completedCount = completedLessonIds.size;
  const progressPct =
    totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const sortedLessons = allLessons ?? [];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="fixed inset-0 bg-mesh-violet opacity-20 pointer-events-none" />
      <div className="fixed inset-0 bg-mesh-cyan opacity-10 pointer-events-none mix-blend-screen" />

      {/* Nav */}
      <nav className="sticky top-0 z-50 glass-card border-b border-white/5 px-4 md:px-8 h-16 flex items-center justify-between">
        <Link
          href={`/course/${id}`}
          className="flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Course
        </Link>
        <span className="text-xs font-bold text-zinc-500 hidden sm:block">
          AURA &bull; Lesson View
        </span>
        <div className="flex items-center gap-2">
          {/* Real progress pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-xs font-bold text-emerald-300">
            {completedCount}/{totalLessons} done
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-xs font-bold text-cyan-300">
            <Sparkles className="w-3 h-3" />
            Lesson {lesson.lesson_order}
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Hero section */}
        <section className="relative overflow-hidden rounded-3xl glass-card p-6 md:p-10">
          <div className="absolute inset-0 bg-mesh-violet opacity-60 pointer-events-none" />
          <div className="grain-overlay" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-violet-300">
                <BookOpen className="h-3.5 w-3.5" />
                {course.title}
              </div>
              <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white">
                {lesson.title}
              </h1>
              <p className="text-sm md:text-base leading-relaxed text-zinc-400">
                {lesson.description || "No lesson description has been added yet."}
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 text-xs sm:min-w-[280px]">
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                <p className="text-zinc-500 uppercase tracking-wider font-bold text-[10px]">Order</p>
                <p className="mt-2 text-lg font-black text-white">{lesson.lesson_order}</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                <p className="text-zinc-500 uppercase tracking-wider font-bold text-[10px]">Video</p>
                <p className="mt-2 text-lg font-black text-white">
                  {lesson.video_url ? "Ready" : "None"}
                </p>
              </div>
              <div className="col-span-2 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                <p className="text-zinc-500 uppercase tracking-wider font-bold text-[10px]">
                  Course Progress
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <p className="text-lg font-black text-white">{progressPct}%</p>
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full transition-all duration-700"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video + Notes */}
          <div className="lg:col-span-2 space-y-6">
            {/* ── Video Player ─────────────────────────────────────────────── */}
            <VideoPlayer
              lesson={{
                id: lesson.id,
                title: lesson.title,
                lesson_order: lesson.lesson_order,
                video_url: lesson.video_url,
              }}
              allLessons={sortedLessons}
              courseId={id}
            />

            <div className="rounded-3xl glass-card p-6">
              <h2 className="text-sm font-bold text-white">Lesson Notes</h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                Use this space to add notes, supporting links, or a transcript
                later. For now it gives the lesson a real destination and keeps
                the route useful.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* ✓ Mark Complete button */}
            <MarkCompleteButton
              lessonId={lessonId}
              courseId={id}
              initialCompleted={isCompleted}
            />

            <div className="rounded-3xl glass-card p-6">
              <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                <Clock className="h-4 w-4 text-cyan-300" />
                Lesson Meta
              </h2>
              <dl className="mt-4 space-y-4 text-sm">
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Lesson Order
                  </dt>
                  <dd className="mt-1 text-zinc-300">{lesson.lesson_order}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Created
                  </dt>
                  <dd className="mt-1 text-zinc-300">
                    {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
                      new Date(lesson.created_at)
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Status
                  </dt>
                  <dd className="mt-1 text-zinc-300">
                    {isCompleted ? "✅ Completed" : "⬜ Not completed"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Source
                  </dt>
                  <dd className="mt-1 text-zinc-300">
                    {lesson.video_url ? "External video" : "Admin only"}
                  </dd>
                </div>
              </dl>
            </div>

            {lesson.video_url && (
              <a
                href={lesson.video_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-bold text-cyan-200 transition hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-white"
              >
                <ExternalLink className="h-4 w-4" />
                Open Video Source
              </a>
            )}
          </aside>
        </section>
      </main>
    </div>
  );
}
