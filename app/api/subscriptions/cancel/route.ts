import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/roles";
import { cancelUserSubscription } from "@/lib/payments/subscriptions";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitId = user.id || getClientIp(request);
    const limitCheck = await checkRateLimit("generalApi", rateLimitId);
    if (!limitCheck.success) {
      return rateLimitResponse(limitCheck.reset);
    }

    const result = await cancelUserSubscription(user.id);
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Cancellation failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
