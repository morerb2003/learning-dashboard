-- Teacher course management migration.
-- Run this in Supabase SQL Editor after the base schema.

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

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('teacher', 'admin')
  );
$$;

REVOKE ALL ON FUNCTION public.is_teacher() FROM public;
GRANT EXECUTE ON FUNCTION public.is_teacher() TO authenticated;

DROP POLICY IF EXISTS "Teachers can create own courses" ON public.courses;
CREATE POLICY "Teachers can create own courses"
ON public.courses
FOR INSERT
TO authenticated
WITH CHECK (
    teacher_id = auth.uid()
    AND public.is_teacher()
);

DROP POLICY IF EXISTS "Teachers can view own courses" ON public.courses;
CREATE POLICY "Teachers can view own courses"
ON public.courses
FOR SELECT
TO authenticated
USING (
    teacher_id = auth.uid()
    AND public.is_teacher()
);

DROP POLICY IF EXISTS "Teachers can update own courses" ON public.courses;
CREATE POLICY "Teachers can update own courses"
ON public.courses
FOR UPDATE
TO authenticated
USING (
    teacher_id = auth.uid()
    AND public.is_teacher()
)
WITH CHECK (
    teacher_id = auth.uid()
    AND public.is_teacher()
);

DROP POLICY IF EXISTS "Teachers can delete own courses" ON public.courses;
CREATE POLICY "Teachers can delete own courses"
ON public.courses
FOR DELETE
TO authenticated
USING (
    teacher_id = auth.uid()
    AND public.is_teacher()
);

DROP POLICY IF EXISTS "Teachers can manage lessons for own courses" ON public.lessons;
CREATE POLICY "Teachers can manage lessons for own courses"
ON public.lessons
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.courses
        WHERE courses.id = lessons.course_id
          AND courses.teacher_id = auth.uid()
    )
    AND public.is_teacher()
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.courses
        WHERE courses.id = lessons.course_id
          AND courses.teacher_id = auth.uid()
    )
    AND public.is_teacher()
);

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
