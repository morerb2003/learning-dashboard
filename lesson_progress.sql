-- ==========================================
-- LESSON PROGRESS TRACKING
-- ==========================================
-- Run this in Supabase SQL Editor.
-- Tracks per-user, per-lesson completion state.

CREATE TABLE IF NOT EXISTS public.lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    UNIQUE (user_id, lesson_id)
);

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- Users can read their own progress rows
DROP POLICY IF EXISTS "Users can read own lesson progress" ON public.lesson_progress;
CREATE POLICY "Users can read own lesson progress"
ON public.lesson_progress
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own progress rows
DROP POLICY IF EXISTS "Users can insert own lesson progress" ON public.lesson_progress;
CREATE POLICY "Users can insert own lesson progress"
ON public.lesson_progress
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own progress rows
DROP POLICY IF EXISTS "Users can update own lesson progress" ON public.lesson_progress;
CREATE POLICY "Users can update own lesson progress"
ON public.lesson_progress
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete their own progress rows
DROP POLICY IF EXISTS "Users can delete own lesson progress" ON public.lesson_progress;
CREATE POLICY "Users can delete own lesson progress"
ON public.lesson_progress
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Admins can view all progress rows
DROP POLICY IF EXISTS "Admins can view all lesson progress" ON public.lesson_progress;
CREATE POLICY "Admins can view all lesson progress"
ON public.lesson_progress
FOR SELECT
TO authenticated
USING (public.is_admin());
