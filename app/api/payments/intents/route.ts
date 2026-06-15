import { NextResponse } from "next/server";
import { createPaymentIntent } from "@/lib/payments/service";
import type { CreatePaymentIntentInput } from "@/lib/payments/types";

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as CreatePaymentIntentInput;
    const intent = await createPaymentIntent(input);
    return NextResponse.json(intent, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create payment intent.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
