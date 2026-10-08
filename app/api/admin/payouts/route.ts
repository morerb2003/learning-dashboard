import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNotification } from "@/lib/notifications";
import { safeJson } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data: payouts, error } = await admin
      .from("teacher_payouts")
      .select("id, teacher_id, amount_cents, currency, payout_method, payout_details, status, admin_notes, created_at, processed_at, profiles(full_name, email)")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = (payouts || []).map((p: any) => ({
      ...p,
      teacher: p.profiles || null,
    }));

    return NextResponse.json({ payouts: formatted });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch teacher payouts.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const body = await safeJson<{ payoutId?: string; status?: string; adminNotes?: string }>(request);
    const { payoutId, status, adminNotes } = body;

    if (!payoutId || !status || !["approved", "paid", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid parameters. Required: payoutId and status ('approved' | 'paid' | 'rejected')." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: payout, error: fetchErr } = await admin
      .from("teacher_payouts")
      .select("id, teacher_id, amount_cents, currency, status")
      .eq("id", payoutId)
      .single();

    if (fetchErr || !payout) {
      return NextResponse.json({ error: "Payout record not found." }, { status: 404 });
    }

    if (payout.status === "paid") {
      return NextResponse.json(
        { error: "This payout has already been completed and marked paid." },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();

    // 1. If transitioning to 'paid', insert debit entry into revenue_ledger
    if (status === "paid") {
      const { data: latestPayment } = await admin
        .from("payments")
        .select("id, payment_intent_id")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestPayment?.id && latestPayment?.payment_intent_id) {
        await admin.from("revenue_ledger").insert({
          payment_id: latestPayment.id,
          payment_intent_id: latestPayment.payment_intent_id,
          account_type: "teacher",
          account_id: payout.teacher_id,
          entry_type: "adjustment",
          direction: "debit",
          amount_cents: payout.amount_cents,
          currency: payout.currency,
          metadata: {
            payout_id: payout.id,
            settled_by: user.id,
            settled_at: nowIso,
            notes: adminNotes || "Admin payout disbursement",
          },
        });
      }
    }

    // 2. Update payout record
    const { error: updateErr } = await admin
      .from("teacher_payouts")
      .update({
        status,
        admin_notes: adminNotes || null,
        processed_by: user.id,
        processed_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", payout.id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // 3. Notify teacher
    const rupees = (payout.amount_cents / 100).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
    });

    if (status === "paid") {
      await sendNotification({
        userId: payout.teacher_id,
        type: "payout",
        title: "Payout Disbursed ✅",
        message: `Your payout of ₹${rupees} has been successfully processed and disbursed.`,
        href: "/teacher/earnings",
        idempotencyKey: `notif:payout_paid:${payout.id}`,
      });
    } else if (status === "rejected") {
      await sendNotification({
        userId: payout.teacher_id,
        type: "payout",
        title: "Payout Rejected ❌",
        message: `Your payout request of ₹${rupees} was rejected. Note: ${adminNotes || "Please contact support."}`,
        href: "/teacher/earnings",
        idempotencyKey: `notif:payout_rej:${payout.id}`,
      });
    }

    return NextResponse.json({ success: true, payoutId: payout.id, status });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update payout.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
