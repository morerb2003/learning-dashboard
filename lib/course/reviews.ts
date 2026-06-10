"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveCourseReview(
  courseId: string,
  rating: number,
  review: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in." };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Choose a rating between 1 and 5." };
  }

  const normalizedReview = review.trim();
  if (normalizedReview.length < 3 || normalizedReview.length > 2000) {
    return { error: "Review must be between 3 and 2000 characters." };
  }

  const { error } = await supabase.from("course_reviews").upsert(
    {
      course_id: courseId,
      student_id: user.id,
      rating,
      review: normalizedReview,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "course_id,student_id" }
  );

  if (error) return { error: error.message };

  revalidatePath(`/course/${courseId}`);
  return { success: true };
}

export async function deleteCourseReview(courseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("course_reviews")
    .delete()
    .eq("course_id", courseId)
    .eq("student_id", user.id);

  if (error) return { error: error.message };

  revalidatePath(`/course/${courseId}`);
  return { success: true };
}
