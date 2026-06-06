import { createClient } from "@/lib/supabase/server";
import CourseManager from "@/components/admin/CourseManager";

export const dynamic = "force-dynamic";

export default async function TeacherCoursesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single()
    : { data: null };

  const coursesResult = user
    ? await supabase
        .from("courses")
        .select("id, teacher_id, title, progress, icon_name, thumbnail_url, created_at, description, category, level, teacher_name, color, is_published")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  const courses = coursesResult.data ?? [];
  const courseIds = courses.map((course) => course.id);
  const lessonsResult = courseIds.length > 0
    ? await supabase
        .from("lessons")
        .select("id, course_id, title, description, video_url, lesson_order, created_at")
        .in("course_id", courseIds)
        .order("lesson_order", { ascending: true })
    : { data: [] };
  const lessons = lessonsResult.data ?? [];
  const teacherName = profile?.full_name || profile?.email?.split("@")[0] || null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black text-white">My Courses</h2>
        <p className="mt-1 text-xs font-medium text-zinc-500">
          Create, edit, and manage your course catalog and lesson content.
        </p>
      </div>
      <CourseManager
        initialCourses={courses}
        initialLessons={lessons}
        currentUserId={user?.id}
        currentTeacherId={user?.id}
        currentTeacherName={teacherName}
        mode="teacher"
      />
    </div>
  );
}
