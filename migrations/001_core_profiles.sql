-- ==============================================================================
-- Migration: 001_core_profiles.sql
-- Description: Core user profiles schema, role constraints, and auth trigger
-- Production Safe: Uses CREATE TABLE IF NOT EXISTS and ALTER TABLE ADD COLUMN
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Base Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    username TEXT UNIQUE,
    phone TEXT,
    avatar_url TEXT,
    bio TEXT,
    location TEXT,
    website TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    role TEXT NOT NULL DEFAULT 'student',
    subscription_tier TEXT DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all columns exist idempotently
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS github_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'student';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Role constraint check
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.profiles'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) ILIKE '%role%'
    LOOP
        EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS %I', constraint_record.conname);
    END LOOP;
END $$;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('student', 'pending_teacher', 'teacher', 'admin'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- 2. Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can view profiles" ON public.profiles;
CREATE POLICY "Anyone authenticated can view profiles"
ON public.profiles FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
ON public.profiles FOR ALL TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 3. Trigger to provision profile on auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    user_full_name TEXT;
    user_avatar TEXT;
BEGIN
    user_full_name := COALESCE(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'name',
        split_part(new.email, '@', 1)
    );
    user_avatar := COALESCE(
        new.raw_user_meta_data->>'avatar_url',
        new.raw_user_meta_data->>'picture',
        NULL
    );

    INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
    VALUES (new.id, new.email, user_full_name, user_avatar, 'student')
    ON CONFLICT (id) DO UPDATE
    SET
        email = EXCLUDED.email,
        full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
        avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
        updated_at = now();

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
