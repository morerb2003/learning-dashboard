-- Assignment system schema for AURA LMS

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  title text not null,
  instructions text not null,
  deadline timestamptz not null,
  max_grade integer not null default 100 check (max_grade > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  file_url text not null,
  file_path text not null,
  status text not null default 'submitted' check (status in ('submitted', 'reviewed')),
  grade integer,
  feedback text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create unique index if not exists submissions_assignment_student_key
  on public.submissions (assignment_id, student_id);

alter table public.assignments enable row level security;
alter table public.submissions enable row level security;

drop policy if exists "Teachers can manage their assignments" on public.assignments;
create policy "Teachers can manage their assignments"
on public.assignments
for all
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (p.role = 'teacher' or p.role = 'admin')
      and (p.role = 'admin' or p.id = assignments.teacher_id)
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (p.role = 'teacher' or p.role = 'admin')
      and (p.role = 'admin' or p.id = assignments.teacher_id)
  )
);

drop policy if exists "Students can read visible assignments" on public.assignments;
create policy "Students can read visible assignments"
on public.assignments
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and (p.role = 'teacher' or p.role = 'admin')
  )
  or course_id is null
  or exists (
    select 1
    from public.enrollments e
    where e.user_id = auth.uid()
      and e.course_id = assignments.course_id
  )
);

drop policy if exists "Students can manage their submissions" on public.submissions;
create policy "Students can manage their submissions"
on public.submissions
for all
using (student_id = auth.uid())
with check (student_id = auth.uid());

drop policy if exists "Teachers can review submissions" on public.submissions;
create policy "Teachers can review submissions"
on public.submissions
for select
using (
  exists (
    select 1
    from public.assignments a
    join public.profiles p on p.id = auth.uid()
    where a.id = submissions.assignment_id
      and (p.role = 'teacher' or p.role = 'admin')
      and (p.role = 'admin' or a.teacher_id = p.id)
  )
);

drop policy if exists "Teachers can update submissions" on public.submissions;
create policy "Teachers can update submissions"
on public.submissions
for update
using (
  exists (
    select 1
    from public.assignments a
    join public.profiles p on p.id = auth.uid()
    where a.id = submissions.assignment_id
      and (p.role = 'teacher' or p.role = 'admin')
      and (p.role = 'admin' or a.teacher_id = p.id)
  )
)
with check (
  exists (
    select 1
    from public.assignments a
    join public.profiles p on p.id = auth.uid()
    where a.id = submissions.assignment_id
      and (p.role = 'teacher' or p.role = 'admin')
      and (p.role = 'admin' or a.teacher_id = p.id)
  )
);

insert into storage.buckets (id, name, public)
values ('assignment-submissions', 'assignment-submissions', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "Assignment submissions are publicly readable" on storage.objects;
create policy "Assignment submissions are publicly readable"
on storage.objects
for select
using (bucket_id = 'assignment-submissions');

drop policy if exists "Authenticated users can upload assignment submissions" on storage.objects;
create policy "Authenticated users can upload assignment submissions"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'assignment-submissions');
