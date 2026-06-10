import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  Clock,
  ClipboardList,
  GraduationCap,
  HelpCircle,
  PlayCircle,
  Search,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserEnrollments, unenrollUser } from "@/lib/course/enrollment";
import RealtimeRefresh from "@/components/realtime/RealtimeRefresh";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default async function LearningPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/learning");
  }

  const enrollments = await getUserEnrollments();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <RealtimeRefresh
        channelName="learning-workspace-live"
        tables={["enrollments", "lesson_progress", "courses"]}
      />
      <div className="fixed inset-0 bg-mesh-violet opacity-20 pointer-events-none" />
      <div className="fixed inset-0 bg-mesh-cyan opacity-10 pointer-events-none mix-blend-screen" />

      <nav className="sticky top-0 z-50 glass-card border-b border-white/5 px-4 md:px-8 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>
        <span className="text-xs font-bold text-zinc-500 hidden sm:block">AURA &bull; My Learning</span>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-xs font-bold text-cyan-300">
          <BookOpen className="w-3 h-3" />
          {enrollments.length} Enrolled
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-violet-300">
                <GraduationCap className="h-3.5 w-3.5" />
                Learning Workspace
              </div>
              <h1 className="mt-3 text-2xl md:text-4xl font-black tracking-tight text-white">
                My Courses
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                Continue enrolled modules, review progress, and jump back into the courses you selected.
              </p>
            </div>

            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/4 px-5 text-xs font-bold text-zinc-300 transition hover:border-violet-400/30 hover:bg-violet-500/10 hover:text-white"
            >
              <Search className="h-4 w-4" />
              Explore Courses
            </Link>
            <Link
              href="/learning/assignments"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-cyan-300 via-sky-300 to-violet-300 px-5 text-xs font-black text-zinc-950 shadow-xl shadow-cyan-500/20 transition hover:brightness-110"
            >
              <ClipboardList className="h-4 w-4" />
              View Assignments
            </Link>
            <Link
              href="/learning/quizzes"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/4 px-5 text-xs font-bold text-zinc-300 transition hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-white"
            >
              <HelpCircle className="h-4 w-4" />
              View Quizzes
            </Link>
          </div>
        </section>

        {enrollments.length > 0 ? (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {enrollments.map((enrollment, index) => {
              const courseProgress = enrollment.progress;
              const meshClasses = ["bg-mesh-violet", "bg-mesh-cyan", "bg-mesh-emerald", "bg-mesh-orange"];

              return (
                <article
                  key={enrollment.id}
                  className="relative overflow-hidden rounded-3xl glass-card min-h-65 p-6"
                >
                  <div className={`absolute inset-0 ${meshClasses[index % meshClasses.length]} opacity-70 pointer-events-none`} />
                  <div className="grain-overlay" />

                  <div className="relative z-10 flex h-full flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/6">
                        <BookOpen className="h-5 w-5 text-violet-200" />
                      </div>
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                        Enrolled
                      </span>
                    </div>

                    <div className="mt-6 flex-1 space-y-3">
                      <h2 className="text-lg font-black leading-tight text-white">
                        {enrollment.course.title}
                      </h2>
                      <div className="grid grid-cols-1 gap-2 text-xs text-zinc-400">
                        <div className="flex items-center gap-2">
                          <CalendarClock className="h-3.5 w-3.5 text-zinc-500" />
                          Enrolled {formatDate(enrollment.enrolled_at)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-zinc-500" />
                          Last accessed {formatDate(enrollment.last_accessed_at)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-zinc-500">Progress</span>
                        <span className="text-zinc-200">{courseProgress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/5">
                        <div
                            className="h-full rounded-full bg-linear-to-r from-violet-500 to-cyan-400"
                          style={{ width: `${courseProgress}%` }}
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <Link
                          href={`/course/${enrollment.course.id}`}
                          className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-xs font-black text-zinc-950 transition hover:bg-zinc-100"
                        >
                          <PlayCircle className="h-4 w-4" />
                          Continue
                        </Link>
                        <form action={unenrollUser}>
                          <input type="hidden" name="courseId" value={enrollment.course.id} />
                          <button
                            type="submit"
                            className="inline-flex h-10 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/4 px-3 text-zinc-400 transition hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-200 sm:w-11"
                            aria-label={`Unenroll from ${enrollment.course.title}`}
                            title="Unenroll"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <section className="relative overflow-hidden rounded-3xl glass-card p-8 md:p-12 text-center">
            <div className="absolute inset-0 bg-mesh-cyan opacity-40 pointer-events-none" />
            <div className="grain-overlay" />
            <div className="relative z-10 mx-auto max-w-xl space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/6">
                <BookOpen className="h-6 w-6 text-cyan-200" />
              </div>
              <h2 className="text-xl font-black text-white">No enrolled courses yet</h2>
              <p className="text-sm text-zinc-400">
                Browse the dashboard course catalog, open a course, and enroll to build your learning list.
              </p>
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-cyan-300 via-sky-300 to-violet-300 px-5 text-xs font-black text-zinc-950 shadow-xl shadow-cyan-500/20 transition hover:brightness-110"
              >
                Explore Courses
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
