import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/roles";
import { generateAiQuiz } from "@/lib/ai/service";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "teacher" && user.role !== "admin")) {
      return NextResponse.json(
        { error: "Unauthorized. Teacher or Admin privileges required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { topic, courseTitle, difficulty, count } = body;

    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return NextResponse.json({ error: "Quiz topic is required." }, { status: 400 });
    }

    const { result, cached } = await generateAiQuiz(
      {
        topic: topic.trim(),
        courseTitle,
        difficulty,
        count: typeof count === "number" ? Math.min(Math.max(count, 1), 10) : 4,
      },
      user.id
    );

    return NextResponse.json(
      { quiz: result, cached },
      { headers: cached ? { "X-Cache-Lookup": "HIT" } : { "X-Cache-Lookup": "MISS" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "AI Quiz generation failed.";
    const status = msg.includes("limit reached") ? 429 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
