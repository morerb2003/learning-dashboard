import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/roles";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { lessonId, courseId, completed = true } = body;

    if (!lessonId || !courseId) {
      return NextResponse.json(
        { error: "lessonId and courseId are required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    if (completed) {
      // 1. Upsert lesson_progress row
      const { error: upsertError } = await supabase
        .from("lesson_progress")
        .upsert(
          {
            user_id: user.id,
            lesson_id: lessonId,
            completed: true,
            completed_at: new Date().toISOString(),
          },
          { onConflict: "user_id,lesson_id" }
        );

      if (upsertError) {
        return NextResponse.json({ error: upsertError.message }, { status: 500 });
      }

      // 2. Count total lessons in the course
      const { data: allLessons, error: lessonsError } = await supabase
        .from("lessons")
        .select("id")
        .eq("course_id", courseId);

      if (lessonsError) {
        return NextResponse.json({ error: lessonsError.message }, { status: 500 });
      }

      const totalLessons = allLessons?.length ?? 0;

      if (totalLessons > 0) {
        const lessonIds = allLessons!.map((l) => l.id);

        // 3. Count completed lessons for this user in this course
        const { data: completedRows, error: progressError } = await supabase
          .from("lesson_progress")
          .select("id")
          .eq("user_id", user.id)
          .eq("completed", true)
          .in("lesson_id", lessonIds);

        if (progressError) {
          return NextResponse.json({ error: progressError.message }, { status: 500 });
        }

        const completedCount = completedRows?.length ?? 0;
        const progressPct = Math.round((completedCount / totalLessons) * 100);

        // 4. Update enrollment progress
        await supabase
          .from("enrollments")
          .update({
            progress: progressPct,
            last_accessed_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("course_id", courseId);

        return NextResponse.json({ success: true, progressPct });
      }
    }

    // Non-completion: just touch last_accessed_at
    await supabase
      .from("enrollments")
      .update({ last_accessed_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("course_id", courseId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
