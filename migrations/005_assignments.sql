-- ==============================================================================
-- Migration: 005_assignments.sql
-- Description: Assignments and student assignment submissions
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  instructions TEXT NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  max_grade INTEGER NOT NULL DEFAULT 100 CHECK (max_grade > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed')),
  grade INTEGER,
  feedback TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS submissions_assignment_student_key
  ON public.submissions (assignment_id, student_id);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view assignments" ON public.assignments;
CREATE POLICY "Anyone can view assignments"
ON public.assignments FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Students can view and submit assignments" ON public.submissions;
CREATE POLICY "Students can view and submit assignments"
ON public.submissions FOR ALL TO authenticated
USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin')))
WITH CHECK (student_id = auth.uid());
