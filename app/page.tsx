import Dashboard from "@/components/dashboard/Dashboard";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Course } from "@/types/course";
import { Note } from "@/types/note";

export const dynamic = "force-dynamic";

export default async function Home() {
  let courses: Course[] = [];
  let notes: Note[] = [];
  let totalCompletedLessons = 0;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let profile = null;

  try {
    // Fetch user profile
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profileError) {
      profile = profileData;
    }

    // Fetch courses
    const { data: coursesData, error: coursesError } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: true });

    if (coursesError) {
      console.error("Error querying courses:", coursesError.message);
    } else {
      courses = coursesData || [];
    }

    // Fetch notes
    const { data: notesData, error: notesError } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (notesError) {
      console.error("Error querying notes:", notesError.message);
    } else {
      notes = notesData || [];
    }

    // ── Real lesson progress ──────────────────────────────────────────────
    // Fetch all lessons and all completed lesson_progress rows for this user
    const [{ data: allLessons }, { data: progressRows }] = await Promise.all([
      supabase.from("lessons").select("id, course_id"),
      supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", user.id)
        .eq("completed", true),
    ]);

    if (allLessons && progressRows) {
      const completedIds = new Set(progressRows.map((p) => p.lesson_id));
      totalCompletedLessons = completedIds.size;

      // Build a lookup: courseId -> { total, completed }
      const courseStats: Record<string, { total: number; completed: number }> = {};
      for (const lesson of allLessons) {
        if (!courseStats[lesson.course_id]) {
          courseStats[lesson.course_id] = { total: 0, completed: 0 };
        }
        courseStats[lesson.course_id].total++;
        if (completedIds.has(lesson.id)) {
          courseStats[lesson.course_id].completed++;
        }
      }

      // Override course.progress with real calculated percentage
      courses = courses.map((course) => {
        const stats = courseStats[course.id];
        if (stats && stats.total > 0) {
          return {
            ...course,
            progress: Math.round((stats.completed / stats.total) * 100),
          };
        }
        return course;
      });
    }
  } catch (err) {
    console.error("Database connection exception:", err);
  }

  const resolvedProfile = profile || {
    id: user.id,
    full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Student",
    email: user.email || "student@aura.edu",
    role: "student",
  };

  return (
    <Dashboard
      initialCourses={courses}
      initialNotes={notes}
      profile={resolvedProfile}
      totalCompletedLessons={totalCompletedLessons}
    />
  );
}
