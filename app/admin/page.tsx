import { createClient } from "@/lib/supabase/server";
import StatsCards, { AdminStats } from "@/components/admin/StatsCards";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const [
    usersCountResult,
    coursesCountResult,
    notesCountResult,
    studentsCountResult,
    recentUsersResult,
    recentCoursesResult,
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("courses").select("*", { count: "exact", head: true }),
    supabase.from("notes").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
    supabase
      .from("profiles")
      .select("id, full_name, email, role, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("courses")
      .select("id, title, category, level, teacher_name, progress, is_published, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const stats: AdminStats = {
    totalUsers: usersCountResult.count ?? 0,
    totalCourses: coursesCountResult.count ?? 0,
    totalNotes: notesCountResult.count ?? 0,
    activeStudents: studentsCountResult.count ?? 0,
  };

  const recentUsers = recentUsersResult.data ?? [];
  const recentCourses = recentCoursesResult.data ?? [];

  function formatDate(value: string) {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  }

  return (
    <div className="space-y-6">
      {/* KPI Stats Cards */}
      <StatsCards stats={stats} />

      {/* Grid for lists */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Recent Users Panel */}
        <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Recent Registrations</h3>
              <p className="text-[10px] font-semibold text-zinc-500 mt-0.5 uppercase tracking-wider">Newest student and teacher accounts</p>
            </div>
            <Link
              href="/admin/users"
              className="flex items-center gap-1.5 text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors"
            >
              Manage Users <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                  <th className="py-2.5">User</th>
                  <th className="py-2.5">Role</th>
                  <th className="py-2.5 text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentUsers.length > 0 ? (
                  recentUsers.map((user) => {
                    const displayName = user.full_name || user.email?.split("@")[0] || "Unnamed";
                    return (
                      <tr key={user.id} className="text-zinc-300">
                        <td className="py-3">
                          <p className="font-bold text-white">{displayName}</p>
                          <p className="text-[10px] text-zinc-500">{user.email}</p>
                        </td>
                        <td className="py-3">
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-semibold capitalize tracking-wide">
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 text-right text-zinc-500 font-semibold">{formatDate(user.created_at)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-zinc-500 font-semibold">
                      No recent user records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent Courses Panel */}
        <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Recent Course Additions</h3>
              <p className="text-[10px] font-semibold text-zinc-500 mt-0.5 uppercase tracking-wider">Latest learning modules created</p>
            </div>
            <Link
              href="/admin/courses"
              className="flex items-center gap-1.5 text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors"
            >
              Manage Catalog <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                  <th className="py-2.5">Course</th>
                  <th className="py-2.5">Teacher</th>
                  <th className="py-2.5 text-right">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentCourses.length > 0 ? (
                  recentCourses.map((course) => (
                    <tr key={course.id} className="text-zinc-300">
                      <td className="py-3">
                        <p className="font-bold text-white">{course.title}</p>
                        <p className="text-[10px] text-zinc-500">{course.category || "General"}</p>
                      </td>
                      <td className="py-3 text-zinc-400 font-medium">{course.teacher_name || "Unassigned"}</td>
                      <td className="py-3 text-right">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                            course.is_published !== false
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                              : "border-orange-500/20 bg-orange-500/10 text-orange-300"
                          }`}
                        >
                          {course.is_published !== false ? "Published" : "Draft"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-zinc-500 font-semibold">
                      No recent courses found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}
