import { NextRequest, NextResponse } from "next/server";
import { getCourseViews, recordCourseView } from "@/lib/telemetry";
import { getClientIp } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/auth/roles";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const stats = await getCourseViews(id);
    return NextResponse.json({ stats });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error loading views";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const viewerId = user?.id || getClientIp(request);

    const stats = await recordCourseView(id, viewerId);
    return NextResponse.json({ stats });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error recording view";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
