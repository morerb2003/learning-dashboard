import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "teacher" && user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await checkRateLimit("generalApi", user.id);
    if (!rl.success) {
      return rateLimitResponse(rl.reset, "Too many payout requests. Please try again in a few minutes.");
    }

    const body = await request.json();
    const { amountCents, payoutMethod = "upi", payoutDetails } = body;

    if (!amountCents || amountCents <= 0) {
      return NextResponse.json(
        { error: "A valid positive payout amount is required." },
        { status: 400 }
      );
    }

    if (!payoutDetails || typeof payoutDetails !== "string" || !payoutDetails.trim()) {
      return NextResponse.json(
        { error: "Payout destination details (UPI ID or Account info) are required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Calculate available net earnings for teacher from revenue_ledger
    const { data: ledgerEntries } = await supabase
      .from("revenue_ledger")
      .select("direction, amount_cents")
      .eq("account_type", "teacher")
      .eq("account_id", user.id);

    let netBalanceCents = 0;
    for (const entry of ledgerEntries ?? []) {
      if (entry.direction === "credit") netBalanceCents += entry.amount_cents;
      else if (entry.direction === "debit") netBalanceCents -= entry.amount_cents;
    }

    if (amountCents > netBalanceCents && netBalanceCents > 0) {
      return NextResponse.json(
        {
          error: `Requested amount (₹${(amountCents / 100).toFixed(2)}) exceeds available net balance (₹${(netBalanceCents / 100).toFixed(2)}).`,
        },
        { status: 400 }
      );
    }

    // 2. Fetch or create a fake payment id reference for ledger tracking if needed
    // or insert the withdrawal into the revenue ledger
    const { data: latestPayment } = await supabase
      .from("payments")
      .select("id, payment_intent_id")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestPayment?.id && latestPayment?.payment_intent_id) {
      await supabase.from("revenue_ledger").insert({
        payment_id: latestPayment.id,
        payment_intent_id: latestPayment.payment_intent_id,
        account_type: "teacher",
        account_id: user.id,
        entry_type: "adjustment",
        direction: "debit",
        amount_cents: amountCents,
        currency: "INR",
        metadata: {
          type: "payout_request",
          method: payoutMethod,
          details: payoutDetails.trim(),
          requested_at: new Date().toISOString(),
          status: "processing",
        },
      });
    }

    // 3. Notify the teacher
    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "Payout Request Received 💰",
      message: `Your payout request of ₹${(amountCents / 100).toLocaleString("en-IN")} via ${payoutMethod.toUpperCase()} (${payoutDetails}) has been placed into processing queue.`,
      href: "/teacher/earnings",
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      amountCents,
      remainingBalanceCents: Math.max(0, netBalanceCents - amountCents),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Payout request failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
