import { createClient } from "@/lib/supabase/server";
import CourseManager from "@/components/admin/CourseManager";

export const dynamic = "force-dynamic";

export default async function TeacherCoursesPage() {
  const supabase = await createClient();

  const [coursesResult, lessonsResult] = await Promise.all([
    supabase
      .from("courses")
      .select("id, title, progress, icon_name, created_at, description, category, level, teacher_name, color, is_published")
      .order("created_at", { ascending: false }),
    supabase
      .from("lessons")
      .select("id, course_id, title, description, video_url, lesson_order, created_at")
      .order("lesson_order", { ascending: true }),
  ]);

  const courses = coursesResult.data ?? [];
  const lessons = lessonsResult.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black text-white">My Courses</h2>
        <p className="mt-1 text-xs font-medium text-zinc-500">
          Create, edit, and manage your course catalog and lesson content.
        </p>
      </div>
      <CourseManager initialCourses={courses} initialLessons={lessons} />
    </div>
  );
}
