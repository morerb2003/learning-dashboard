import { NextResponse } from "next/server";
import { verifyRazorpayWebhookSignature } from "@/lib/payments/razorpay";
import { confirmPaymentIntentFromWebhook } from "@/lib/payments/service";
import { getCached, setCached } from "@/lib/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing x-razorpay-signature header." },
        { status: 400 }
      );
    }

    // 1. Verify Webhook HMAC-SHA256 signature
    const isValid = verifyRazorpayWebhookSignature({
      rawBody,
      signature,
    });

    if (!isValid) {
      console.warn("[Razorpay Webhook] Invalid webhook signature detected.");
      return NextResponse.json(
        { error: "Invalid webhook signature." },
        { status: 400 }
      );
    }

    let event: Record<string, unknown>;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON webhook payload." },
        { status: 400 }
      );
    }

    const eventType = String(event.event || "");
    const eventId =
      (request.headers.get("x-razorpay-event-id") as string) ||
      `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // 2. Redis-backed idempotency deduplication (24 hour TTL)
    const dedupKey = `razorpay:webhook:${eventId}`;
    const alreadyProcessed = await getCached<boolean>(dedupKey);

    if (alreadyProcessed) {
      return NextResponse.json(
        { received: true, deduplicated: true },
        { status: 200 }
      );
    }

    // Mark event as in-flight / processed
    await setCached(dedupKey, true, 60 * 60 * 24);

    // 3. Process supported events
    const payload = (event.payload || {}) as Record<string, unknown>;

    switch (eventType) {
      case "payment.captured": {
        const paymentEntity = ((payload.payment as Record<string, unknown>)?.entity ||
          {}) as Record<string, unknown>;

        const orderId = String(paymentEntity.order_id || "");
        const paymentId = String(paymentEntity.id || "");
        const amountPaise = Number(paymentEntity.amount || 0);

        if (orderId && paymentId) {
          await confirmPaymentIntentFromWebhook({
            providerOrderId: orderId,
            providerPaymentId: paymentId,
            amountPaise,
          });
        }
        break;
      }

      case "order.paid": {
        const orderEntity = ((payload.order as Record<string, unknown>)?.entity ||
          {}) as Record<string, unknown>;
        const paymentEntity = ((payload.payment as Record<string, unknown>)?.entity ||
          {}) as Record<string, unknown>;

        const orderId = String(orderEntity.id || "");
        const paymentId = String(paymentEntity.id || orderId);
        const amountPaise = Number(orderEntity.amount_paid || orderEntity.amount || 0);

        if (orderId) {
          await confirmPaymentIntentFromWebhook({
            providerOrderId: orderId,
            providerPaymentId: paymentId,
            amountPaise,
          });
        }
        break;
      }

      case "payment.failed": {
        const paymentEntity = ((payload.payment as Record<string, unknown>)?.entity ||
          {}) as Record<string, unknown>;

        const orderId = String(paymentEntity.order_id || "");
        const errorCode = String(paymentEntity.error_code || "PAYMENT_FAILED");
        const errorDesc = String(
          paymentEntity.error_description || "Payment failed or was cancelled."
        );

        if (orderId) {
          const admin = createAdminClient();
          await admin
            .from("payment_intents")
            .update({
              status: "failed",
              failure_code: errorCode,
              failure_message: errorDesc,
            })
            .eq("provider_intent_id", orderId)
            .neq("status", "succeeded");
        }
        break;
      }

      default:
        // Other events received and acknowledged cleanly
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Webhook processing failure.";
    console.error("[Razorpay Webhook] Processing error:", error);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
