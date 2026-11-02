-- ==============================================================================
-- Migration: 012_payments_ledger.sql
-- Description: Core monetization ledger, payments transactions, subscription
--              plans catalog, coupon redemptions, and pricing stored procedures.
-- ==============================================================================

-- 1. Helper Function: Check Admin Privilege
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 2. Subscription Plans Catalog
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE CHECK (code IN ('free', 'pro', 'premium')),
    name TEXT NOT NULL,
    monthly_price_cents INTEGER NOT NULL DEFAULT 0,
    yearly_price_cents INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'INR' CHECK (char_length(currency) = 3),
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_code ON public.subscription_plans(code);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON public.subscription_plans(is_active);

-- Initial catalog seed for plans
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

-- 3. Enhance Subscriptions Table from Migration 009
ALTER TABLE public.subscriptions
    ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'razorpay',
    ADD COLUMN IF NOT EXISTS provider_subscription_id TEXT;

CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON public.subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_sub_id ON public.subscriptions(provider_subscription_id);

-- 4. Enhance Payment Intents Table from Migration 009
ALTER TABLE public.payment_intents
    ADD COLUMN IF NOT EXISTS purchase_type TEXT NOT NULL DEFAULT 'course' CHECK (purchase_type IN ('course', 'subscription')),
    ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
    ADD COLUMN IF NOT EXISTS coupon_id TEXT REFERENCES public.coupons(code) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
    ADD COLUMN IF NOT EXISTS subtotal_cents INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS discount_cents INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_cents INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS provider TEXT,
    ADD COLUMN IF NOT EXISTS provider_intent_id TEXT,
    ADD COLUMN IF NOT EXISTS provider_client_secret TEXT,
    ADD COLUMN IF NOT EXISTS pricing_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (now() + interval '1 hour'),
    ADD COLUMN IF NOT EXISTS failure_code TEXT,
    ADD COLUMN IF NOT EXISTS failure_message TEXT;

CREATE INDEX IF NOT EXISTS idx_payment_intents_course_id ON public.payment_intents(course_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_provider_intent_id ON public.payment_intents(provider_intent_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_intents_user_idempotency
ON public.payment_intents (user_id, idempotency_key)
WHERE idempotency_key IS NOT NULL;

-- 5. Payments Transaction Table (Settled charges)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    payment_intent_id UUID REFERENCES public.payment_intents(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount_applied NUMERIC(10, 2) DEFAULT 0.00,
    payment_type TEXT NOT NULL DEFAULT 'course_purchase',
    coupon_id TEXT REFERENCES public.coupons(code) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    transaction_id TEXT,
    provider TEXT NOT NULL DEFAULT 'razorpay',
    provider_payment_id TEXT,
    currency TEXT NOT NULL DEFAULT 'INR' CHECK (char_length(currency) = 3),
    subtotal_cents INTEGER NOT NULL DEFAULT 0,
    discount_cents INTEGER NOT NULL DEFAULT 0,
    total_cents INTEGER NOT NULL DEFAULT 0,
    paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_course_id ON public.payments(course_id);
CREATE INDEX IF NOT EXISTS idx_payments_intent_id ON public.payments(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_provider_payment_id ON public.payments(provider_payment_id);

-- 6. Coupon Redemptions Table
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id TEXT NOT NULL REFERENCES public.coupons(code) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    payment_intent_id UUID REFERENCES public.payment_intents(id) ON DELETE SET NULL,
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    discount_cents INTEGER NOT NULL DEFAULT 0,
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon_user ON public.coupon_redemptions(coupon_id, user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_payment_id ON public.coupon_redemptions(payment_id);

-- 7. Revenue Ledger Table (Financial Accounting Trail)
CREATE TABLE IF NOT EXISTS public.revenue_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    payment_intent_id UUID REFERENCES public.payment_intents(id) ON DELETE SET NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('platform', 'teacher')),
    account_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    entry_type TEXT NOT NULL CHECK (entry_type IN ('sale', 'refund', 'payout', 'adjustment')),
    direction TEXT NOT NULL CHECK (direction IN ('credit', 'debit')),
    amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
    currency TEXT NOT NULL DEFAULT 'INR' CHECK (char_length(currency) = 3),
    commission_rate_bps INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_revenue_ledger_payment_id ON public.revenue_ledger(payment_id);
CREATE INDEX IF NOT EXISTS idx_revenue_ledger_account ON public.revenue_ledger(account_type, account_id);
CREATE INDEX IF NOT EXISTS idx_revenue_ledger_created_at ON public.revenue_ledger(created_at DESC);

-- 8. Stored Procedure: aura_coupon_quote
CREATE OR REPLACE FUNCTION public.aura_coupon_quote(
    p_user_id UUID,
    p_coupon_code TEXT,
    p_purchase_type TEXT,
    p_course_id UUID,
    p_plan_code TEXT,
    p_subtotal_cents INTEGER
) RETURNS TABLE (
    coupon_code TEXT,
    discount_cents INTEGER,
    total_cents INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_coupon public.coupons%ROWTYPE;
    v_discount INTEGER := 0;
BEGIN
    IF p_coupon_code IS NULL OR trim(p_coupon_code) = '' THEN
        RETURN QUERY SELECT NULL::TEXT, 0, p_subtotal_cents;
        RETURN;
    END IF;

    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE code = upper(trim(p_coupon_code))
      AND is_active = true
      AND (valid_until IS NULL OR valid_until > now());

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Coupon "%" is invalid or expired.', p_coupon_code USING ERRCODE = 'P0001';
    END IF;

    IF v_coupon.times_redeemed >= v_coupon.max_redemptions THEN
        RAISE EXCEPTION 'Coupon "%" has reached maximum redemptions.', p_coupon_code USING ERRCODE = 'P0002';
    END IF;

    -- Verify user hasn't already used this coupon
    IF EXISTS (
        SELECT 1 FROM public.coupon_redemptions
        WHERE coupon_id = v_coupon.code AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'You have already redeemed coupon "%".', p_coupon_code USING ERRCODE = 'P0003';
    END IF;

    -- Calculate discount
    IF v_coupon.discount_percent IS NOT NULL AND v_coupon.discount_percent > 0 THEN
        v_discount := floor((p_subtotal_cents * v_coupon.discount_percent) / 100.0);
    ELSIF v_coupon.discount_amount IS NOT NULL AND v_coupon.discount_amount > 0 THEN
        v_discount := round(v_coupon.discount_amount * 100);
    ELSE
        v_discount := 0;
    END IF;

    -- Cap discount to subtotal
    v_discount := GREATEST(0, LEAST(p_subtotal_cents, v_discount));

    RETURN QUERY SELECT v_coupon.code, v_discount, GREATEST(0, p_subtotal_cents - v_discount);
END;
$$;

-- 9. Stored Procedure: create_payment_intent
CREATE OR REPLACE FUNCTION public.create_payment_intent(
    p_purchase_type TEXT,
    p_course_id UUID,
    p_plan_code TEXT,
    p_billing_cycle TEXT,
    p_coupon_code TEXT,
    p_idempotency_key TEXT,
    p_user_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_subtotal_cents INTEGER := 0;
    v_discount_cents INTEGER := 0;
    v_total_cents INTEGER := 0;
    v_currency TEXT := 'INR';
    v_plan_id UUID;
    v_coupon_record RECORD;
    v_pricing_snapshot JSONB;
    v_intent_id UUID;
    v_existing_intent public.payment_intents%ROWTYPE;
BEGIN
    -- Idempotency check: if intent already exists with this idempotency key for user and is active
    IF p_idempotency_key IS NOT NULL AND trim(p_idempotency_key) <> '' THEN
        SELECT * INTO v_existing_intent
        FROM public.payment_intents
        WHERE user_id = p_user_id
          AND idempotency_key = p_idempotency_key
          AND expires_at > now()
        ORDER BY created_at DESC
        LIMIT 1;

        IF FOUND THEN
            RETURN jsonb_build_object(
                'id', v_existing_intent.id,
                'status', v_existing_intent.status,
                'currency', v_existing_intent.currency,
                'subtotal_cents', v_existing_intent.subtotal_cents,
                'discount_cents', v_existing_intent.discount_cents,
                'total_cents', v_existing_intent.total_cents,
                'expires_at', v_existing_intent.expires_at,
                'pricing_snapshot', v_existing_intent.pricing_snapshot
            );
        END IF;
    END IF;

    -- Determine authoritative subtotal
    IF p_purchase_type = 'course' THEN
        IF p_course_id IS NULL THEN
            RAISE EXCEPTION 'A course ID is required.' USING ERRCODE = 'P0001';
        END IF;

        -- Check if already enrolled
        IF EXISTS (SELECT 1 FROM public.enrollments WHERE user_id = p_user_id AND course_id = p_course_id) THEN
            RAISE EXCEPTION 'You are already enrolled in this course.' USING ERRCODE = 'P0004';
        END IF;

        SELECT round(COALESCE(price, 0) * 100) INTO v_subtotal_cents
        FROM public.courses
        WHERE id = p_course_id AND is_published = true;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Course not found or not published.' USING ERRCODE = 'P0001';
        END IF;
    ELSIF p_purchase_type = 'subscription' THEN
        IF p_plan_code IS NULL OR p_billing_cycle IS NULL THEN
            RAISE EXCEPTION 'Plan code and billing cycle are required for subscriptions.' USING ERRCODE = 'P0001';
        END IF;

        SELECT id, CASE WHEN p_billing_cycle = 'yearly' THEN yearly_price_cents ELSE monthly_price_cents END, currency
        INTO v_plan_id, v_subtotal_cents, v_currency
        FROM public.subscription_plans
        WHERE code = p_plan_code AND is_active = true;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Subscription plan "%" not found.' USING ERRCODE = 'P0001';
        END IF;
    ELSE
        RAISE EXCEPTION 'Invalid purchase type "%".' USING ERRCODE = 'P0001';
    END IF;

    -- Calculate coupon discount
    IF p_coupon_code IS NOT NULL AND trim(p_coupon_code) <> '' THEN
        SELECT * INTO v_coupon_record
        FROM public.aura_coupon_quote(
            p_user_id,
            p_coupon_code,
            p_purchase_type,
            p_course_id,
            p_plan_code,
            v_subtotal_cents
        );
        v_discount_cents := v_coupon_record.discount_cents;
        v_total_cents := v_coupon_record.total_cents;
    ELSE
        v_discount_cents := 0;
        v_total_cents := v_subtotal_cents;
    END IF;

    v_pricing_snapshot := jsonb_build_object(
        'purchase_type', p_purchase_type,
        'course_id', p_course_id,
        'plan_code', p_plan_code,
        'billing_cycle', p_billing_cycle,
        'coupon_code', p_coupon_code,
        'subtotal_cents', v_subtotal_cents,
        'discount_cents', v_discount_cents,
        'total_cents', v_total_cents
    );

    INSERT INTO public.payment_intents (
        user_id,
        purchase_type,
        course_id,
        plan_id,
        billing_cycle,
        coupon_id,
        idempotency_key,
        amount,
        subtotal_cents,
        discount_cents,
        total_cents,
        currency,
        status,
        pricing_snapshot,
        expires_at
    ) VALUES (
        p_user_id,
        p_purchase_type,
        p_course_id,
        v_plan_id,
        p_billing_cycle,
        p_coupon_code,
        p_idempotency_key,
        v_total_cents / 100.0,
        v_subtotal_cents,
        v_discount_cents,
        v_total_cents,
        v_currency,
        'requires_payment_method',
        v_pricing_snapshot,
        now() + interval '1 hour'
    )
    RETURNING id INTO v_intent_id;

    RETURN jsonb_build_object(
        'id', v_intent_id,
        'status', 'requires_payment_method',
        'currency', v_currency,
        'subtotal_cents', v_subtotal_cents,
        'discount_cents', v_discount_cents,
        'total_cents', v_total_cents,
        'expires_at', (now() + interval '1 hour'),
        'pricing_snapshot', v_pricing_snapshot
    );
END;
$$;

-- 10. Stored Procedure: attach_payment_provider
CREATE OR REPLACE FUNCTION public.attach_payment_provider(
    p_intent_id UUID,
    p_provider TEXT,
    p_provider_intent_id TEXT,
    p_client_secret TEXT,
    p_user_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.payment_intents
    SET
        provider = p_provider,
        provider_intent_id = p_provider_intent_id,
        provider_client_secret = p_client_secret,
        status = 'requires_confirmation',
        updated_at = now()
    WHERE id = p_intent_id AND user_id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment intent not found or unauthorized.' USING ERRCODE = 'P0001';
    END IF;
END;
$$;

-- 11. Row Level Security Policies
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_ledger ENABLE ROW LEVEL SECURITY;

-- Subscription Plans: Public read for active plans; admins manage all
DROP POLICY IF EXISTS "Anyone can view active plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view active plans"
ON public.subscription_plans FOR SELECT
USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage subscription plans" ON public.subscription_plans;
CREATE POLICY "Admins can manage subscription plans"
ON public.subscription_plans FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Payments: Users read own payments; admins read all; insert/update restricted
DROP POLICY IF EXISTS "Users can read own payments" ON public.payments;
CREATE POLICY "Users can read own payments"
ON public.payments FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- Coupon Redemptions: Users read own redemptions; admins read all
DROP POLICY IF EXISTS "Users can view own redemptions" ON public.coupon_redemptions;
CREATE POLICY "Users can view own redemptions"
ON public.coupon_redemptions FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- Revenue Ledger: Teachers view own ledger; admins view all; direct writes blocked from clients
DROP POLICY IF EXISTS "Teachers view own ledger entries" ON public.revenue_ledger;
CREATE POLICY "Teachers view own ledger entries"
ON public.revenue_ledger FOR SELECT TO authenticated
USING ((account_type = 'teacher' AND account_id = auth.uid()) OR public.is_admin());

-- 12. Supabase Realtime Publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.revenue_ledger;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

