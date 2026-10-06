import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { recordLearnerXP, recordActivityPulse } from "@/lib/telemetry";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { quizId, quizTitle = "Quiz", score = 0, totalScore = 0 } = body;

    if (!quizId) {
      return NextResponse.json({ error: "quizId is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    const userName = profile?.full_name || user.email?.split("@")[0] || "Learner";
    const earnedXp = Math.max(Math.round(score * 15), 30);

    // 1. Award XP on live leaderboard
    const newTotalXp = await recordLearnerXP(
      user.id,
      userName,
      earnedXp,
      profile?.avatar_url
    );

    // 2. Push to live community activity feed
    await recordActivityPulse({
      type: "quiz_pass",
      actor: userName,
      title: `Scored ${score}/${totalScore} on "${quizTitle}" (+${earnedXp} XP)`,
    });

    // 3. Insert notification for user
    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "Quiz Completed! 🎯",
      message: `You scored ${score}/${totalScore} on "${quizTitle}" and gained +${earnedXp} XP!`,
      href: "/learning/quizzes",
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      earnedXp,
      newTotalXp,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error submitting quiz";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
