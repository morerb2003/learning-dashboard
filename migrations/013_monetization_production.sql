-- ==============================================================================
-- Migration: 013_monetization_production.sql
-- Description: Production-safe monetization schema, 80/20 teacher split,
--              payout requests, refunds, webhook deduplication, and constraints.
-- ==============================================================================

-- 1. Webhook Deduplication Table
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'razorpay',
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'processed' CHECK (status IN ('processing', 'processed', 'failed', 'ignored')),
    error_message TEXT,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_type ON public.webhook_events(provider, event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at ON public.webhook_events(processed_at DESC);

-- 2. Teacher Payouts Table
CREATE TABLE IF NOT EXISTS public.teacher_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    currency TEXT NOT NULL DEFAULT 'INR' CHECK (char_length(currency) = 3),
    payout_method TEXT NOT NULL CHECK (payout_method IN ('upi', 'bank')),
    payout_details TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
    admin_notes TEXT,
    processed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teacher_payouts_teacher_status ON public.teacher_payouts(teacher_id, status);
CREATE INDEX IF NOT EXISTS idx_teacher_payouts_created_at ON public.teacher_payouts(created_at DESC);

-- 3. Payment Refunds Table
CREATE TABLE IF NOT EXISTS public.payment_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    reason TEXT,
    provider_refund_id TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'processed' CHECK (status IN ('pending', 'approved', 'processed', 'rejected', 'failed')),
    policy_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    processed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_refunds_payment_id ON public.payment_refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_user_id ON public.payment_refunds(user_id);

-- 4. Update payments table with refund tracking columns if not already present
ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS refund_id TEXT,
    ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS refund_amount_cents INTEGER DEFAULT 0;

-- 5. Safe Unique Constraints for Idempotency
CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_payment_id_unique_idx
ON public.payments(provider, provider_payment_id)
WHERE provider_payment_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS enrollments_user_course_unique_idx
ON public.enrollments(user_id, course_id);

-- 6. Ensure Subscription Plans have exact authoritative pricing
INSERT INTO public.subscription_plans
    (code, name, monthly_price_cents, yearly_price_cents, currency, features)
VALUES
    ('free', 'Free Explorer', 0, 0, 'INR', '["free_courses","community"]'::jsonb),
    ('pro', 'AURA Pro', 49900, 499000, 'INR', '["premium_courses","certificates","ai_tutor","leaderboard"]'::jsonb),
    ('premium', 'Pro Creator', 99900, 999000, 'INR', '["premium_courses","certificates","ai_tutor","source_code","downloads","priority_qa"]'::jsonb)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    monthly_price_cents = EXCLUDED.monthly_price_cents,
    yearly_price_cents = EXCLUDED.yearly_price_cents,
    features = EXCLUDED.features,
    updated_at = now();

-- 7. Update confirm_payment_intent with authoritative 80/20 split (2000 bps platform fee)
CREATE OR REPLACE FUNCTION public.confirm_payment_intent(
    p_intent_id UUID,
    p_provider_payment_id TEXT,
    p_user_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_intent public.payment_intents%ROWTYPE;
    v_payment_id UUID;
    v_subscription_id UUID;
    v_teacher_id UUID;
    -- Authoritative 80/20 split: Platform takes 20% (2000 bps), Teacher gets 80% (8000 bps)
    v_platform_rate_bps INTEGER := 2000;
    v_platform_cents INTEGER;
    v_teacher_cents INTEGER;
    v_period_end TIMESTAMPTZ;
BEGIN
    SELECT * INTO v_intent
    FROM public.payment_intents
    WHERE id = p_intent_id AND user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment intent not found' USING ERRCODE = 'P0001';
    END IF;

    -- Idempotent check
    IF v_intent.status = 'succeeded' THEN
        SELECT id, subscription_id INTO v_payment_id, v_subscription_id
        FROM public.payments
        WHERE payment_intent_id = v_intent.id;
        RETURN jsonb_build_object(
            'payment_id', v_payment_id,
            'subscription_id', v_subscription_id,
            'status', 'succeeded'
        );
    END IF;

    IF v_intent.status NOT IN ('requires_confirmation', 'processing')
       OR v_intent.expires_at <= now()
       OR v_intent.provider_intent_id IS NULL THEN
        RAISE EXCEPTION 'Payment intent cannot be confirmed' USING ERRCODE = 'P0001';
    END IF;

    -- Validate coupon if attached
    IF v_intent.coupon_id IS NOT NULL THEN
        PERFORM 1 FROM public.coupons WHERE id = v_intent.coupon_id FOR UPDATE;
        PERFORM * FROM public.aura_coupon_quote(
            v_intent.user_id,
            v_intent.pricing_snapshot->>'coupon_code',
            v_intent.purchase_type,
            v_intent.course_id,
            v_intent.pricing_snapshot->>'plan_code',
            v_intent.subtotal_cents
        );
    END IF;

    IF v_intent.purchase_type = 'subscription' THEN
        v_period_end := CASE v_intent.billing_cycle
            WHEN 'monthly' THEN now() + interval '1 month'
            ELSE now() + interval '1 year'
        END;

        UPDATE public.subscriptions
        SET status = 'expired', updated_at = now()
        WHERE user_id = v_intent.user_id AND status IN ('active', 'past_due');

        INSERT INTO public.subscriptions (
            user_id, plan_id, billing_cycle, status, provider,
            provider_subscription_id, current_period_start, current_period_end
        ) VALUES (
            v_intent.user_id, v_intent.plan_id, v_intent.billing_cycle, 'active',
            v_intent.provider, p_provider_payment_id, now(), v_period_end
        )
        RETURNING id INTO v_subscription_id;

        UPDATE public.profiles
        SET
            subscription_tier = v_intent.pricing_snapshot->>'plan_code',
            subscription_expires_at = v_period_end
        WHERE id = v_intent.user_id;
    ELSE
        INSERT INTO public.enrollments (user_id, course_id, progress, last_accessed_at)
        VALUES (v_intent.user_id, v_intent.course_id, 0, now())
        ON CONFLICT (user_id, course_id) DO NOTHING;

        SELECT teacher_id INTO v_teacher_id
        FROM public.courses
        WHERE id = v_intent.course_id;
    END IF;

    INSERT INTO public.payments (
        user_id, course_id, amount, discount_applied, payment_type, coupon_id,
        status, transaction_id, payment_intent_id, provider, provider_payment_id,
        currency, subtotal_cents, discount_cents, total_cents, subscription_id, paid_at
    ) VALUES (
        v_intent.user_id,
        v_intent.course_id,
        v_intent.total_cents / 100.0,
        v_intent.discount_cents / 100.0,
        CASE WHEN v_intent.purchase_type = 'course' THEN 'course_purchase' ELSE 'subscription_pro' END,
        v_intent.coupon_id,
        'completed',
        upper(v_intent.provider) || '-' || p_provider_payment_id,
        v_intent.id,
        v_intent.provider,
        p_provider_payment_id,
        v_intent.currency,
        v_intent.subtotal_cents,
        v_intent.discount_cents,
        v_intent.total_cents,
        v_subscription_id,
        now()
    )
    RETURNING id INTO v_payment_id;

    IF v_intent.coupon_id IS NOT NULL THEN
        INSERT INTO public.coupon_redemptions (
            coupon_id, user_id, payment_intent_id, payment_id, discount_cents
        ) VALUES (
            v_intent.coupon_id, v_intent.user_id, v_intent.id, v_payment_id, v_intent.discount_cents
        );
    END IF;

    -- Integer paise calculations for 80/20 split
    IF v_intent.purchase_type = 'course' AND v_teacher_id IS NOT NULL THEN
        v_platform_cents := floor(v_intent.total_cents * v_platform_rate_bps / 10000.0);
        v_teacher_cents := v_intent.total_cents - v_platform_cents;
    ELSE
        v_platform_cents := v_intent.total_cents;
        v_teacher_cents := 0;
    END IF;

    INSERT INTO public.revenue_ledger (
        payment_id, payment_intent_id, account_type, account_id, entry_type,
        direction, amount_cents, currency, commission_rate_bps, metadata
    ) VALUES (
        v_payment_id, v_intent.id, 'platform', NULL, 'sale',
        'credit', v_platform_cents, v_intent.currency,
        CASE WHEN v_teacher_id IS NULL THEN 10000 ELSE v_platform_rate_bps END,
        jsonb_build_object('purchase_type', v_intent.purchase_type)
    );

    IF v_teacher_cents > 0 THEN
        INSERT INTO public.revenue_ledger (
            payment_id, payment_intent_id, account_type, account_id, entry_type,
            direction, amount_cents, currency, commission_rate_bps, metadata
        ) VALUES (
            v_payment_id, v_intent.id, 'teacher', v_teacher_id, 'sale',
            'credit', v_teacher_cents, v_intent.currency,
            10000 - v_platform_rate_bps,
            jsonb_build_object('course_id', v_intent.course_id)
        );
    END IF;

    UPDATE public.payment_intents
    SET status = 'succeeded', updated_at = now()
    WHERE id = v_intent.id;

    RETURN jsonb_build_object(
        'payment_id', v_payment_id,
        'subscription_id', v_subscription_id,
        'status', 'succeeded'
    );
END;
$$;

-- 8. Enable Row Level Security on new tables
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_refunds ENABLE ROW LEVEL SECURITY;

-- Payouts Policies
DROP POLICY IF EXISTS "Teachers can view own payouts" ON public.teacher_payouts;
CREATE POLICY "Teachers can view own payouts"
ON public.teacher_payouts FOR SELECT TO authenticated
USING (teacher_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Admins can update payouts" ON public.teacher_payouts;
CREATE POLICY "Admins can update payouts"
ON public.teacher_payouts FOR ALL TO authenticated
USING (public.is_admin());

-- Refunds Policies
DROP POLICY IF EXISTS "Users can view own refunds" ON public.payment_refunds;
CREATE POLICY "Users can view own refunds"
ON public.payment_refunds FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- Webhook events are restricted to service role
REVOKE ALL ON public.webhook_events FROM authenticated, anon;
