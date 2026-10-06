import { NextResponse } from "next/server";
import { confirmPaymentIntent } from "@/lib/payments/service";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/auth/roles";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    const rateLimitId = user?.id || getClientIp(request);

    const limitCheck = await checkRateLimit("paymentIntent", rateLimitId);
    if (!limitCheck.success) {
      return rateLimitResponse(limitCheck.reset);
    }

    const { id } = await context.params;
    const payment = await confirmPaymentIntent(id);
    return NextResponse.json(payment);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to confirm payment.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
