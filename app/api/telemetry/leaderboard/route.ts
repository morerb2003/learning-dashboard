import { NextResponse } from "next/server";
import { getLearnerLeaderboard } from "@/lib/telemetry";

export async function GET() {
  try {
    const leaderboard = await getLearnerLeaderboard(7);
    return NextResponse.json({ leaderboard });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error fetching leaderboard";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
