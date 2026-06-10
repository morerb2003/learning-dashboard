import { createClient } from "@/lib/supabase/server";
import TeacherStatsCards, { TeacherStats } from "@/components/teacher/TeacherStatsCards";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Plus,
  Users,
  BarChart3,
  ListVideo,
  TrendingUp,
  Clock,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeacherDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    coursesResult,
    lessonsResult,
    enrollmentsResult,
  ] = await Promise.all([
    supabase
      .from("courses")
      .select("id, title, category, level, is_published, created_at, progress", { count: "exact" })
      .eq("teacher_id", user?.id ?? ""),
    supabase.from("lessons").select("id, course_id"),
    supabase.from("enrollments").select("id, course_id, user_id, enrolled_at", { count: "exact" }),
  ]);

  const courses = coursesResult.data ?? [];
  const teacherCourseIds = new Set(courses.map((course) => course.id));
  const totalCourses = coursesResult.count ?? 0;
  const totalLessons = (lessonsResult.data ?? []).filter((lesson) =>
    teacherCourseIds.has(lesson.course_id)
  ).length;
  const enrollments = (enrollmentsResult.data ?? []).filter((enrollment) =>
    teacherCourseIds.has(enrollment.course_id)
  );
  const totalStudents = new Set(enrollments.map((enrollment) => enrollment.user_id)).size;

  // Compute average completion rate from course progress field
  const avgCompletion =
    courses.length > 0
      ? Math.round(
          courses.reduce((sum, c) => sum + (c.progress ?? 0), 0) / courses.length
        )
      : 0;

  const stats: TeacherStats = {
    totalCourses,
    totalStudents,
    totalLessons,
    avgCompletion,
  };

  // Recent courses (last 5)
  const recentCourses = [...courses]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // Enrollment counts per course
  const enrollmentMap: Record<string, number> = {};
  for (const enrollment of enrollments) {
    enrollmentMap[enrollment.course_id] = (enrollmentMap[enrollment.course_id] ?? 0) + 1;
  }

  function formatDate(value: string) {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  }

  const menuItems = [
    {
      href: "/teacher/courses",
      label: "My Courses",
      description: "View and manage all your courses",
      icon: BookOpen,
      color: "violet",
      stat: `${totalCourses} courses`,
    },
    {
      href: "/teacher/courses/create",
      label: "Create Course",
      description: "Build a new course from scratch",
      icon: Plus,
      color: "emerald",
      stat: "New module",
    },
    {
      href: "/teacher/students",
      label: "Students",
      description: "Monitor enrolled student activity",
      icon: Users,
      color: "cyan",
      stat: `${totalStudents} enrolled`,
    },
    {
      href: "/teacher/analytics",
      label: "Analytics",
      description: "Track performance and engagement",
      icon: BarChart3,
      color: "orange",
      stat: `${avgCompletion}% avg`,
    },
  ];

  const colorMap: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
    violet: {
      bg: "bg-mesh-violet",
      text: "text-violet-300",
      border: "border-violet-500/20 hover:border-violet-500/40",
      iconBg: "bg-violet-500/10 ring-violet-500/20",
    },
    emerald: {
      bg: "bg-mesh-emerald",
      text: "text-emerald-300",
      border: "border-emerald-500/20 hover:border-emerald-500/40",
      iconBg: "bg-emerald-500/10 ring-emerald-500/20",
    },
    cyan: {
      bg: "bg-mesh-cyan",
      text: "text-cyan-300",
      border: "border-cyan-500/20 hover:border-cyan-500/40",
      iconBg: "bg-cyan-500/10 ring-cyan-500/20",
    },
    orange: {
      bg: "bg-mesh-orange",
      text: "text-orange-300",
      border: "border-orange-500/20 hover:border-orange-500/40",
      iconBg: "bg-orange-500/10 ring-orange-500/20",
    },
  };

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <TeacherStatsCards stats={stats} />

      {/* Teacher Quick-Access Menu */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-white">Teacher Menu</h2>
          <span className="h-px flex-1 bg-white/5" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const palette = colorMap[item.color];
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative overflow-hidden rounded-2xl border ${palette.border} bg-white/2 p-5 transition-all duration-300 hover:bg-white/4 hover:shadow-lg`}
              >
                <div className={`absolute inset-0 ${palette.bg} opacity-20 pointer-events-none transition-opacity duration-300 group-hover:opacity-35`} />
                <div className="grain-overlay" />
                <div className="relative z-10">
                  <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${palette.iconBg} ring-1 ${palette.text} transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-bold text-white">{item.label}</p>
                  <p className="mt-1 text-[10px] font-medium text-zinc-500 leading-relaxed">
                    {item.description}
                  </p>
                  <div className={`mt-4 flex items-center justify-between`}>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${palette.text}`}>
                      {item.stat}
                    </span>
                    <ArrowRight className={`h-3.5 w-3.5 ${palette.text} transition-transform duration-300 group-hover:translate-x-1`} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Bottom Grid: Recent Courses + Quick Insights */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* Recent Courses Table */}
        <section className="xl:col-span-3 relative overflow-hidden rounded-2xl border border-white/5 bg-white/2 p-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ListVideo className="h-4 w-4 text-violet-400" />
                Recent Courses
              </h3>
              <p className="text-[10px] font-semibold text-zinc-500 mt-0.5 uppercase tracking-wider">
                Your latest course modules
              </p>
            </div>
            <Link
              href="/teacher/courses"
              className="flex items-center gap-1.5 text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                  <th className="py-2.5">Course</th>
                  <th className="py-2.5">Enrollments</th>
                  <th className="py-2.5">Progress</th>
                  <th className="py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentCourses.length > 0 ? (
                  recentCourses.map((course) => {
                    const enrolled = enrollmentMap[course.id] ?? 0;
                    const progress = course.progress ?? 0;
                    return (
                      <tr key={course.id} className="text-zinc-300 hover:bg-white/1 transition-colors">
                        <td className="py-3 pr-4">
                          <p className="font-bold text-white">{course.title}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">
                            {course.category || "General"} - {course.level || "Beginner"}
                          </p>
                        </td>
                        <td className="py-3">
                          <span className="font-semibold text-zinc-300">{enrolled}</span>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-linear-to-r from-violet-500 to-indigo-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-semibold text-zinc-400">{progress}%</span>
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                              course.is_published !== false
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                                : "border-orange-500/20 bg-orange-500/10 text-orange-300"
                            }`}
                          >
                            {course.is_published !== false ? "Live" : "Draft"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-zinc-500 font-semibold">
                      No courses yet.{" "}
                      <Link href="/teacher/courses/create" className="text-violet-400 hover:text-violet-300 underline underline-offset-2">
                        Create your first course -&gt;
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Quick Insights Panel */}
        <section className="xl:col-span-2 space-y-4">
          {/* Teaching Summary */}
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/2 p-5">
            <div className="absolute inset-0 bg-mesh-violet opacity-20 pointer-events-none" />
            <div className="grain-overlay" />
            <div className="relative z-10">
              <h3 className="text-xs font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-violet-400" />
                Teaching Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-[10px] text-zinc-400 font-medium">Published Courses</span>
                  <span className="text-xs font-bold text-violet-300">
                    {courses.filter((c) => c.is_published !== false).length}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-[10px] text-zinc-400 font-medium">Draft Courses</span>
                  <span className="text-xs font-bold text-orange-300">
                    {courses.filter((c) => c.is_published === false).length}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-[10px] text-zinc-400 font-medium">Total Enrollments</span>
                  <span className="text-xs font-bold text-cyan-300">
                    {enrollments.length}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-[10px] text-zinc-400 font-medium">Avg Completion</span>
                  <span className="text-xs font-bold text-emerald-300">{avgCompletion}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Completion Rate Visual */}
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/2 p-5">
            <div className="absolute inset-0 bg-mesh-emerald opacity-20 pointer-events-none" />
            <div className="grain-overlay" />
            <div className="relative z-10">
              <h3 className="text-xs font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-emerald-400" />
                Completion Overview
              </h3>
              <div className="flex items-center gap-4">
                {/* Radial Progress */}
                <div className="relative w-16 h-16 shrink-0">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                    <circle
                      cx="32"
                      cy="32"
                      r="26"
                      fill="none"
                      stroke="url(#teacherGradient)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${(avgCompletion / 100) * 163.4} 163.4`}
                    />
                    <defs>
                      <linearGradient id="teacherGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[11px] font-black text-white">{avgCompletion}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Course Completion</p>
                  <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                    Average across {totalCourses} course{totalCourses !== 1 ? "s" : ""} with {totalLessons} lesson{totalLessons !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
