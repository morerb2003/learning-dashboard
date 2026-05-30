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
