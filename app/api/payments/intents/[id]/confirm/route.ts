import { NextResponse } from "next/server";
import { confirmPaymentIntent } from "@/lib/payments/service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payment = await confirmPaymentIntent(id);
    return NextResponse.json(payment);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to confirm payment.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
