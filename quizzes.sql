-- Quiz system schema for AURA LMS

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  title text not null,
  description text,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question_text text not null,
  question_type text not null check (question_type in ('mcq', 'true_false')),
  options jsonb not null default '[]'::jsonb,
  correct_answer text not null,
  points integer not null default 1 check (points > 0),
  question_order integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  score integer not null default 0,
  total_score integer not null default 0,
  status text not null default 'completed' check (status in ('completed')),
  submitted_at timestamptz not null default now()
);

create unique index if not exists attempts_quiz_student_key
  on public.attempts (quiz_id, student_id);

alter table public.quizzes enable row level security;
alter table public.questions enable row level security;
alter table public.attempts enable row level security;

drop policy if exists "Teachers can manage their quizzes" on public.quizzes;
create policy "Teachers can manage their quizzes"
on public.quizzes
for all
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (p.role = 'teacher' or p.role = 'admin')
      and (p.role = 'admin' or p.id = quizzes.teacher_id)
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (p.role = 'teacher' or p.role = 'admin')
      and (p.role = 'admin' or p.id = quizzes.teacher_id)
  )
);

drop policy if exists "Students can read published quizzes" on public.quizzes;
create policy "Students can read published quizzes"
on public.quizzes
for select
using (
  is_published = true
  and (
    course_id is null
    or exists (
      select 1
      from public.enrollments e
      where e.user_id = auth.uid()
        and e.course_id = quizzes.course_id
    )
  )
);

drop policy if exists "Teachers can manage quiz questions" on public.questions;
create policy "Teachers can manage quiz questions"
on public.questions
for all
using (
  exists (
    select 1
    from public.quizzes q
    join public.profiles p on p.id = auth.uid()
    where q.id = questions.quiz_id
      and (p.role = 'teacher' or p.role = 'admin')
      and (p.role = 'admin' or q.teacher_id = p.id)
  )
)
with check (
  exists (
    select 1
    from public.quizzes q
    join public.profiles p on p.id = auth.uid()
    where q.id = questions.quiz_id
      and (p.role = 'teacher' or p.role = 'admin')
      and (p.role = 'admin' or q.teacher_id = p.id)
  )
);

drop policy if exists "Students can read quiz questions" on public.questions;
create policy "Students can read quiz questions"
on public.questions
for select
using (
  exists (
    select 1
    from public.quizzes q
    where q.id = questions.quiz_id
      and q.is_published = true
      and (
        q.course_id is null
        or exists (
          select 1
          from public.enrollments e
          where e.user_id = auth.uid()
            and e.course_id = q.course_id
        )
      )
  )
);

drop policy if exists "Students can manage their attempts" on public.attempts;
create policy "Students can manage their attempts"
on public.attempts
for all
using (student_id = auth.uid())
with check (student_id = auth.uid());

drop policy if exists "Teachers can read quiz attempts" on public.attempts;
create policy "Teachers can read quiz attempts"
on public.attempts
for select
using (
  exists (
    select 1
    from public.quizzes q
    join public.profiles p on p.id = auth.uid()
    where q.id = attempts.quiz_id
      and (p.role = 'teacher' or p.role = 'admin')
      and (p.role = 'admin' or q.teacher_id = p.id)
  )
);
