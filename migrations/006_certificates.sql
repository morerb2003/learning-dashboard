-- ==============================================================================
-- Migration: 006_certificates.sql
-- Description: Course completion certificates and verification tokens
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  certificate_number TEXT NOT NULL UNIQUE
    DEFAULT ('AURA-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course_id ON public.certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_number ON public.certificates(certificate_number);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own certificates" ON public.certificates;
CREATE POLICY "Users can read own certificates"
ON public.certificates FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Users can issue completed course certificates" ON public.certificates;
CREATE POLICY "Users can issue completed course certificates"
ON public.certificates FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.user_id = auth.uid()
      AND e.course_id = certificates.course_id
      AND e.progress >= 100
  )
);
