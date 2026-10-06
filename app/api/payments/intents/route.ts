import { NextResponse } from "next/server";
import { createPaymentIntent } from "@/lib/payments/service";
import type { CreatePaymentIntentInput } from "@/lib/payments/types";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { withIdempotency } from "@/lib/idempotency";
import { getCurrentUser } from "@/lib/auth/roles";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const rateLimitId = user?.id || getClientIp(request);

    // 1. Redis rate limit: 10 requests / minute / user
    const limitCheck = await checkRateLimit("paymentIntent", rateLimitId);
    if (!limitCheck.success) {
      return rateLimitResponse(limitCheck.reset);
    }

    const input = (await request.json()) as CreatePaymentIntentInput;

    if (!input.idempotencyKey || !input.idempotencyKey.trim()) {
      return NextResponse.json(
        { error: "An idempotency key is required." },
        { status: 400 }
      );
    }

    // 2. Redis idempotency protection
    const idempotencyScope = user?.id ? `user:${user.id}` : "anon";
    const { result, isCached } = await withIdempotency(
      `payment:${idempotencyScope}`,
      input.idempotencyKey,
      () => createPaymentIntent(input)
    );

    return NextResponse.json(result, {
      status: isCached ? 200 : 201,
      headers: isCached ? { "X-Idempotency-Replayed": "true" } : undefined,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create payment intent.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
