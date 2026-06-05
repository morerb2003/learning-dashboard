"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { LessonProgress } from "@/types/lesson_progress";

async function getCurrentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

/**
 * Mark a lesson as complete for the current user.
 * Upserts a lesson_progress row, then recalculates + updates
 * the enrollment progress percentage for the given course.
 */
export async function markLessonComplete(lessonId: string, courseId: string) {
  const { supabase, userId } = await getCurrentUserId();
  if (!userId) return { error: "Not authenticated" };

  // 1. Upsert the lesson_progress row
  const { error: upsertError } = await supabase
    .from("lesson_progress")
    .upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        completed: true,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" }
    );

  if (upsertError) {
    console.error("Error upserting lesson_progress:", upsertError.message);
    return { error: upsertError.message };
  }

  // 2. Fetch all lessons for this course (to get the total count)
  const { data: allLessons, error: lessonsError } = await supabase
    .from("lessons")
    .select("id")
    .eq("course_id", courseId);

  if (lessonsError || !allLessons) {
    console.error("Error fetching lessons:", lessonsError?.message);
    return { error: lessonsError?.message ?? "Could not load lessons" };
  }

  const totalLessons = allLessons.length;
  if (totalLessons === 0) return { success: true };

  // 3. Fetch completed lessons for this user within this course
  const lessonIds = allLessons.map((l) => l.id);
  const { data: completedRows, error: progressError } = await supabase
    .from("lesson_progress")
    .select("id")
    .eq("user_id", userId)
    .eq("completed", true)
    .in("lesson_id", lessonIds);

  if (progressError) {
    console.error("Error fetching lesson_progress:", progressError.message);
    return { error: progressError.message };
  }

  const completedCount = completedRows?.length ?? 0;
  const progressPct = Math.round((completedCount / totalLessons) * 100);

  // 4. Update enrollment progress
  const { error: enrollmentError } = await supabase
    .from("enrollments")
    .update({ progress: progressPct })
    .eq("user_id", userId)
    .eq("course_id", courseId);

  if (enrollmentError) {
    console.error("Error updating enrollment:", enrollmentError.message);
    return { error: enrollmentError.message };
  }

  // 5. Revalidate all affected pages
  revalidatePath(`/course/${courseId}`);
  revalidatePath(`/course/${courseId}/lesson/${lessonId}`);
  revalidatePath("/learning");
  revalidatePath("/");

  return { success: true, progressPct };
}

/**
 * Get all lesson_progress rows for the current user
 * filtered to the lessons belonging to a specific course.
 */
export async function getLessonProgressForCourse(
  courseId: string
): Promise<LessonProgress[]> {
  const { supabase, userId } = await getCurrentUserId();
  if (!userId) return [];

  // First get lesson ids for this course
  const { data: lessons, error: lessonsError } = await supabase
    .from("lessons")
    .select("id")
    .eq("course_id", courseId);

  if (lessonsError || !lessons || lessons.length === 0) return [];

  const lessonIds = lessons.map((l) => l.id);

  const { data, error } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("completed", true)
    .in("lesson_id", lessonIds);

  if (error) {
    console.error("Error fetching lesson_progress:", error.message);
    return [];
  }

  return (data ?? []) as LessonProgress[];
}

/**
 * Get all lesson_progress rows for the current user across ALL courses.
 * Used by the dashboard to compute real per-course progress.
 */
export async function getAllLessonProgress(): Promise<LessonProgress[]> {
  const { supabase, userId } = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("completed", true);

  if (error) {
    console.error("Error fetching all lesson_progress:", error.message);
    return [];
  }

  return (data ?? []) as LessonProgress[];
}
