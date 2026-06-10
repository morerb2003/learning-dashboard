import { createClient } from "@/lib/supabase/server";
import AnalyticsChart from "@/components/admin/AnalyticsChart";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();

  const [
    profilesResult,
    coursesResult,
    notesResult,
    enrollmentsResult,
    progressResult,
    attemptsResult,
    submissionsResult,
  ] = await Promise.all([
    supabase.from("profiles").select("id, role, created_at"),
    supabase.from("courses").select("id, title"),
    supabase.from("notes").select("id, created_at"),
    supabase.from("enrollments").select("id, course_id, progress, enrolled_at"),
    supabase.from("lesson_progress").select("id, completed_at").eq("completed", true),
    supabase.from("attempts").select("id, score, total_score, submitted_at"),
    supabase.from("submissions").select("id, status, submitted_at, reviewed_at"),
  ]);

  const users = profilesResult.data ?? [];
  const enrollments = enrollmentsResult.data ?? [];
  const courseProgress = new Map<string, { total: number; count: number }>();

  for (const enrollment of enrollments) {
    const current = courseProgress.get(enrollment.course_id) ?? { total: 0, count: 0 };
    current.total += enrollment.progress ?? 0;
    current.count += 1;
    courseProgress.set(enrollment.course_id, current);
  }

  const courses = (coursesResult.data ?? []).map((course) => {
    const progress = courseProgress.get(course.id);
    return {
      ...course,
      progress: progress ? Math.round(progress.total / progress.count) : 0,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white tracking-tight">Platform Analytics & Metrics</h2>
        <p className="text-xs font-semibold text-zinc-500 mt-1 uppercase tracking-wider">Visual telemetry, user onboarding rates, and academic progress</p>
      </div>
      <AnalyticsChart
        users={users}
        courses={courses}
        notes={notesResult.data ?? []}
        enrollments={enrollments}
        lessonProgress={progressResult.data ?? []}
        attempts={attemptsResult.data ?? []}
        submissions={submissionsResult.data ?? []}
      />
    </div>
  );
}
