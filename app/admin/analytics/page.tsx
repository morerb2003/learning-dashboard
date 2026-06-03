import { createClient } from "@/lib/supabase/server";
import AnalyticsChart from "@/components/admin/AnalyticsChart";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();

  const [profilesResult, coursesResult, notesCountResult] = await Promise.all([
    supabase.from("profiles").select("id, role, created_at"),
    supabase.from("courses").select("id, title, progress"),
    supabase.from("notes").select("id", { count: "exact", head: true }),
  ]);

  const users = profilesResult.data ?? [];
  const courses = coursesResult.data ?? [];
  const totalNotes = notesCountResult.count ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white tracking-tight">Platform Analytics & Metrics</h2>
        <p className="text-xs font-semibold text-zinc-500 mt-1 uppercase tracking-wider">Visual telemetry, user onboarding rates, and academic progress</p>
      </div>
      <AnalyticsChart users={users} courses={courses} totalNotes={totalNotes} />
    </div>
  );
}
