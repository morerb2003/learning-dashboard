import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/roles";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Order by last_accessed_at NULLS LAST so new enrollments appear without error
    const { data: enrollments, error } = await supabase
      .from("enrollments")
      .select(
        "id, user_id, course_id, enrolled_at, progress, last_accessed_at, courses(id, title, category, level, icon_name, duration, teacher_name)"
      )
      .eq("user_id", user.id)
      .order("last_accessed_at", { ascending: false, nullsFirst: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Normalise: ensure progress is never null
    const normalised = (enrollments ?? []).map((e) => ({
      ...e,
      progress: e.progress ?? 0,
    }));

    return NextResponse.json({ enrollments: normalised });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json(
        { error: "courseId is required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify the course exists and is accessible
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, title, price_cents")
      .eq("id", courseId)
      .maybeSingle();

    if (courseError || !course) {
      return NextResponse.json(
        { error: "Course not found." },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from("enrollments")
      .upsert(
        {
          user_id: user.id,
          course_id: courseId,
          progress: 0,
          enrolled_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,course_id" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ enrollment: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
