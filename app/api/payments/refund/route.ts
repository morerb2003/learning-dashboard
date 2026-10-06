import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/roles";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { processPaymentRefund, validateRefundEligibility } from "@/lib/payments/refunds";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to request a refund." },
        { status: 401 }
      );
    }

    const rateLimitId = user.id || getClientIp(request);
    const limitCheck = await checkRateLimit("generalApi", rateLimitId);
    if (!limitCheck.success) {
      return rateLimitResponse(limitCheck.reset, "Too many refund requests.");
    }

    const body = await request.json();
    const { paymentId, reason } = body;

    if (!paymentId || typeof paymentId !== "string" || !paymentId.trim()) {
      return NextResponse.json(
        { error: "A valid paymentId is required." },
        { status: 400 }
      );
    }

    const isAdmin = user.role === "admin";
    const result = await processPaymentRefund({
      paymentId: paymentId.trim(),
      userId: user.id,
      reason: typeof reason === "string" ? reason.trim().slice(0, 500) : undefined,
      isAdmin,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Refund request failed.";
    const status = message.includes("Unauthorized")
      ? 403
      : message.includes("not found")
      ? 404
      : 400;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("paymentId");

    // If specific paymentId requested, check eligibility
    if (paymentId) {
      try {
        const isAdmin = user.role === "admin";
        const { payment, policy } = await validateRefundEligibility(
          paymentId,
          user.id,
          isAdmin
        );
        return NextResponse.json({
          eligible: true,
          payment: {
            id: payment.id,
            amountCents: payment.total_cents,
            currency: payment.currency,
            createdAt: payment.created_at,
          },
          policy,
        });
      } catch (checkErr) {
        return NextResponse.json({
          eligible: false,
          reason: checkErr instanceof Error ? checkErr.message : "Ineligible for refund",
        });
      }
    }

    // List all refunds for user (or all if admin)
    const supabase = await createClient();
    let query = supabase
      .from("payment_refunds")
      .select("id, payment_id, amount_cents, currency, status, reason, created_at")
      .order("created_at", { ascending: false });

    if (user.role !== "admin") {
      query = query.eq("user_id", user.id);
    }

    const { data: refunds, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ refunds: refunds || [] });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch refunds.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
