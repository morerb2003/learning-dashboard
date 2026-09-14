-- ============================================================================
-- AURA LEARNING DASHBOARD: ROLE-BASED PROFILES MIGRATION
-- Run this in the Supabase SQL Editor to establish student_profiles,
-- teacher_profiles, and admin_profiles tables with Row Level Security.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Extend base public.profiles table with missing social and personal columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS github_url TEXT;

-- Create unique index on username if not null
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_idx 
ON public.profiles (LOWER(username)) 
WHERE username IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 2. Student Profiles
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_profiles (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    date_of_birth DATE,
    gender TEXT,
    learning_goals TEXT[] DEFAULT '{}',
    skills TEXT[] DEFAULT '{}',
    preferred_language TEXT DEFAULT 'en',
    learning_streak INTEGER DEFAULT 0,
    profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'students_only', 'private')),
    show_learning_progress BOOLEAN DEFAULT true,
    show_certificates BOOLEAN DEFAULT true,
    show_achievements BOOLEAN DEFAULT true,
    notification_preferences JSONB DEFAULT '{"email": true, "course_updates": true, "quiz_reminders": true, "community_activity": true}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view their own student profile" ON public.student_profiles;
CREATE POLICY "Students can view their own student profile"
ON public.student_profiles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR profile_visibility = 'public' OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Students can update their own student profile" ON public.student_profiles;
CREATE POLICY "Students can update their own student profile"
ON public.student_profiles FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Students can insert their own student profile" ON public.student_profiles;
CREATE POLICY "Students can insert their own student profile"
ON public.student_profiles FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 3. Teacher Profiles
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teacher_profiles (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    headline TEXT DEFAULT 'Instructor & Course Creator',
    expertise TEXT[] DEFAULT '{}',
    experience_years INTEGER DEFAULT 0,
    organization TEXT,
    previous_organizations TEXT[] DEFAULT '{}',
    education TEXT,
    certifications TEXT[] DEFAULT '{}',
    teaching_experience TEXT,
    teaching_style TEXT,
    preferred_categories TEXT[] DEFAULT '{}',
    available_hours INTEGER DEFAULT 20,
    student_capacity INTEGER DEFAULT 250,
    delivery_preference TEXT DEFAULT 'online' CHECK (delivery_preference IN ('online', 'offline', 'hybrid')),
    rating NUMERIC(3,2) DEFAULT 5.0,
    reviews_count INTEGER DEFAULT 0,
    total_students_count INTEGER DEFAULT 0,
    total_courses_count INTEGER DEFAULT 0,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')),
    identity_verified BOOLEAN DEFAULT false,
    qualification_verified BOOLEAN DEFAULT false,
    certification_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view teacher public credentials" ON public.teacher_profiles;
CREATE POLICY "Anyone can view teacher public credentials"
ON public.teacher_profiles FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Teachers can update their own teacher profile" ON public.teacher_profiles;
CREATE POLICY "Teachers can update their own teacher profile"
ON public.teacher_profiles FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
WITH CHECK (user_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Teachers can insert their own teacher profile" ON public.teacher_profiles;
CREATE POLICY "Teachers can insert their own teacher profile"
ON public.teacher_profiles FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 4. Admin Profiles
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    designation TEXT DEFAULT 'Platform Administrator',
    department TEXT DEFAULT 'Operations',
    admin_role TEXT DEFAULT 'ADMIN' CHECK (admin_role IN ('SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'SUPPORT_ADMIN', 'CONTENT_ADMIN', 'FINANCE_ADMIN')),
    permissions JSONB DEFAULT '{
        "user_management": true,
        "teacher_management": true,
        "course_management": true,
        "payments": true,
        "subscriptions": true,
        "reports": true,
        "analytics": true,
        "moderation": true,
        "system_settings": true,
        "audit_logs": true
    }'::jsonb,
    security_level TEXT DEFAULT 'Tier 3 (High)',
    recovery_email TEXT,
    two_factor_enabled BOOLEAN DEFAULT false,
    last_login_ip TEXT,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view admin profiles" ON public.admin_profiles;
CREATE POLICY "Admins can view admin profiles"
ON public.admin_profiles FOR SELECT TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Admins can update their own admin profile" ON public.admin_profiles;
CREATE POLICY "Admins can update their own admin profile"
ON public.admin_profiles FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
WITH CHECK (user_id = auth.uid() AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Admins can insert admin profiles" ON public.admin_profiles;
CREATE POLICY "Admins can insert admin profiles"
ON public.admin_profiles FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 5. Auto-Provisioning Helper for New & Existing Profiles
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ensure_role_profile_exists(target_user_id UUID, user_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    IF user_role = 'teacher' THEN
        INSERT INTO public.teacher_profiles (user_id)
        VALUES (target_user_id)
        ON CONFLICT (user_id) DO NOTHING;
    ELSIF user_role = 'admin' THEN
        INSERT INTO public.admin_profiles (user_id)
        VALUES (target_user_id)
        ON CONFLICT (user_id) DO NOTHING;
    ELSE
        INSERT INTO public.student_profiles (user_id)
        VALUES (target_user_id)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
END;
$$;

-- Provision role profiles for existing users who do not have one yet
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id, role FROM public.profiles LOOP
        PERFORM public.ensure_role_profile_exists(r.id, r.role);
    END LOOP;
END $$;
