-- ==============================================================================
-- Migration: 010_notifications.sql
-- Description: In-app notifications, community discussions, and course reviews
-- ==============================================================================

-- 1. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  href TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Course Reviews Table
CREATE TABLE IF NOT EXISTS public.course_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, student_id)
);

-- 3. Discussions Table
CREATE TABLE IF NOT EXISTS public.discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Discussion Replies Table
CREATE TABLE IF NOT EXISTS public.discussion_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES public.discussions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussions_course_id ON public.discussions(course_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can view course reviews" ON public.course_reviews;
CREATE POLICY "Anyone can view course reviews"
ON public.course_reviews FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Anyone can view discussions" ON public.discussions;
CREATE POLICY "Anyone can view discussions"
ON public.discussions FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated users can create discussions" ON public.discussions;
CREATE POLICY "Authenticated users can create discussions"
ON public.discussions FOR INSERT TO authenticated
WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can view discussion replies" ON public.discussion_replies;
CREATE POLICY "Anyone can view discussion replies"
ON public.discussion_replies FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated users can reply to discussions" ON public.discussion_replies;
CREATE POLICY "Authenticated users can reply to discussions"
ON public.discussion_replies FOR INSERT TO authenticated
WITH CHECK (author_id = auth.uid());
