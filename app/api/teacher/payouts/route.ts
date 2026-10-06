import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { MonetizationNotifications } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "teacher" && user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await checkRateLimit("generalApi", user.id);
    if (!rl.success) {
      return rateLimitResponse(
        rl.reset,
        "Too many payout requests. Please try again in a few minutes."
      );
    }

    const body = await request.json();
    const { amountCents, payoutMethod = "upi", payoutDetails } = body;

    const parsedAmountCents = Math.round(Number(amountCents || 0));

    if (!parsedAmountCents || parsedAmountCents <= 0) {
      return NextResponse.json(
        { error: "A valid positive payout amount is required." },
        { status: 400 }
      );
    }

    if (payoutMethod !== "upi" && payoutMethod !== "bank") {
      return NextResponse.json(
        { error: "Unsupported payout method. Use 'upi' or 'bank'." },
        { status: 400 }
      );
    }

    if (
      !payoutDetails ||
      typeof payoutDetails !== "string" ||
      !payoutDetails.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Payout destination details (UPI ID or Bank Account info) are required.",
        },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. Calculate net earnings for teacher from revenue_ledger
    const { data: ledgerEntries } = await admin
      .from("revenue_ledger")
      .select("direction, amount_cents")
      .eq("account_type", "teacher")
      .eq("account_id", user.id);

    let netLedgerBalanceCents = 0;
    for (const entry of ledgerEntries ?? []) {
      if (entry.direction === "credit") {
        netLedgerBalanceCents += Number(entry.amount_cents || 0);
      } else if (entry.direction === "debit") {
        netLedgerBalanceCents -= Number(entry.amount_cents || 0);
      }
    }

    // 2. Calculate in-flight (pending / approved) payouts to prevent duplicate withdrawals
    const { data: inflightPayouts } = await admin
      .from("teacher_payouts")
      .select("amount_cents")
      .eq("teacher_id", user.id)
      .in("status", ["pending", "approved"]);

    let inflightCents = 0;
    for (const p of inflightPayouts ?? []) {
      inflightCents += Number(p.amount_cents || 0);
    }

    const availableToWithdrawCents = Math.max(0, netLedgerBalanceCents - inflightCents);

    // 3. Prevent payout exceeding available balance or zero/negative balances
    if (parsedAmountCents > availableToWithdrawCents || availableToWithdrawCents <= 0) {
      const availableRupees = (availableToWithdrawCents / 100).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      const requestedRupees = (parsedAmountCents / 100).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      return NextResponse.json(
        {
          error: `Requested amount (₹${requestedRupees}) exceeds your available withdrawable balance of ₹${availableRupees}.`,
          availableBalanceCents: availableToWithdrawCents,
        },
        { status: 400 }
      );
    }

    // 4. Create payout request in teacher_payouts table
    const { data: payoutRecord, error: payoutError } = await admin
      .from("teacher_payouts")
      .insert({
        teacher_id: user.id,
        amount_cents: parsedAmountCents,
        currency: "INR",
        payout_method: payoutMethod,
        payout_details: payoutDetails.trim().slice(0, 255),
        status: "pending",
      })
      .select("id, amount_cents, status, created_at")
      .single();

    if (payoutError || !payoutRecord) {
      throw new Error(`Failed to create payout record: ${payoutError?.message}`);
    }

    // 5. Send idempotent notification to teacher
    await MonetizationNotifications.payoutRequested(
      user.id,
      parsedAmountCents / 100,
      payoutRecord.id
    );

    return NextResponse.json({
      success: true,
      payoutId: payoutRecord.id,
      amountCents: parsedAmountCents,
      status: "pending",
      remainingBalanceCents: availableToWithdrawCents - parsedAmountCents,
      workflowNotice:
        "Manual Admin Review Workflow: This payout request has been registered and is pending administrator verification. Bank/UPI transfers are executed manually.",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Payout request failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "teacher" && user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // 1. Fetch payout requests
    const { data: payouts, error: payoutsErr } = await supabase
      .from("teacher_payouts")
      .select("id, amount_cents, currency, payout_method, payout_details, status, admin_notes, created_at, processed_at")
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false });

    if (payoutsErr) {
      return NextResponse.json({ error: payoutsErr.message }, { status: 500 });
    }

    // 2. Calculate current balances
    const { data: ledgerEntries } = await supabase
      .from("revenue_ledger")
      .select("direction, amount_cents")
      .eq("account_type", "teacher")
      .eq("account_id", user.id);

    let netLedgerCents = 0;
    for (const e of ledgerEntries || []) {
      if (e.direction === "credit") netLedgerCents += Number(e.amount_cents || 0);
      else if (e.direction === "debit") netLedgerCents -= Number(e.amount_cents || 0);
    }

    const inflightCents = (payouts || [])
      .filter((p) => p.status === "pending" || p.status === "approved")
      .reduce((sum, p) => sum + Number(p.amount_cents || 0), 0);

    const availableCents = Math.max(0, netLedgerCents - inflightCents);

    return NextResponse.json({
      payouts: payouts || [],
      balance: {
        totalEarnedCents: netLedgerCents,
        pendingPayoutsCents: inflightCents,
        availableToWithdrawCents: availableCents,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch payouts.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
