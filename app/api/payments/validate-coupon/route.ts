import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, amountCents = 0, courseId, planCode } = body;

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json({ error: "Coupon code is required." }, { status: 400 });
    }

    const trimmedCode = code.trim().toUpperCase();
    const supabase = await createClient();

    const { data: coupon, error } = await supabase
      .from("coupons")
      .select("*")
      .ilike("code", trimmedCode)
      .maybeSingle();

    if (error || !coupon) {
      return NextResponse.json({ valid: false, error: "Invalid coupon code." }, { status: 404 });
    }

    if (coupon.is_active === false) {
      return NextResponse.json({ valid: false, error: "This coupon is no longer active." }, { status: 400 });
    }

    const now = new Date();
    if (coupon.expires_at && new Date(coupon.expires_at) < now) {
      return NextResponse.json({ valid: false, error: "This coupon has expired." }, { status: 400 });
    }

    if (coupon.starts_at && new Date(coupon.starts_at) > now) {
      return NextResponse.json({ valid: false, error: "This coupon is not active yet." }, { status: 400 });
    }

    if (coupon.usage_limit && (coupon.times_used ?? 0) >= coupon.usage_limit) {
      return NextResponse.json({ valid: false, error: "This coupon has reached its maximum usage limit." }, { status: 400 });
    }

    if (coupon.minimum_amount_cents && amountCents < coupon.minimum_amount_cents) {
      return NextResponse.json(
        {
          valid: false,
          error: `Minimum order amount of $${(coupon.minimum_amount_cents / 100).toFixed(2)} required for this coupon.`,
        },
        { status: 400 }
      );
    }

    // Calculate discount
    const discountType = coupon.discount_type || "percentage";
    const discountValue = coupon.discount_value ?? coupon.discount_percent ?? 0;
    let discountCents = 0;

    if (discountType === "percentage") {
      discountCents = Math.round((amountCents * discountValue) / 100);
    } else {
      discountCents = discountValue * 100;
    }

    // Discount cannot exceed the subtotal
    discountCents = Math.min(discountCents, amountCents);
    const finalAmountCents = Math.max(0, amountCents - discountCents);

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType,
        discountValue,
        discountCents,
        finalAmountCents,
        formattedDiscount:
          discountType === "percentage" ? `${discountValue}% OFF` : `$${(discountValue).toFixed(2)} OFF`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
