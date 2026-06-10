-- Professional feature expansion for AURA LMS.
-- Run once in the Supabase SQL Editor after the existing schema files.

create table if not exists public.course_reviews (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  review text not null check (char_length(review) between 3 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, student_id)
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  certificate_number text not null unique
    default ('AURA-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  issued_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  href text,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

alter table public.course_reviews enable row level security;
alter table public.certificates enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "Authenticated users can read course reviews" on public.course_reviews;
create policy "Authenticated users can read course reviews"
on public.course_reviews for select
to authenticated
using (true);

drop policy if exists "Students can create enrolled course reviews" on public.course_reviews;
create policy "Students can create enrolled course reviews"
on public.course_reviews for insert
to authenticated
with check (
  student_id = auth.uid()
  and exists (
    select 1 from public.enrollments e
    where e.user_id = auth.uid() and e.course_id = course_reviews.course_id
  )
);

drop policy if exists "Students can update own course reviews" on public.course_reviews;
create policy "Students can update own course reviews"
on public.course_reviews for update
to authenticated
using (student_id = auth.uid())
with check (student_id = auth.uid());

drop policy if exists "Students can delete own course reviews" on public.course_reviews;
create policy "Students can delete own course reviews"
on public.course_reviews for delete
to authenticated
using (student_id = auth.uid());

drop policy if exists "Users can read own certificates" on public.certificates;
create policy "Users can read own certificates"
on public.certificates for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users can issue completed course certificates" on public.certificates;
create policy "Users can issue completed course certificates"
on public.certificates for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.enrollments e
    where e.user_id = auth.uid()
      and e.course_id = certificates.course_id
      and e.progress >= 100
  )
);

drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications"
on public.notifications for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
on public.notifications for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own notifications" on public.notifications;
create policy "Users can delete own notifications"
on public.notifications for delete
to authenticated
using (user_id = auth.uid());

create or replace function public.touch_course_review_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists course_reviews_touch_updated_at on public.course_reviews;
create trigger course_reviews_touch_updated_at
before update on public.course_reviews
for each row execute function public.touch_course_review_updated_at();

create or replace function public.notify_assignment_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assignment_title text;
begin
  if new.status = 'reviewed'
     and (old.status is distinct from new.status or old.grade is distinct from new.grade) then
    select title into assignment_title
    from public.assignments
    where id = new.assignment_id;

    insert into public.notifications (user_id, type, title, message, href, metadata)
    values (
      new.student_id,
      'assignment_reviewed',
      'Assignment reviewed',
      coalesce(assignment_title, 'Your assignment') ||
        case when new.grade is null then ' has new feedback.' else ' was graded ' || new.grade || '.' end,
      '/learning/assignments',
      jsonb_build_object('assignment_id', new.assignment_id, 'submission_id', new.id)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists submissions_notify_review on public.submissions;
create trigger submissions_notify_review
after update on public.submissions
for each row execute function public.notify_assignment_review();

create or replace function public.notify_quiz_result()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  quiz_title text;
begin
  select title into quiz_title from public.quizzes where id = new.quiz_id;
  insert into public.notifications (user_id, type, title, message, href, metadata)
  values (
    new.student_id,
    'quiz_result',
    'Quiz result ready',
    coalesce(quiz_title, 'Quiz') || ': ' || new.score || '/' || new.total_score || ' points.',
    '/learning/quizzes',
    jsonb_build_object('quiz_id', new.quiz_id, 'attempt_id', new.id)
  );
  return new;
end;
$$;

drop trigger if exists attempts_notify_result on public.attempts;
create trigger attempts_notify_result
after insert on public.attempts
for each row execute function public.notify_quiz_result();

create or replace function public.notify_teacher_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role = 'pending_teacher' and new.role = 'teacher' then
    insert into public.notifications (user_id, type, title, message, href)
    values (
      new.id,
      'teacher_approved',
      'Teacher access approved',
      'Your teacher workspace is ready.',
      '/teacher'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_notify_teacher_approval on public.profiles;
create trigger profiles_notify_teacher_approval
after update of role on public.profiles
for each row execute function public.notify_teacher_approval();

create or replace function public.notify_new_lesson()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  course_title text;
begin
  select title into course_title from public.courses where id = new.course_id;
  insert into public.notifications (user_id, type, title, message, href, metadata)
  select
    e.user_id,
    'new_lesson',
    'New lesson available',
    new.title || ' was added to ' || coalesce(course_title, 'your course') || '.',
    '/course/' || new.course_id || '/lesson/' || new.id,
    jsonb_build_object('course_id', new.course_id, 'lesson_id', new.id)
  from public.enrollments e
  where e.course_id = new.course_id;
  return new;
end;
$$;

drop trigger if exists lessons_notify_enrolled_students on public.lessons;
create trigger lessons_notify_enrolled_students
after insert on public.lessons
for each row execute function public.notify_new_lesson();

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;
