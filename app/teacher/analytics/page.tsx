import { createClient } from "@/lib/supabase/server";
import TeacherAnalyticsChart from "@/components/teacher/TeacherAnalyticsChart";
import { BarChart3, TrendingUp, Users, BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeacherAnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [coursesResult, studentsResult, enrollmentsResult, lessonsResult] = await Promise.all([
    supabase
      .from("courses")
      .select("id, title, progress, category, level, is_published, created_at")
      .eq("teacher_id", user?.id ?? ""),
    supabase.from("profiles").select("id, created_at").eq("role", "student"),
    supabase.from("enrollments").select("id, course_id, user_id, enrolled_at"),
    supabase.from("lessons").select("id, course_id"),
  ]);

  const courses = coursesResult.data ?? [];
  const students = studentsResult.data ?? [];
  const teacherCourseIds = new Set(courses.map((course) => course.id));
  const enrollments = (enrollmentsResult.data ?? []).filter((enrollment) =>
    teacherCourseIds.has(enrollment.course_id)
  );
  const lessons = (lessonsResult.data ?? []).filter((lesson) =>
    teacherCourseIds.has(lesson.course_id)
  );

  // Compute per-course enrollment counts
  const enrollmentMap: Record<string, number> = {};
  for (const e of enrollments) {
    enrollmentMap[e.course_id] = (enrollmentMap[e.course_id] ?? 0) + 1;
  }

  // Compute per-course lesson counts
  const lessonMap: Record<string, number> = {};
  for (const l of lessons) {
    lessonMap[l.course_id] = (lessonMap[l.course_id] ?? 0) + 1;
  }

  const avgCompletion =
    courses.length > 0
      ? Math.round(courses.reduce((s, c) => s + (c.progress ?? 0), 0) / courses.length)
      : 0;

  const publishedCount = courses.filter((c) => c.is_published !== false).length;
  const draftCount = courses.length - publishedCount;

  const summaryCards = [
    { label: "Avg Completion", value: `${avgCompletion}%`, icon: TrendingUp, color: "text-emerald-300", bg: "bg-mesh-emerald" },
    { label: "Published Courses", value: publishedCount, icon: BookOpen, color: "text-violet-300", bg: "bg-mesh-violet" },
    { label: "Total Enrollments", value: enrollments.length, icon: Users, color: "text-cyan-300", bg: "bg-mesh-cyan" },
    { label: "Draft Courses", value: draftCount, icon: BarChart3, color: "text-orange-300", bg: "bg-mesh-orange" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-orange-400" />
          Analytics
        </h2>
        <p className="mt-1 text-xs font-medium text-zinc-500">
          Track course performance, enrollment trends, and student engagement.
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className={`absolute inset-0 ${card.bg} opacity-25 pointer-events-none`} />
              <div className="grain-overlay" />
              <div className="relative z-10 flex items-start justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{card.label}</span>
                <div className={`rounded-lg border border-white/10 bg-white/[0.04] p-2 ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="relative z-10 mt-6 text-3xl font-black tracking-tight text-white">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <TeacherAnalyticsChart
        courses={courses.map((c) => ({
          id: c.id,
          title: c.title,
          progress: c.progress ?? 0,
          enrollments: enrollmentMap[c.id] ?? 0,
          lessons: lessonMap[c.id] ?? 0,
          category: c.category ?? "General",
          is_published: c.is_published !== false,
          created_at: c.created_at,
        }))}
        students={students}
        enrollments={enrollments}
      />
    </div>
  );
}
