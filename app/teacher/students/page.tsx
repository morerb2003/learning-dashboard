import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { Users, BookOpen, TrendingUp, Calendar, GraduationCap } from "lucide-react";
import CsvDownloadButton from "@/components/teacher/CsvDownloadButton";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default async function TeacherStudentsPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "teacher" && user.role !== "admin")) {
    redirect("/login");
  }

  const supabase = await createClient();

  // 1. Fetch teacher's courses only
  const { data: coursesData } = await supabase
    .from("courses")
    .select("id, title")
    .eq("teacher_id", user.id);

  const courses = coursesData ?? [];
  const teacherCourseIds = courses.map((c) => c.id);
  const courseMap = new Map(courses.map((c) => [c.id, c.title]));

  if (teacherCourseIds.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-cyan-400" />
            Students
          </h2>
          <p className="mt-1 text-xs font-medium text-zinc-500">
            No courses published yet. Create and publish a course to see enrolled students.
          </p>
        </div>
      </div>
    );
  }

  // 2. Fetch enrollments for teacher's courses only (scoped query, not full table)
  const { data: enrollmentsData } = await supabase
    .from("enrollments")
    .select("id, user_id, course_id, enrolled_at, progress, last_accessed_at")
    .in("course_id", teacherCourseIds)
    .order("enrolled_at", { ascending: false });

  const enrollments = enrollmentsData ?? [];

  // 3. Fetch profiles for enrolled students only (scoped by student IDs)
  const studentIds = [...new Set(enrollments.map((e) => e.user_id))];
  let profileMap = new Map<string, { name: string; email: string; created_at: string }>();

  if (studentIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, created_at")
      .in("id", studentIds);

    for (const p of profiles ?? []) {
      profileMap.set(p.id, {
        name: p.full_name || p.email?.split("@")[0] || "Student",
        email: p.email || "",
        created_at: p.created_at,
      });
    }
  }

  // 4. Group enrollments per student
  const studentEnrollments: Record<string, { course_id: string; progress: number; enrolled_at: string; last_accessed_at: string | null }[]> = {};
  for (const e of enrollments) {
    if (!studentEnrollments[e.user_id]) studentEnrollments[e.user_id] = [];
    studentEnrollments[e.user_id].push({
      course_id: e.course_id,
      progress: e.progress ?? 0,
      enrolled_at: e.enrolled_at,
      last_accessed_at: e.last_accessed_at,
    });
  }

  // Build display list sorted by most recently enrolled
  const students = studentIds.map((id) => ({
    id,
    ...(profileMap.get(id) ?? { name: "Student", email: "", created_at: "" }),
    courseEnrollments: studentEnrollments[id] ?? [],
  }));

  const totalEnrollmentCount = enrollments.length;
  const avgProgress =
    enrollments.length > 0
      ? Math.round(
          enrollments.reduce((sum, e) => sum + (e.progress ?? 0), 0) /
            enrollments.length
        )
      : 0;

  // CSV export rows
  const csvRows = students.map((s) => ({
    Name: s.name,
    Email: s.email,
    "Enrolled Courses": s.courseEnrollments
      .map((e) => courseMap.get(e.course_id) ?? "Unknown")
      .join("; "),
    "Avg Progress (%)": s.courseEnrollments.length > 0
      ? Math.round(
          s.courseEnrollments.reduce((sum, e) => sum + e.progress, 0) /
            s.courseEnrollments.length
        )
      : 0,
    "Joined Platform": s.created_at ? formatDate(s.created_at) : "—",
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-white/5 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-300 mb-2">
            <GraduationCap className="h-3.5 w-3.5" />
            <span>Student Roster</span>
          </div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            Students
          </h1>
          <p className="mt-1 text-xs font-medium text-zinc-500">
            All students enrolled in your courses with progress tracking.
          </p>
        </div>
        {csvRows.length > 0 && (
          <CsvDownloadButton
            filename="aura-students.csv"
            label="Export Students"
            rows={csvRows}
          />
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Total Students",
            value: students.length,
            icon: Users,
            color: "text-cyan-300",
            bg: "bg-mesh-cyan",
          },
          {
            label: "Total Enrollments",
            value: totalEnrollmentCount,
            icon: BookOpen,
            color: "text-violet-300",
            bg: "bg-mesh-violet",
          },
          {
            label: "Avg Completion",
            value: `${avgProgress}%`,
            icon: TrendingUp,
            color: "text-emerald-300",
            bg: "bg-mesh-emerald",
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-5"
            >
              <div
                className={`absolute inset-0 ${card.bg} opacity-25 pointer-events-none`}
              />
              <div className="grain-overlay" />
              <div className="relative z-10 flex items-start justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  {card.label}
                </span>
                <div
                  className={`rounded-lg border border-white/10 bg-white/[0.04] p-2 ${card.color}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="relative z-10 mt-6 text-3xl font-black tracking-tight text-white">
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Students Table */}
      <section className="glass-card rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-zinc-500" />
          <h3 className="text-sm font-bold text-white">All Students</h3>
          <span className="ml-auto text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            {students.length} total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-[9px] font-bold uppercase tracking-widest text-zinc-500 bg-white/[0.01]">
                <th className="px-6 py-3">Student</th>
                <th className="px-4 py-3">Enrolled Courses</th>
                <th className="px-4 py-3">Avg Progress</th>
                <th className="px-4 py-3 text-right">Last Active</th>
                <th className="px-6 py-3 text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {students.length > 0 ? (
                students.map((student) => {
                  const enrs = student.courseEnrollments;
                  const avgProg =
                    enrs.length > 0
                      ? Math.round(
                          enrs.reduce((s, e) => s + e.progress, 0) / enrs.length
                        )
                      : 0;

                  // Most recent activity across all enrolled courses
                  const lastActive = enrs
                    .map((e) => e.last_accessed_at)
                    .filter(Boolean)
                    .sort()
                    .reverse()[0];

                  return (
                    <tr
                      key={student.id}
                      className="text-zinc-300 hover:bg-white/[0.01] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-[11px] font-black text-white shrink-0">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white">{student.name}</p>
                            <p className="text-[9px] text-zinc-500 mt-0.5">
                              {student.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {enrs.slice(0, 2).map((e) => (
                            <span
                              key={e.course_id}
                              className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[9px] font-bold text-violet-300 truncate max-w-[130px]"
                            >
                              {courseMap.get(e.course_id) ?? "Unknown"}
                            </span>
                          ))}
                          {enrs.length > 2 && (
                            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold text-zinc-400">
                              +{enrs.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400"
                              style={{ width: `${avgProg}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-zinc-400">
                            {avgProg}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right text-zinc-500 text-[10px] font-semibold">
                        {lastActive ? formatDate(lastActive) : "—"}
                      </td>
                      <td className="px-6 py-4 text-right text-zinc-500 font-semibold">
                        {student.created_at ? formatDate(student.created_at) : "—"}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-zinc-500 font-semibold">
                    <Users className="h-8 w-8 mx-auto mb-3 text-zinc-700" />
                    No students enrolled yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
