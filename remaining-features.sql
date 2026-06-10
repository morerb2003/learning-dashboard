-- Communication, moderation, auditing, and realtime expansion for AURA LMS.
-- Run after professional-features.sql.

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.course_discussions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 200),
  body text not null check (char_length(body) between 3 and 8000),
  is_locked boolean not null default false,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.discussion_replies (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid not null references public.course_discussions(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.platform_announcements (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 200),
  body text not null check (char_length(body) between 3 and 8000),
  audience text not null default 'all'
    check (audience in ('all', 'students', 'teachers', 'course')),
  published_at timestamptz not null default now(),
  expires_at timestamptz
);

create table if not exists public.moderation_flags (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  content_type text not null check (content_type in ('discussion', 'reply', 'message')),
  content_id uuid not null,
  reason text not null check (char_length(reason) between 3 and 1000),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists direct_messages_users_idx
  on public.direct_messages (sender_id, recipient_id, created_at desc);
create index if not exists discussions_course_idx
  on public.course_discussions (course_id, created_at desc);
create index if not exists replies_discussion_idx
  on public.discussion_replies (discussion_id, created_at);
create index if not exists announcements_published_idx
  on public.platform_announcements (published_at desc);
create index if not exists audit_logs_created_idx
  on public.audit_logs (created_at desc);

alter table public.direct_messages enable row level security;
alter table public.course_discussions enable row level security;
alter table public.discussion_replies enable row level security;
alter table public.platform_announcements enable row level security;
alter table public.moderation_flags enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "Users can read own direct messages" on public.direct_messages;
create policy "Users can read own direct messages"
on public.direct_messages for select to authenticated
using (sender_id = auth.uid() or recipient_id = auth.uid() or public.is_admin());

drop policy if exists "Users can send direct messages" on public.direct_messages;
create policy "Users can send direct messages"
on public.direct_messages for insert to authenticated
with check (sender_id = auth.uid() and recipient_id <> auth.uid());

drop policy if exists "Recipients can update direct messages" on public.direct_messages;
create policy "Recipients can update direct messages"
on public.direct_messages for update to authenticated
using (recipient_id = auth.uid())
with check (recipient_id = auth.uid());

drop policy if exists "Admins can delete direct messages" on public.direct_messages;
create policy "Admins can delete direct messages"
on public.direct_messages for delete to authenticated
using (public.is_admin());

drop policy if exists "Course members can read discussions" on public.course_discussions;
create policy "Course members can read discussions"
on public.course_discussions for select to authenticated
using (
  not is_hidden
  and (
    exists (
      select 1 from public.enrollments e
      where e.course_id = course_discussions.course_id and e.user_id = auth.uid()
    )
    or exists (
      select 1 from public.courses c
      where c.id = course_discussions.course_id and c.teacher_id = auth.uid()
    )
    or public.is_admin()
  )
);

drop policy if exists "Course members can create discussions" on public.course_discussions;
create policy "Course members can create discussions"
on public.course_discussions for insert to authenticated
with check (
  author_id = auth.uid()
  and (
    exists (
      select 1 from public.enrollments e
      where e.course_id = course_discussions.course_id and e.user_id = auth.uid()
    )
    or exists (
      select 1 from public.courses c
      where c.id = course_discussions.course_id and c.teacher_id = auth.uid()
    )
    or public.is_admin()
  )
);

drop policy if exists "Authors and staff can update discussions" on public.course_discussions;
create policy "Authors and staff can update discussions"
on public.course_discussions for update to authenticated
using (
  author_id = auth.uid()
  or exists (
    select 1 from public.courses c
    where c.id = course_discussions.course_id and c.teacher_id = auth.uid()
  )
  or public.is_admin()
);

drop policy if exists "Course members can read replies" on public.discussion_replies;
create policy "Course members can read replies"
on public.discussion_replies for select to authenticated
using (
  not is_hidden
  and exists (
    select 1 from public.course_discussions d
    where d.id = discussion_replies.discussion_id
      and (
        exists (
          select 1 from public.enrollments e
          where e.course_id = d.course_id and e.user_id = auth.uid()
        )
        or exists (
          select 1 from public.courses c
          where c.id = d.course_id and c.teacher_id = auth.uid()
        )
        or public.is_admin()
      )
  )
);

drop policy if exists "Course members can create replies" on public.discussion_replies;
create policy "Course members can create replies"
on public.discussion_replies for insert to authenticated
with check (
  author_id = auth.uid()
  and exists (
    select 1 from public.course_discussions d
    where d.id = discussion_replies.discussion_id
      and not d.is_locked
      and (
        exists (
          select 1 from public.enrollments e
          where e.course_id = d.course_id and e.user_id = auth.uid()
        )
        or exists (
          select 1 from public.courses c
          where c.id = d.course_id and c.teacher_id = auth.uid()
        )
        or public.is_admin()
      )
  )
);

drop policy if exists "Authors and staff can update replies" on public.discussion_replies;
create policy "Authors and staff can update replies"
on public.discussion_replies for update to authenticated
using (
  author_id = auth.uid()
  or exists (
    select 1
    from public.course_discussions d
    join public.courses c on c.id = d.course_id
    where d.id = discussion_replies.discussion_id and c.teacher_id = auth.uid()
  )
  or public.is_admin()
);

drop policy if exists "Users can read relevant announcements" on public.platform_announcements;
create policy "Users can read relevant announcements"
on public.platform_announcements for select to authenticated
using (
  (expires_at is null or expires_at > now())
  and (
    audience = 'all'
    or (audience = 'students' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'student'))
    or (audience = 'teachers' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('teacher', 'admin')))
    or (
      audience = 'course'
      and (
        exists (select 1 from public.enrollments e where e.course_id = platform_announcements.course_id and e.user_id = auth.uid())
        or exists (select 1 from public.courses c where c.id = platform_announcements.course_id and c.teacher_id = auth.uid())
      )
    )
    or public.is_admin()
  )
);

drop policy if exists "Staff can manage announcements" on public.platform_announcements;
create policy "Staff can manage announcements"
on public.platform_announcements for all to authenticated
using (
  public.is_admin()
  or (
    public.is_teacher()
    and author_id = auth.uid()
    and audience = 'course'
    and exists (
      select 1 from public.courses c
      where c.id = platform_announcements.course_id and c.teacher_id = auth.uid()
    )
  )
)
with check (
  public.is_admin()
  or (
    public.is_teacher()
    and author_id = auth.uid()
    and audience = 'course'
    and exists (
      select 1 from public.courses c
      where c.id = platform_announcements.course_id and c.teacher_id = auth.uid()
    )
  )
);

drop policy if exists "Users can create moderation flags" on public.moderation_flags;
create policy "Users can create moderation flags"
on public.moderation_flags for insert to authenticated
with check (reporter_id = auth.uid());

drop policy if exists "Admins can manage moderation flags" on public.moderation_flags;
create policy "Admins can manage moderation flags"
on public.moderation_flags for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can read audit logs" on public.audit_logs;
create policy "Admins can read audit logs"
on public.audit_logs for select to authenticated
using (public.is_admin());

create or replace function public.write_audit_log(
  audit_action text,
  audit_entity_type text,
  audit_entity_id text,
  audit_details jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
  values (auth.uid(), audit_action, audit_entity_type, audit_entity_id, coalesce(audit_details, '{}'::jsonb));
$$;

create or replace function public.get_communication_contacts()
returns table (
  id uuid,
  full_name text,
  role text
)
language sql
security definer
set search_path = public
as $$
  with current_profile as (
    select p.id, p.role from public.profiles p where p.id = auth.uid()
  ),
  allowed_ids as (
    select p.id
    from public.profiles p, current_profile me
    where me.role = 'admin' and p.id <> me.id

    union

    select e.user_id
    from public.courses c
    join public.enrollments e on e.course_id = c.id
    join current_profile me on me.id = c.teacher_id
    where me.role in ('teacher', 'admin')

    union

    select c.teacher_id
    from public.enrollments e
    join public.courses c on c.id = e.course_id
    join current_profile me on me.id = e.user_id
    where c.teacher_id is not null

    union

    select p.id
    from public.profiles p, current_profile me
    where p.role = 'admin' and p.id <> me.id
  )
  select p.id, p.full_name, p.role
  from public.profiles p
  join allowed_ids a on a.id = p.id
  order by p.full_name nulls last;
$$;

grant execute on function public.get_communication_contacts() to authenticated;

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  row_id text;
begin
  row_id := coalesce(to_jsonb(new)->>'id', to_jsonb(old)->>'id');
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
  values (
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    row_id,
    case when tg_op = 'DELETE' then jsonb_build_object('old', to_jsonb(old))
         when tg_op = 'INSERT' then jsonb_build_object('new', to_jsonb(new))
         else jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new))
    end
  );
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'courses', 'lessons', 'assignments', 'submissions', 'quizzes',
    'profiles', 'course_discussions', 'discussion_replies',
    'platform_announcements', 'moderation_flags'
  ]
  loop
    execute format('drop trigger if exists audit_%I_changes on public.%I', table_name, table_name);
    execute format(
      'create trigger audit_%I_changes after insert or update or delete on public.%I for each row execute function public.audit_row_change()',
      table_name,
      table_name
    );
  end loop;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'direct_messages', 'course_discussions', 'discussion_replies',
    'platform_announcements', 'profiles', 'courses', 'lessons',
    'enrollments', 'lesson_progress', 'attempts', 'submissions', 'audit_logs'
  ]
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end;
$$;
