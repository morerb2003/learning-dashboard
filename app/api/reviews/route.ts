import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/roles";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json({ error: "courseId is required." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: reviews, error } = await supabase
      .from("course_reviews")
      .select("id, course_id, student_id, rating, review_text, created_at, updated_at, profiles(full_name, email, avatar_url)")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formattedReviews = (reviews ?? []).map((r: any) => ({
      id: r.id,
      course_id: r.course_id,
      student_id: r.student_id,
      rating: r.rating,
      review_text: r.review_text,
      created_at: r.created_at,
      updated_at: r.updated_at,
      student_name: r.profiles?.full_name || r.profiles?.email?.split("@")[0] || "Student",
      student_avatar_url: r.profiles?.avatar_url || null,
    }));

    return NextResponse.json({ reviews: formattedReviews });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await request.json();
    const { courseId, rating, reviewText } = body;

    if (!courseId || typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "courseId and rating (1-5) are required." }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify enrollment
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle();

    if (!enrollment && user.role !== "admin") {
      return NextResponse.json({ error: "You must be enrolled in the course to leave a review." }, { status: 403 });
    }

    const { data: review, error } = await supabase
      .from("course_reviews")
      .upsert(
        {
          course_id: courseId,
          student_id: user.id,
          rating,
          review_text: reviewText?.trim() || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "course_id,student_id" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ review }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
