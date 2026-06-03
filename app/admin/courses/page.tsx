import { createClient } from "@/lib/supabase/server";
import CourseManager from "@/components/admin/CourseManager";

export const dynamic = "force-dynamic";

export default async function AdminCoursesPage() {
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white tracking-tight">Academic Course Catalog</h2>
        <p className="text-xs font-semibold text-zinc-500 mt-1 uppercase tracking-wider">Publish modules, edit details, and modify curriculum progression</p>
      </div>
      <CourseManager initialCourses={courses || []} />
    </div>
  );
}
