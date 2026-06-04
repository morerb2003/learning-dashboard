"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Course } from "@/types/course";
import type { EnrollmentWithCourse } from "@/types/enrollment";

type EnrollmentRow = {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  progress: number | null;
  last_accessed_at: string | null;
  courses: Course | Course[] | null;
};

async function getCurrentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, userId: user?.id ?? null };
}

function readCourseId(courseIdOrFormData: string | FormData) {
  const courseId =
    typeof courseIdOrFormData === "string"
      ? courseIdOrFormData
      : courseIdOrFormData.get("courseId");

  if (typeof courseId !== "string" || !courseId.trim()) {
    throw new Error("Missing course id.");
  }

  return courseId;
}

function normalizeEnrollment(row: EnrollmentRow): EnrollmentWithCourse | null {
  const course = Array.isArray(row.courses) ? row.courses[0] : row.courses;
  if (!course) return null;

  return {
    id: row.id,
    user_id: row.user_id,
    course_id: row.course_id,
    enrolled_at: row.enrolled_at,
    progress: row.progress ?? 0,
    last_accessed_at: row.last_accessed_at ?? row.enrolled_at,
    course,
  };
}

export async function enrollUser(courseIdOrFormData: string | FormData) {
  const courseId = readCourseId(courseIdOrFormData);
  const { supabase, userId } = await getCurrentUserId();

  if (!userId) {
    redirect(`/login?next=/course/${courseId}`);
  }

  const { error } = await supabase.from("enrollments").upsert(
    {
      user_id: userId,
      course_id: courseId,
      last_accessed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,course_id" }
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/learning");
  revalidatePath(`/course/${courseId}`);
  redirect("/learning");
}

export async function unenrollUser(courseIdOrFormData: string | FormData) {
  const courseId = readCourseId(courseIdOrFormData);
  const { supabase, userId } = await getCurrentUserId();

  if (!userId) {
    redirect(`/login?next=/course/${courseId}`);
  }

  const { error } = await supabase
    .from("enrollments")
    .delete()
    .eq("user_id", userId)
    .eq("course_id", courseId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/learning");
  revalidatePath(`/course/${courseId}`);
}

export async function isUserEnrolled(courseId: string) {
  const { supabase, userId } = await getCurrentUserId();
  if (!userId) return false;

  const { data, error } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (error) {
    console.error("Error checking enrollment:", error.message);
    return false;
  }

  return Boolean(data);
}

export async function getUserEnrollments() {
  const { supabase, userId } = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("enrollments")
    .select(
      "id, user_id, course_id, enrolled_at, progress, last_accessed_at, courses(id, title, progress, icon_name, created_at)"
    )
    .eq("user_id", userId)
    .order("last_accessed_at", { ascending: false });

  if (error) {
    console.error("Error loading enrollments:", error.message);
    return [];
  }

  return ((data ?? []) as EnrollmentRow[])
    .map(normalizeEnrollment)
    .filter((enrollment): enrollment is EnrollmentWithCourse => Boolean(enrollment));
}
