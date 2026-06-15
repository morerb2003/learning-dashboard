-- SQL Migration script to support payments, subscriptions, and coupons.
-- Run in Supabase SQL Editor.

-- 1. Alter courses table to add price and premium state fields
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- 2. Alter profiles table to add subscription plans
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;

-- 3. Create coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create payments / transaction tracking table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    discount_applied NUMERIC DEFAULT 0,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('course_purchase', 'subscription_pro')),
    coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    transaction_id TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Enable Row Level Security (RLS) on new tables
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 6. Setup policies
DROP POLICY IF EXISTS "Anyone can read active coupons" ON public.coupons;
CREATE POLICY "Anyone can read active coupons" ON public.coupons
    FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Users can read own payments" ON public.payments;
CREATE POLICY "Users can read own payments" ON public.payments
    FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins and teachers can read all payments" ON public.payments;
CREATE POLICY "Admins and teachers can read all payments" ON public.payments
    FOR SELECT TO authenticated USING (public.is_admin() OR public.is_teacher());

-- 7. Seed coupons and update courses with prices
INSERT INTO public.coupons (code, discount_percent, is_active)
VALUES 
    ('AURA50', 50, true),
    ('WELCOME100', 100, true)
ON CONFLICT (code) DO NOTHING;

UPDATE public.courses SET is_premium = true, price = 49.99 WHERE title = 'Advanced React Patterns';
UPDATE public.courses SET is_premium = true, price = 29.99 WHERE title = 'Supabase & Postgres Masterclass';
