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

-- ==========================================
-- PHASE 3 DATABASE SCHEMA MIGRATIONS
-- ==========================================

-- 1. Ensure courses table has icon_name
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS icon_name TEXT DEFAULT 'BookOpen';

-- 2. Ensure profiles table has updated_at
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

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
SET search_path = public
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
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
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


