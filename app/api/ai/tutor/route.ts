import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/roles";
import { askAiTutor } from "@/lib/ai/service";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in to use AI Tutor." }, { status: 401 });
    }

    const rl = await checkRateLimit("aiGeneration", user.id);
    if (!rl.success) {
      return rateLimitResponse(rl.reset, "AI Tutor query limit reached. Please wait a minute before asking more questions.");
    }

    const body = await request.json();
    const { courseTitle, lessonTitle, topic, question } = body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return NextResponse.json({ error: "A question is required." }, { status: 400 });
    }

    const { result, cached } = await askAiTutor(
      {
        courseTitle: courseTitle || "Course",
        lessonTitle: lessonTitle || "Lesson",
        topic,
      },
      question.trim(),
      user.id
    );

    return NextResponse.json(
      { result, cached },
      { headers: cached ? { "X-Cache-Lookup": "HIT" } : { "X-Cache-Lookup": "MISS" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "AI Tutor request failed.";
    const status = msg.includes("limit reached") ? 429 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
