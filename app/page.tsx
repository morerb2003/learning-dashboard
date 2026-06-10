import Dashboard from "@/components/dashboard/Dashboard";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Course } from "@/types/course";
import { Note } from "@/types/note";
import {
  average,
  buildWeeklyActivity,
  calculateStreak,
  percentage,
} from "@/lib/analytics/calculations";

export const dynamic = "force-dynamic";

export default async function Home() {
  let courses: Course[] = [];
  let notes: Note[] = [];
  let totalCompletedLessons = 0;
  let analytics = {
    averageCourseProgress: 0,
    averageQuizScore: 0,
    assignmentCompletion: 0,
    streakDays: 0,
    activeWeekdays: [] as number[],
    weeklyActivity: [] as Array<{ day: string; modules: number }>,
  };

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
    const [
      { data: allLessons },
      { data: progressRows },
      { data: enrollments },
      { data: attempts },
      { data: assignments },
      { data: submissions },
    ] = await Promise.all([
      supabase.from("lessons").select("id, course_id"),
      supabase
        .from("lesson_progress")
        .select("lesson_id, completed_at")
        .eq("user_id", user.id)
        .eq("completed", true),
      supabase.from("enrollments").select("progress").eq("user_id", user.id),
      supabase
        .from("attempts")
        .select("score, total_score, submitted_at")
        .eq("student_id", user.id),
      supabase.from("assignments").select("id"),
      supabase
        .from("submissions")
        .select("assignment_id, submitted_at")
        .eq("student_id", user.id),
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

    const averageCourseProgress = average(
      (enrollments ?? []).map((row) => row.progress ?? 0)
    );
    const averageQuizScore = average(
      (attempts ?? []).map((row) =>
        row.total_score > 0 ? (row.score / row.total_score) * 100 : 0
      )
    );
    const assignmentCompletion = percentage(
      submissions?.length ?? 0,
      assignments?.length ?? 0
    );

    const activityDates = [
      ...(progressRows ?? []).map((row) => row.completed_at),
      ...(attempts ?? []).map((row) => row.submitted_at),
      ...(submissions ?? []).map((row) => row.submitted_at),
    ].filter((value): value is string => Boolean(value));
    const activeDateKeys = new Set(
      activityDates.map((value) => new Date(value).toISOString().slice(0, 10))
    );
    const today = new Date();
    const streakDays = calculateStreak(activityDates, today);
    const weeklyActivity = buildWeeklyActivity(activityDates, today);
    const mondayIndex = (today.getDay() + 6) % 7;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - mondayIndex);
    weekStart.setHours(0, 0, 0, 0);
    const activeWeekdays = Array.from(activeDateKeys)
      .map((key) => new Date(`${key}T00:00:00`))
      .filter((date) => date >= weekStart)
      .map((date) => (date.getDay() + 6) % 7);

    analytics = {
      averageCourseProgress,
      averageQuizScore,
      assignmentCompletion,
      streakDays,
      activeWeekdays: Array.from(new Set(activeWeekdays)),
      weeklyActivity,
    };
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
      analytics={analytics}
    />
  );
}
