import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/roles";
import { CACHE_KEYS, getCached, setCached, deleteCached, deleteCachedPattern } from "@/lib/cache";

interface CourseDetailResponse {
  course: unknown;
  lessons: unknown[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Check Redis cache
    const cacheKey = CACHE_KEYS.courseDetail(id);
    const cachedData = await getCached<CourseDetailResponse>(cacheKey);
    if (cachedData !== null) {
      return NextResponse.json(cachedData, {
        headers: { "X-Cache-Lookup": "HIT" },
      });
    }

    const supabase = await createClient();

    const [courseResult, lessonsResult] = await Promise.all([
      supabase.from("courses").select("*").eq("id", id).single(),
      supabase
        .from("lessons")
        .select("id, title, lesson_order, video_url, duration")
        .eq("course_id", id)
        .order("lesson_order", { ascending: true }),
    ]);

    if (courseResult.error || !courseResult.data) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const result: CourseDetailResponse = {
      course: courseResult.data,
      lessons: lessonsResult.data ?? [],
    };

    // Cache course details for 5 minutes (300s)
    await setCached(cacheKey, result, 300);

    return NextResponse.json(result, {
      headers: { "X-Cache-Lookup": "MISS" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user || (user.role !== "teacher" && user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    const supabase = await createClient();

    // Check ownership if teacher
    if (user.role === "teacher") {
      const { data: existing } = await supabase
        .from("courses")
        .select("teacher_id")
        .eq("id", id)
        .single();
      if (!existing || existing.teacher_id !== user.id) {
        return NextResponse.json({ error: "Forbidden: You do not own this course." }, { status: 403 });
      }
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    const allowedFields = [
      "title",
      "description",
      "category",
      "level",
      "duration",
      "price_cents",
      "is_pro",
      "is_published",
      "icon_name",
    ];

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    const { data: updatedCourse, error } = await supabase
      .from("courses")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Invalidate Redis caches
    await Promise.all([
      deleteCached(CACHE_KEYS.courseDetail(id)),
      deleteCachedPattern("aura:cache:courses:list:*"),
    ]);

    return NextResponse.json({ course: updatedCourse });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user || (user.role !== "teacher" && user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    const supabase = await createClient();

    if (user.role === "teacher") {
      const { data: existing } = await supabase
        .from("courses")
        .select("teacher_id")
        .eq("id", id)
        .single();
      if (!existing || existing.teacher_id !== user.id) {
        return NextResponse.json({ error: "Forbidden: You do not own this course." }, { status: 403 });
      }
    }

    const { error } = await supabase.from("courses").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Invalidate Redis caches
    await Promise.all([
      deleteCached(CACHE_KEYS.courseDetail(id)),
      deleteCachedPattern("aura:cache:courses:list:*"),
    ]);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
