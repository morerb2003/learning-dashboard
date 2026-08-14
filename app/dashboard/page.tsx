import Dashboard from "@/components/dashboard/Dashboard";
import type { TabId } from "@/components/layout/Sidebar";
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

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const tab = resolvedSearchParams.tab;

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
    const [
      profileResult,
      coursesResult,
      notesResult,
      progressResult,
      enrollmentsResult,
      attemptsResult,
      assignmentsCountResult,
      submissionsResult,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email, role, avatar_url, subscription_tier")
        .eq("id", user.id)
        .single(),
      supabase
        .from("courses")
        .select("id, title, description, category, level, duration, teacher_name, progress, is_published, icon_name, created_at, price_cents, is_pro")
        .or("is_published.eq.true,is_published.is.null")
        .order("created_at", { ascending: true }),
      supabase
        .from("notes")
        .select("id, title, content, user_id, course_id, created_at, updated_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("lesson_progress")
        .select("lesson_id, completed_at")
        .eq("user_id", user.id)
        .eq("completed", true),
      supabase
        .from("enrollments")
        .select("course_id, progress")
        .eq("user_id", user.id),
      supabase
        .from("attempts")
        .select("score, total_score, submitted_at")
        .eq("student_id", user.id),
      supabase.from("assignments").select("id", { count: "exact", head: true }),
      supabase
        .from("submissions")
        .select("assignment_id, submitted_at")
        .eq("student_id", user.id),
    ]);

    if (!profileResult.error) {
      profile = profileResult.data;
    }

    if (coursesResult.error) {
      console.error("Error querying courses:", coursesResult.error.message);
    } else {
      courses = coursesResult.data || [];
    }

    if (notesResult.error) {
      console.error("Error querying notes:", notesResult.error.message);
    } else {
      notes = notesResult.data || [];
    }

    const progressRows = progressResult.data ?? [];
    const enrollments = enrollmentsResult.data ?? [];
    const attempts = attemptsResult.data ?? [];
    const submissions = submissionsResult.data ?? [];
    const totalAssignments = assignmentsCountResult.count ?? 0;

    totalCompletedLessons = progressRows.length;

    // Map enrolled course progress into courses list
    const enrollmentMap = new Map<string, number>();
    for (const enrollment of enrollments) {
      if (enrollment.course_id && enrollment.progress != null) {
        enrollmentMap.set(enrollment.course_id, enrollment.progress);
      }
    }

    if (enrollmentMap.size > 0) {
      courses = courses.map((course) => {
        const userCourseProgress = enrollmentMap.get(course.id);
        if (userCourseProgress != null) {
          return { ...course, progress: userCourseProgress };
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
      totalAssignments
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
    avatar_url: null,
    subscription_tier: "free",
  };

  return (
    <Dashboard
      key={(tab as string) || "dashboard"}
      initialCourses={courses}
      initialNotes={notes}
      profile={{
        full_name: resolvedProfile.full_name,
        email: resolvedProfile.email,
        role: resolvedProfile.role,
        avatar_url: resolvedProfile.avatar_url ?? null,
        subscription_tier: resolvedProfile.subscription_tier ?? "free",
      }}
      totalCompletedLessons={totalCompletedLessons}
      analytics={analytics}
      defaultTab={((tab as string) || "dashboard") as TabId}
    />
  );
}
