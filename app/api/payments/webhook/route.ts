import { NextResponse } from "next/server";
import { verifyRazorpayWebhookSignature } from "@/lib/payments/razorpay";
import { confirmPaymentIntentFromWebhook } from "@/lib/payments/service";
import { getCached, setCached } from "@/lib/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { MonetizationNotifications } from "@/lib/notifications";

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
      (event.id as string) ||
      `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // 2. Multi-Tier Deduplication:
    // Layer A: Fast Redis Cache (24-hour TTL)
    const dedupKey = `razorpay:webhook:${eventId}`;
    const alreadyProcessedInRedis = await getCached<boolean>(dedupKey);

    if (alreadyProcessedInRedis) {
      return NextResponse.json(
        { received: true, deduplicated: true, source: "redis" },
        { status: 200 }
      );
    }

    const admin = createAdminClient();

    // Layer B: Database-Level Deduplication Table
    const { data: existingEvent } = await admin
      .from("webhook_events")
      .select("id")
      .eq("event_id", eventId)
      .maybeSingle();

    if (existingEvent) {
      await setCached(dedupKey, true, 60 * 60 * 24);
      return NextResponse.json(
        { received: true, deduplicated: true, source: "database" },
        { status: 200 }
      );
    }

    // Mark event in database audit log
    await admin.from("webhook_events").insert({
      event_id: eventId,
      event_type: eventType,
      provider: "razorpay",
      payload: event,
      status: "processing",
    });

    // Mark event in Redis
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

      case "refund.created":
      case "refund.processed": {
        const refundEntity = ((payload.refund as Record<string, unknown>)?.entity ||
          {}) as Record<string, unknown>;
        const providerPaymentId = String(refundEntity.payment_id || "");
        const refundId = String(refundEntity.id || "");
        const amountCents = Number(refundEntity.amount || 0);

        if (providerPaymentId) {
          const { data: payment } = await admin
            .from("payments")
            .select("id, user_id, course_id, subscription_id, status, total_cents, currency, payment_intent_id")
            .eq("provider_payment_id", providerPaymentId)
            .maybeSingle();

          if (payment && payment.status !== "refunded") {
            const nowIso = new Date().toISOString();

            // Mark payment as refunded
            await admin
              .from("payments")
              .update({
                status: "refunded",
                refund_id: refundId,
                refunded_at: nowIso,
                refund_amount_cents: amountCents || payment.total_cents,
              })
              .eq("id", payment.id);

            // Insert into payment_refunds audit table
            await admin.from("payment_refunds").insert({
              payment_id: payment.id,
              user_id: payment.user_id,
              amount_cents: amountCents || payment.total_cents,
              currency: payment.currency,
              reason: "Webhook refund event",
              provider_refund_id: refundId,
              status: "processed",
              created_at: nowIso,
              processed_at: nowIso,
            });

            // Adjust revenue ledger
            const { data: originalLedger } = await admin
              .from("revenue_ledger")
              .select("account_type, account_id, amount_cents, currency, commission_rate_bps")
              .eq("payment_id", payment.id)
              .eq("direction", "credit");

            for (const entry of originalLedger || []) {
              await admin.from("revenue_ledger").insert({
                payment_id: payment.id,
                payment_intent_id: payment.payment_intent_id,
                account_type: entry.account_type,
                account_id: entry.account_id,
                entry_type: "refund",
                direction: "debit",
                amount_cents: entry.amount_cents,
                currency: entry.currency,
                commission_rate_bps: entry.commission_rate_bps,
                metadata: { webhook_event_id: eventId, refund_id: refundId },
              });
            }

            // Revoke access
            if (payment.course_id) {
              await admin
                .from("enrollments")
                .delete()
                .eq("user_id", payment.user_id)
                .eq("course_id", payment.course_id);
            }

            if (payment.subscription_id) {
              await admin
                .from("subscriptions")
                .update({ status: "refunded", updated_at: nowIso })
                .eq("id", payment.subscription_id);

              await admin
                .from("profiles")
                .update({ subscription_tier: "free" })
                .eq("id", payment.user_id);
            }

            // Notify user
            await MonetizationNotifications.refundProcessed(
              payment.user_id,
              (amountCents || payment.total_cents) / 100,
              payment.id
            );
          }
        }
        break;
      }

      case "subscription.cancelled":
      case "subscription.halted": {
        const subEntity = ((payload.subscription as Record<string, unknown>)?.entity ||
          {}) as Record<string, unknown>;
        const providerSubId = String(subEntity.id || "");

        if (providerSubId) {
          const { data: sub } = await admin
            .from("subscriptions")
            .select("id, user_id")
            .eq("provider_subscription_id", providerSubId)
            .maybeSingle();

          if (sub) {
            await admin
              .from("subscriptions")
              .update({
                status: "canceled",
                cancel_at_period_end: true,
                updated_at: new Date().toISOString(),
              })
              .eq("id", sub.id);
          }
        }
        break;
      }

      default:
        // Other events safely acknowledged
        break;
    }

    // Update webhook event to processed
    await admin
      .from("webhook_events")
      .update({ status: "processed", processed_at: new Date().toISOString() })
      .eq("event_id", eventId);

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Webhook processing failure.";
    console.error("[Razorpay Webhook] Processing error:", error);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
