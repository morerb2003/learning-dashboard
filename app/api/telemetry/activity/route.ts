import { NextResponse } from "next/server";
import { getRecentActivityFeed } from "@/lib/telemetry";

export async function GET() {
  try {
    const feed = await getRecentActivityFeed(8);
    return NextResponse.json({ feed });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error fetching activity feed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
