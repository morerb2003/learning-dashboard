import AdminDashboard, {
  AdminCourseRow,
  AdminProfileRow,
  AdminStats,
} from "@/components/admin/AdminDashboard";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, avatar_url, created_at")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    redirect("/");
  }

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
      .select("id, full_name, email, role, avatar_url, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("courses")
      .select("id, title, description, category, level, teacher_name, progress, color, is_published, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const stats: AdminStats = {
    totalUsers: usersCountResult.count ?? 0,
    totalCourses: coursesCountResult.count ?? 0,
    totalNotes: notesCountResult.count ?? 0,
    activeStudents: studentsCountResult.count ?? 0,
  };

  return (
    <AdminDashboard
      adminProfile={profile as AdminProfileRow}
      stats={stats}
      recentUsers={(recentUsersResult.data ?? []) as AdminProfileRow[]}
      recentCourses={(recentCoursesResult.data ?? []) as AdminCourseRow[]}
    />
  );
}
