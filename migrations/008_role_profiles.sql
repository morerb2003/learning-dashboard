-- ==============================================================================
-- Migration: 008_role_profiles.sql
-- Description: Role profile extension tables (student_profiles, teacher_profiles, admin_profiles)
-- ==============================================================================

-- 1. Student Profiles Extension Table
CREATE TABLE IF NOT EXISTS public.student_profiles (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    learning_streak INTEGER DEFAULT 0,
    total_learning_hours NUMERIC(6, 1) DEFAULT 0.0,
    skills TEXT[] DEFAULT '{}'::TEXT[],
    learning_goals TEXT[] DEFAULT '{}'::TEXT[],
    target_role TEXT,
    difficulty_preference TEXT DEFAULT 'all',
    preferred_language TEXT DEFAULT 'en',
    show_progress BOOLEAN DEFAULT true,
    show_certificates BOOLEAN DEFAULT true,
    show_achievements BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Teacher Profiles Extension Table
CREATE TABLE IF NOT EXISTS public.teacher_profiles (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    headline TEXT,
    expertise_areas TEXT[] DEFAULT '{}'::TEXT[],
    teaching_modes TEXT[] DEFAULT '{online}'::TEXT[],
    languages_spoken TEXT[] DEFAULT '{English}'::TEXT[],
    hourly_rate NUMERIC(10, 2) DEFAULT 0.00,
    total_students_taught INTEGER DEFAULT 0,
    average_rating NUMERIC(3, 2) DEFAULT 5.00,
    total_reviews_count INTEGER DEFAULT 0,
    teaching_experience_years INTEGER DEFAULT 1,
    payout_method TEXT DEFAULT 'bank_transfer',
    payout_account_details JSONB DEFAULT '{}'::jsonb,
    is_verified BOOLEAN DEFAULT false,
    verification_document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Admin Profiles Extension Table
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    admin_title TEXT DEFAULT 'Platform Administrator',
    department TEXT DEFAULT 'Operations',
    security_clearance_level TEXT DEFAULT 'standard',
    permissions JSONB DEFAULT '["read:users", "manage:courses", "moderate:content", "view:analytics"]'::jsonb,
    emergency_contact TEXT,
    is_super_admin BOOLEAN DEFAULT false,
    last_audit_review_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view student profiles" ON public.student_profiles;
CREATE POLICY "Public can view student profiles"
ON public.student_profiles FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Students can update own profile" ON public.student_profiles;
CREATE POLICY "Students can update own profile"
ON public.student_profiles FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Public can view teacher profiles" ON public.teacher_profiles;
CREATE POLICY "Public can view teacher profiles"
ON public.teacher_profiles FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Teachers can update own profile" ON public.teacher_profiles;
CREATE POLICY "Teachers can update own profile"
ON public.teacher_profiles FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view admin profiles" ON public.admin_profiles;
CREATE POLICY "Admins can view admin profiles"
ON public.admin_profiles FOR ALL TO authenticated
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
