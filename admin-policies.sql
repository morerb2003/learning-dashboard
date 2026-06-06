create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.is_teacher()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('teacher', 'admin')
  );
$$;

revoke all on function public.is_teacher() from public;
grant execute on function public.is_teacher() to authenticated;

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
on public.profiles
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update all profiles" on public.profiles;
create policy "Admins can update all profiles"
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can view all notes" on public.notes;
create policy "Admins can view all notes"
on public.notes
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can manage all courses" on public.courses;
create policy "Admins can manage all courses"
on public.courses
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Teachers can create own courses" on public.courses;
create policy "Teachers can create own courses"
on public.courses
for insert
to authenticated
with check (teacher_id = auth.uid() and public.is_teacher());

drop policy if exists "Teachers can update own courses" on public.courses;
create policy "Teachers can update own courses"
on public.courses
for update
to authenticated
using (teacher_id = auth.uid() and public.is_teacher())
with check (teacher_id = auth.uid() and public.is_teacher());

drop policy if exists "Teachers can delete own courses" on public.courses;
create policy "Teachers can delete own courses"
on public.courses
for delete
to authenticated
using (teacher_id = auth.uid() and public.is_teacher());

CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, course_id)
);

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

drop policy if exists "Users can read own enrollments" on public.enrollments;
create policy "Users can read own enrollments"
on public.enrollments
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can create own enrollments" on public.enrollments;
create policy "Users can create own enrollments"
on public.enrollments
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own enrollments" on public.enrollments;
create policy "Users can update own enrollments"
on public.enrollments
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own enrollments" on public.enrollments;
create policy "Users can delete own enrollments"
on public.enrollments
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "Admins can view all enrollments" on public.enrollments;
create policy "Admins can view all enrollments"
on public.enrollments
for select
to authenticated
using (public.is_admin());

CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT,
    lesson_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

drop policy if exists "Authenticated users can view lessons" on public.lessons;
create policy "Authenticated users can view lessons"
on public.lessons
for select
to authenticated
using (true);

drop policy if exists "Admins can manage all lessons" on public.lessons;
create policy "Admins can manage all lessons"
on public.lessons
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Teachers can manage lessons for own courses" on public.lessons;
create policy "Teachers can manage lessons for own courses"
on public.lessons
for all
to authenticated
using (
  exists (
    select 1
    from public.courses
    where courses.id = lessons.course_id
      and courses.teacher_id = auth.uid()
  )
  and public.is_teacher()
)
with check (
  exists (
    select 1
    from public.courses
    where courses.id = lessons.course_id
      and courses.teacher_id = auth.uid()
  )
  and public.is_teacher()
);

-- ==========================================
-- PHASE 3 DATABASE SCHEMA MIGRATIONS
-- ==========================================

-- 1. Ensure courses table has icon_name
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS icon_name TEXT DEFAULT 'BookOpen';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS teacher_id UUID;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.courses'::regclass
          AND conname = 'courses_teacher_id_fkey'
    ) THEN
        ALTER TABLE public.courses
        ADD CONSTRAINT courses_teacher_id_fkey
        FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS courses_teacher_id_idx
ON public.courses(teacher_id);

-- 2. Ensure profiles table has updated_at
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'student';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'student';

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

UPDATE public.profiles
SET role = 'student'
WHERE role IS NULL OR role NOT IN ('student', 'pending_teacher', 'teacher', 'admin');

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('student', 'pending_teacher', 'teacher', 'admin'));

-- 3. Secure function to allow admins to delete users from auth.users (cascades to profiles)
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Check if the calling user is indeed an admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can delete users';
    END IF;

    -- Delete the user from auth.users (cascades to public.profiles and other foreign references)
    DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- Revoke public execution and grant to authenticated roles
REVOKE ALL ON FUNCTION public.delete_user_by_admin(UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.delete_user_by_admin(UUID) TO authenticated;

-- ==========================================
-- TRIGGER FOR PROFILE CREATION ON AUTH SIGNUP
-- ==========================================
-- Safely creates a profile on new user registration or Google OAuth sign-in.
-- Teacher signups are assigned 'pending_teacher' until an admin approves them.
-- Any attempt to claim 'admin' during signup is silently blocked and defaults to 'student'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    requested_role TEXT;
    assigned_role TEXT;
BEGIN
    -- Read the role the user requested during signup (from email/password signups)
    requested_role := NEW.raw_user_meta_data ->> 'role';

    -- Security: Only 'student' and 'teacher' are valid self-assigned roles.
    -- 'teacher' maps to 'pending_teacher' until an admin manually approves.
    -- 'admin' and all unknown/blank values fall back to 'student'.
    IF requested_role = 'teacher' THEN
        assigned_role := 'pending_teacher';
    ELSE
        assigned_role := 'student';
    END IF;

    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''), split_part(NEW.email, '@', 1), 'New user'),
        NEW.email,
        assigned_role
    )
    ON CONFLICT (id) DO UPDATE
    SET
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        email = COALESCE(EXCLUDED.email, public.profiles.email),
        updated_at = timezone('utc'::text, now());
    -- NOTE: On conflict (e.g. Google re-login), role is NOT updated to preserve
    -- any manual promotions made by an admin.

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- COURSE THUMBNAIL STORAGE
-- ==========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-thumbnails', 'course-thumbnails', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public can view course thumbnails" ON storage.objects;
CREATE POLICY "Public can view course thumbnails"
ON storage.objects
FOR SELECT
USING (bucket_id = 'course-thumbnails');

DROP POLICY IF EXISTS "Teachers can upload course thumbnails" ON storage.objects;
CREATE POLICY "Teachers can upload course thumbnails"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'course-thumbnails'
    AND public.is_teacher()
    AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Teachers can update own course thumbnails" ON storage.objects;
CREATE POLICY "Teachers can update own course thumbnails"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'course-thumbnails'
    AND public.is_teacher()
    AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'course-thumbnails'
    AND public.is_teacher()
    AND (storage.foldername(name))[1] = auth.uid()::text
);
