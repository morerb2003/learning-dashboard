import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/roles";
import { safeJson } from "@/lib/api-response";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
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

    const rl = await checkRateLimit("generalApi", user.id);
    if (!rl.success) {
      return rateLimitResponse(rl.reset, "Too many enrollment requests. Please wait a minute.");
    }

    const body = await safeJson<{ courseId?: string }>(request);
    const { courseId } = body;

    if (!courseId || typeof courseId !== "string" || !courseId.trim()) {
      return NextResponse.json(
        { error: "Valid courseId is required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Verify course existence and pricing
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, title, price_cents, is_pro, is_published")
      .eq("id", courseId.trim())
      .maybeSingle();

    if (courseError || !course) {
      return NextResponse.json(
        { error: "Course not found." },
        { status: 404 }
      );
    }

    // 2. Access control: If course is paid or pro, verify student entitlement
    const isPaidCourse = (course.price_cents ?? 0) > 0 || Boolean(course.is_pro);

    if (isPaidCourse && user.role !== "admin") {
      // Check active subscription
      const { data: activeSub } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      // Check paid course transaction
      const { data: payment } = await supabase
        .from("payments")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", courseId.trim())
        .eq("status", "completed")
        .maybeSingle();

      if (!activeSub && !payment) {
        return NextResponse.json(
          {
            error:
              "This is a premium course. Enrollment requires course checkout or an active Pro subscription.",
            requiresPurchase: true,
            courseId: course.id,
            priceCents: course.price_cents,
          },
          { status: 403 }
        );
      }
    }

    // 3. Atomically upsert enrollment
    const { data, error } = await supabase
      .from("enrollments")
      .upsert(
        {
          user_id: user.id,
          course_id: courseId.trim(),
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message.includes("Invalid JSON") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
