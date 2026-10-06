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

    let razorpayDetails: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    } | undefined = undefined;

    try {
      const parsed = await request.json();
      if (parsed && typeof parsed === "object" && parsed.razorpay_payment_id) {
        razorpayDetails = parsed;
      }
    } catch {
      // Body may be empty for mock gateway
    }

    const payment = await confirmPaymentIntent(id, razorpayDetails);
    return NextResponse.json(payment);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to confirm payment.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
