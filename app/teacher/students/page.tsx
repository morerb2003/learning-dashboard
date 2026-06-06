import { createClient } from "@/lib/supabase/server";
import { Users, BookOpen, TrendingUp, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeacherStudentsPage() {
  const supabase = await createClient();

  const [studentsResult, coursesResult, enrollmentsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, created_at")
      .eq("role", "student")
      .order("created_at", { ascending: false }),
    supabase.from("courses").select("id, title"),
    supabase.from("enrollments").select("id, user_id, course_id, enrolled_at"),
  ]);

  const students = studentsResult.data ?? [];
  const courses = coursesResult.data ?? [];
  const enrollments = enrollmentsResult.data ?? [];

  // Build lookup maps
  const courseMap = Object.fromEntries(courses.map((c) => [c.id, c.title]));

  // Group enrollments by student
  const studentEnrollments: Record<string, string[]> = {};
  for (const e of enrollments) {
    if (!studentEnrollments[e.user_id]) studentEnrollments[e.user_id] = [];
    studentEnrollments[e.user_id].push(e.course_id);
  }

  function formatDate(value: string) {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <Users className="h-5 w-5 text-cyan-400" />
          Students
        </h2>
        <p className="mt-1 text-xs font-medium text-zinc-500">
          View all enrolled students and their course activity.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Students", value: students.length, icon: Users, color: "text-cyan-300", bg: "bg-mesh-cyan" },
          { label: "Total Enrollments", value: enrollments.length, icon: BookOpen, color: "text-violet-300", bg: "bg-mesh-violet" },
          { label: "Avg Courses / Student", value: students.length > 0 ? (enrollments.length / students.length).toFixed(1) : "0", icon: TrendingUp, color: "text-emerald-300", bg: "bg-mesh-emerald" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-5`}>
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

      {/* Students Table */}
      <section className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02]">
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
              <tr className="border-b border-white/5 text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                <th className="px-6 py-3">Student</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Enrolled Courses</th>
                <th className="px-6 py-3 text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {students.length > 0 ? (
                students.map((student) => {
                  const courseIds = studentEnrollments[student.id] ?? [];
                  const displayName = student.full_name || student.email?.split("@")[0] || "Unknown";
                  return (
                    <tr key={student.id} className="text-zinc-300 hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-[10px] font-black text-white shrink-0">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <p className="font-bold text-white">{displayName}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-400 font-medium">{student.email}</td>
                      <td className="px-6 py-4">
                        {courseIds.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {courseIds.slice(0, 2).map((cid) => (
                              <span
                                key={cid}
                                className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[9px] font-bold text-violet-300 truncate max-w-[120px]"
                              >
                                {courseMap[cid] ?? "Unknown Course"}
                              </span>
                            ))}
                            {courseIds.length > 2 && (
                              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold text-zinc-400">
                                +{courseIds.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-zinc-600 font-semibold">Not enrolled</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-zinc-500 font-semibold">
                        {formatDate(student.created_at)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-zinc-500 font-semibold">
                    No students registered yet.
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
