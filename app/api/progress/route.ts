import { NextRequest, NextResponse } from "next/server";
import { markLessonComplete } from "@/lib/course/progress";
import { getCurrentUser } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { lessonId, courseId, completed = true } = body;

    if (!lessonId || !courseId) {
      return NextResponse.json({ error: "lessonId and courseId are required." }, { status: 400 });
    }

    if (completed) {
      const result = await markLessonComplete(lessonId, courseId);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
      return NextResponse.json({ success: true, progressPct: result.progressPct });
    }

    // Touch last accessed
    const supabase = await createClient();
    await supabase
      .from("enrollments")
      .update({ last_accessed_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("course_id", courseId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
