-- AURA production monetization schema.
-- Apply after seed.sql, enrollments.sql, and payments-migration.sql.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE CHECK (code IN ('free', 'pro', 'premium')),
    name TEXT NOT NULL,
    monthly_price_cents INTEGER NOT NULL DEFAULT 0 CHECK (monthly_price_cents >= 0),
    yearly_price_cents INTEGER NOT NULL DEFAULT 0 CHECK (yearly_price_cents >= 0),
    currency TEXT NOT NULL DEFAULT 'USD' CHECK (char_length(currency) = 3),
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.subscription_plans
    (code, name, monthly_price_cents, yearly_price_cents, features)
VALUES
    ('free', 'Free', 0, 0, '["free_courses"]'::jsonb),
    ('pro', 'Pro', 1999, 19990, '["premium_courses","certificates"]'::jsonb),
    ('premium', 'Premium', 3499, 34990, '["premium_courses","certificates","priority_support","downloads"]'::jsonb)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    monthly_price_cents = EXCLUDED.monthly_price_cents,
    yearly_price_cents = EXCLUDED.yearly_price_cents,
    features = EXCLUDED.features,
    updated_at = now();

DO $$
DECLARE
    v_constraint RECORD;
BEGIN
    FOR v_constraint IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.profiles'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) ILIKE '%subscription_tier%'
    LOOP
        EXECUTE format(
            'ALTER TABLE public.profiles DROP CONSTRAINT %I',
            v_constraint.conname
        );
    END LOOP;

    ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_subscription_tier_check
        CHECK (subscription_tier IN ('free', 'pro', 'premium'));
END $$;

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
    status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'expired')),
    provider TEXT NOT NULL DEFAULT 'mock',
    provider_customer_id TEXT,
    provider_subscription_id TEXT UNIQUE,
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_one_current_per_user_idx
ON public.subscriptions(user_id)
WHERE status IN ('active', 'past_due');

ALTER TABLE public.coupons
    ADD COLUMN IF NOT EXISTS discount_type TEXT NOT NULL DEFAULT 'percentage',
    ADD COLUMN IF NOT EXISTS discount_value INTEGER,
    ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS usage_limit INTEGER,
    ADD COLUMN IF NOT EXISTS per_user_limit INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS minimum_amount_cents INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS applies_to TEXT NOT NULL DEFAULT 'all',
    ADD COLUMN IF NOT EXISTS plan_code TEXT,
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.coupons
    ALTER COLUMN discount_percent DROP NOT NULL;

UPDATE public.coupons
SET discount_value = COALESCE(discount_value, discount_percent)
WHERE discount_value IS NULL;

ALTER TABLE public.coupons
    ALTER COLUMN discount_value SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.coupons'::regclass
          AND conname = 'coupons_discount_type_check'
    ) THEN
        ALTER TABLE public.coupons
            ADD CONSTRAINT coupons_discount_type_check
            CHECK (discount_type IN ('percentage', 'fixed_amount'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.coupons'::regclass
          AND conname = 'coupons_applies_to_check'
    ) THEN
        ALTER TABLE public.coupons
            ADD CONSTRAINT coupons_applies_to_check
            CHECK (applies_to IN ('all', 'course', 'subscription'));
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.coupon_courses (
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    PRIMARY KEY (coupon_id, course_id)
);

CREATE TABLE IF NOT EXISTS public.payment_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    purchase_type TEXT NOT NULL CHECK (purchase_type IN ('course', 'subscription')),
    course_id UUID REFERENCES public.courses(id) ON DELETE RESTRICT,
    plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
    billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
    coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
    currency TEXT NOT NULL DEFAULT 'USD' CHECK (char_length(currency) = 3),
    subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents >= 0),
    discount_cents INTEGER NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
    total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
    status TEXT NOT NULL DEFAULT 'requires_payment_method'
        CHECK (status IN (
            'requires_payment_method',
            'requires_confirmation',
            'processing',
            'succeeded',
            'failed',
            'canceled'
        )),
    provider TEXT,
    provider_intent_id TEXT UNIQUE,
    provider_client_secret TEXT,
    idempotency_key TEXT NOT NULL,
    pricing_snapshot JSONB NOT NULL,
    failure_code TEXT,
    failure_message TEXT,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 minutes'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, idempotency_key),
    CHECK (
        (purchase_type = 'course' AND course_id IS NOT NULL AND plan_id IS NULL)
        OR
        (purchase_type = 'subscription' AND course_id IS NULL AND plan_id IS NOT NULL AND billing_cycle IS NOT NULL)
    )
);

ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS payment_intent_id UUID REFERENCES public.payment_intents(id) ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'mock',
    ADD COLUMN IF NOT EXISTS provider_payment_id TEXT,
    ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD',
    ADD COLUMN IF NOT EXISTS subtotal_cents INTEGER,
    ADD COLUMN IF NOT EXISTS discount_cents INTEGER,
    ADD COLUMN IF NOT EXISTS total_cents INTEGER,
    ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

UPDATE public.payments
SET
    subtotal_cents = COALESCE(subtotal_cents, round((amount + COALESCE(discount_applied, 0)) * 100)),
    discount_cents = COALESCE(discount_cents, round(COALESCE(discount_applied, 0) * 100)),
    total_cents = COALESCE(total_cents, round(amount * 100)),
    paid_at = COALESCE(paid_at, created_at)
WHERE subtotal_cents IS NULL OR discount_cents IS NULL OR total_cents IS NULL OR paid_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS payments_intent_unique_idx
ON public.payments(payment_intent_id)
WHERE payment_intent_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_payment_unique_idx
ON public.payments(provider, provider_payment_id)
WHERE provider_payment_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    payment_intent_id UUID NOT NULL UNIQUE REFERENCES public.payment_intents(id) ON DELETE RESTRICT,
    payment_id UUID NOT NULL UNIQUE REFERENCES public.payments(id) ON DELETE RESTRICT,
    discount_cents INTEGER NOT NULL CHECK (discount_cents >= 0),
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.revenue_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
    payment_intent_id UUID NOT NULL REFERENCES public.payment_intents(id) ON DELETE RESTRICT,
    account_type TEXT NOT NULL CHECK (account_type IN ('platform', 'teacher')),
    account_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    entry_type TEXT NOT NULL CHECK (entry_type IN ('sale', 'refund', 'chargeback', 'adjustment')),
    direction TEXT NOT NULL CHECK (direction IN ('credit', 'debit')),
    amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    commission_rate_bps INTEGER NOT NULL DEFAULT 0 CHECK (commission_rate_bps BETWEEN 0 AND 10000),
    available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS revenue_ledger_sale_account_unique_idx
ON public.revenue_ledger(payment_id, account_type, COALESCE(account_id, '00000000-0000-0000-0000-000000000000'::uuid))
WHERE entry_type = 'sale' AND direction = 'credit';

CREATE INDEX IF NOT EXISTS payment_intents_user_created_idx
ON public.payment_intents(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payments_paid_at_idx
ON public.payments(paid_at DESC);
CREATE INDEX IF NOT EXISTS revenue_ledger_account_created_idx
ON public.revenue_ledger(account_type, account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS coupon_redemptions_coupon_user_idx
ON public.coupon_redemptions(coupon_id, user_id);

CREATE OR REPLACE FUNCTION public.aura_coupon_quote(
    p_user_id UUID,
    p_code TEXT,
    p_purchase_type TEXT,
    p_course_id UUID,
    p_plan_code TEXT,
    p_subtotal_cents INTEGER
) RETURNS TABLE(coupon_id UUID, discount_cents INTEGER, discount_label TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_coupon public.coupons%ROWTYPE;
    v_total_uses INTEGER;
    v_user_uses INTEGER;
BEGIN
    IF p_code IS NULL OR btrim(p_code) = '' THEN
        RETURN QUERY SELECT NULL::UUID, 0, NULL::TEXT;
        RETURN;
    END IF;

    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE upper(code) = upper(btrim(p_code))
    FOR SHARE;

    IF NOT FOUND OR NOT v_coupon.is_active THEN
        RAISE EXCEPTION 'Invalid coupon code' USING ERRCODE = 'P0001';
    END IF;

    IF (v_coupon.starts_at IS NOT NULL AND now() < v_coupon.starts_at)
       OR (v_coupon.expires_at IS NOT NULL AND now() >= v_coupon.expires_at) THEN
        RAISE EXCEPTION 'Coupon is not currently valid' USING ERRCODE = 'P0001';
    END IF;

    IF p_subtotal_cents < v_coupon.minimum_amount_cents THEN
        RAISE EXCEPTION 'Order does not meet the coupon minimum' USING ERRCODE = 'P0001';
    END IF;

    IF v_coupon.applies_to <> 'all' AND v_coupon.applies_to <> p_purchase_type THEN
        RAISE EXCEPTION 'Coupon does not apply to this purchase' USING ERRCODE = 'P0001';
    END IF;

    IF p_purchase_type = 'subscription'
       AND v_coupon.plan_code IS NOT NULL
       AND v_coupon.plan_code <> p_plan_code THEN
        RAISE EXCEPTION 'Coupon does not apply to this plan' USING ERRCODE = 'P0001';
    END IF;

    IF p_purchase_type = 'course'
       AND EXISTS (SELECT 1 FROM public.coupon_courses cc WHERE cc.coupon_id = v_coupon.id)
       AND NOT EXISTS (
           SELECT 1 FROM public.coupon_courses cc
           WHERE cc.coupon_id = v_coupon.id AND cc.course_id = p_course_id
       ) THEN
        RAISE EXCEPTION 'Coupon does not apply to this course' USING ERRCODE = 'P0001';
    END IF;

    SELECT count(*) INTO v_total_uses
    FROM public.coupon_redemptions
    WHERE coupon_redemptions.coupon_id = v_coupon.id;

    SELECT count(*) INTO v_user_uses
    FROM public.coupon_redemptions
    WHERE coupon_redemptions.coupon_id = v_coupon.id
      AND coupon_redemptions.user_id = p_user_id;

    IF v_coupon.usage_limit IS NOT NULL AND v_total_uses >= v_coupon.usage_limit THEN
        RAISE EXCEPTION 'Coupon usage limit has been reached' USING ERRCODE = 'P0001';
    END IF;

    IF v_user_uses >= v_coupon.per_user_limit THEN
        RAISE EXCEPTION 'You have already used this coupon' USING ERRCODE = 'P0001';
    END IF;

    RETURN QUERY SELECT
        v_coupon.id,
        LEAST(
            p_subtotal_cents,
            CASE v_coupon.discount_type
                WHEN 'percentage' THEN floor(p_subtotal_cents * v_coupon.discount_value / 100.0)::INTEGER
                ELSE v_coupon.discount_value
            END
        ),
        CASE v_coupon.discount_type
            WHEN 'percentage' THEN v_coupon.discount_value::TEXT || '% off'
            ELSE '$' || to_char(v_coupon.discount_value / 100.0, 'FM999999990.00') || ' off'
        END;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_payment_intent(
    p_purchase_type TEXT,
    p_course_id UUID DEFAULT NULL,
    p_plan_code TEXT DEFAULT NULL,
    p_billing_cycle TEXT DEFAULT NULL,
    p_coupon_code TEXT DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := p_user_id;
    v_course public.courses%ROWTYPE;
    v_plan public.subscription_plans%ROWTYPE;
    v_coupon_id UUID;
    v_discount_cents INTEGER := 0;
    v_discount_label TEXT;
    v_subtotal_cents INTEGER;
    v_currency TEXT := 'USD';
    v_intent public.payment_intents%ROWTYPE;
    v_key TEXT := COALESCE(NULLIF(btrim(p_idempotency_key), ''), gen_random_uuid()::TEXT);
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
    END IF;

    IF p_purchase_type = 'course' THEN
        SELECT * INTO v_course
        FROM public.courses
        WHERE id = p_course_id AND COALESCE(is_published, true)
        FOR SHARE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Course not found' USING ERRCODE = 'P0001';
        END IF;

        IF EXISTS (
            SELECT 1 FROM public.enrollments
            WHERE user_id = v_user_id AND course_id = p_course_id
        ) THEN
            RAISE EXCEPTION 'You are already enrolled in this course' USING ERRCODE = 'P0001';
        END IF;

        v_subtotal_cents := round(COALESCE(v_course.price, 0) * 100);
    ELSIF p_purchase_type = 'subscription' THEN
        SELECT * INTO v_plan
        FROM public.subscription_plans
        WHERE code = p_plan_code AND is_active
        FOR SHARE;

        IF NOT FOUND OR p_billing_cycle NOT IN ('monthly', 'yearly') OR v_plan.code = 'free' THEN
            RAISE EXCEPTION 'Invalid paid subscription plan' USING ERRCODE = 'P0001';
        END IF;

        v_subtotal_cents := CASE p_billing_cycle
            WHEN 'monthly' THEN v_plan.monthly_price_cents
            ELSE v_plan.yearly_price_cents
        END;
        v_currency := v_plan.currency;
    ELSE
        RAISE EXCEPTION 'Invalid purchase type' USING ERRCODE = 'P0001';
    END IF;

    SELECT q.coupon_id, q.discount_cents, q.discount_label
    INTO v_coupon_id, v_discount_cents, v_discount_label
    FROM public.aura_coupon_quote(
        v_user_id,
        p_coupon_code,
        p_purchase_type,
        p_course_id,
        p_plan_code,
        v_subtotal_cents
    ) q;

    INSERT INTO public.payment_intents (
        user_id, purchase_type, course_id, plan_id, billing_cycle, coupon_id,
        currency, subtotal_cents, discount_cents, total_cents, idempotency_key,
        pricing_snapshot
    ) VALUES (
        v_user_id,
        p_purchase_type,
        p_course_id,
        v_plan.id,
        p_billing_cycle,
        v_coupon_id,
        v_currency,
        v_subtotal_cents,
        v_discount_cents,
        GREATEST(0, v_subtotal_cents - v_discount_cents),
        v_key,
        jsonb_build_object(
            'purchase_type', p_purchase_type,
            'course_id', p_course_id,
            'course_title', v_course.title,
            'plan_code', v_plan.code,
            'plan_name', v_plan.name,
            'billing_cycle', p_billing_cycle,
            'coupon_code', CASE WHEN v_coupon_id IS NULL THEN NULL ELSE upper(btrim(p_coupon_code)) END,
            'discount_label', v_discount_label
        )
    )
    ON CONFLICT (user_id, idempotency_key) DO UPDATE
        SET updated_at = public.payment_intents.updated_at
    RETURNING * INTO v_intent;

    RETURN jsonb_build_object(
        'id', v_intent.id,
        'status', v_intent.status,
        'currency', v_intent.currency,
        'subtotal_cents', v_intent.subtotal_cents,
        'discount_cents', v_intent.discount_cents,
        'total_cents', v_intent.total_cents,
        'expires_at', v_intent.expires_at,
        'pricing_snapshot', v_intent.pricing_snapshot
    );
END;
$$;

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
    WHERE id = p_intent_id
      AND user_id = p_user_id
      AND status = 'requires_payment_method'
      AND expires_at > now();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment intent cannot be attached' USING ERRCODE = 'P0001';
    END IF;
END;
$$;

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
    v_platform_rate_bps INTEGER := 3000;
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

    IF v_intent.status = 'succeeded' THEN
        SELECT id INTO v_payment_id
        FROM public.payments
        WHERE payment_intent_id = v_intent.id;
        RETURN jsonb_build_object('payment_id', v_payment_id, 'status', 'succeeded');
    END IF;

    IF v_intent.status NOT IN ('requires_confirmation', 'processing')
       OR v_intent.expires_at <= now()
       OR v_intent.provider_intent_id IS NULL THEN
        RAISE EXCEPTION 'Payment intent cannot be confirmed' USING ERRCODE = 'P0001';
    END IF;

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

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read active plans" ON public.subscription_plans;
CREATE POLICY "Authenticated users can read active plans"
ON public.subscription_plans FOR SELECT TO authenticated
USING (is_active);

DROP POLICY IF EXISTS "Users can read own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can read own subscriptions"
ON public.subscriptions FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users can read own payment intents" ON public.payment_intents;
CREATE POLICY "Users can read own payment intents"
ON public.payment_intents FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users can read own coupon redemptions" ON public.coupon_redemptions;
CREATE POLICY "Users can read own coupon redemptions"
ON public.coupon_redemptions FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Admins and earning teachers can read ledger" ON public.revenue_ledger;
CREATE POLICY "Admins and earning teachers can read ledger"
ON public.revenue_ledger FOR SELECT TO authenticated
USING (public.is_admin() OR account_id = auth.uid());

REVOKE INSERT, UPDATE, DELETE ON public.payment_intents FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.payments FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.subscriptions FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.coupon_redemptions FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.revenue_ledger FROM authenticated;

REVOKE ALL ON FUNCTION public.create_payment_intent(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.attach_payment_provider(UUID, TEXT, TEXT, TEXT, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.confirm_payment_intent(UUID, TEXT, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.aura_coupon_quote(UUID, TEXT, TEXT, UUID, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_payment_intent(TEXT, UUID, TEXT, TEXT, TEXT, TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.attach_payment_provider(UUID, TEXT, TEXT, TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.confirm_payment_intent(UUID, TEXT, UUID) TO service_role;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_intents;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.revenue_ledger;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;
