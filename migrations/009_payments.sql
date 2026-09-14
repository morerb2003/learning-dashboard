-- ==============================================================================
-- Migration: 009_payments.sql
-- Description: Subscriptions, payment intents, payment transactions, and coupons
-- ==============================================================================

-- 1. Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'premium')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Payment Intents Table
CREATE TABLE IF NOT EXISTS public.payment_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled')),
    payment_method TEXT NOT NULL DEFAULT 'card',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
    code TEXT PRIMARY KEY,
    discount_percent INTEGER CHECK (discount_percent > 0 AND discount_percent <= 100),
    discount_amount NUMERIC(10, 2),
    valid_until TIMESTAMPTZ,
    max_redemptions INTEGER DEFAULT 100,
    times_redeemed INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_user_id ON public.payment_intents(user_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own subscription" ON public.subscriptions;
CREATE POLICY "Users can read own subscription"
ON public.subscriptions FOR SELECT TO authenticated
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Users can read own payment intents" ON public.payment_intents;
CREATE POLICY "Users can read own payment intents"
ON public.payment_intents FOR SELECT TO authenticated
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Anyone can validate active coupons" ON public.coupons;
CREATE POLICY "Anyone can validate active coupons"
ON public.coupons FOR SELECT
USING (is_active = true);
