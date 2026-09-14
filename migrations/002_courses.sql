-- ==============================================================================
-- Migration: 002_courses.sql
-- Description: Course catalog, modules, lessons, and teacher publishing policies
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    category TEXT DEFAULT 'General',
    level TEXT DEFAULT 'All Levels',
    price NUMERIC(10, 2) DEFAULT 0.00,
    is_published BOOLEAN DEFAULT false,
    duration_hours NUMERIC(5, 1) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS teacher_id UUID;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'All Levels';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS duration_hours NUMERIC(5, 1) DEFAULT 0.0;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Modules Table
CREATE TABLE IF NOT EXISTS public.course_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Lessons Table
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    module_id UUID REFERENCES public.course_modules(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT,
    video_url TEXT,
    duration_minutes INTEGER DEFAULT 15,
    order_index INTEGER DEFAULT 0,
    is_free_preview BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON public.courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_is_published ON public.courses(is_published);
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON public.lessons(course_id);

-- RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published courses" ON public.courses;
CREATE POLICY "Public can view published courses"
ON public.courses FOR SELECT
USING (is_published = true OR auth.uid() = teacher_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Teachers can insert courses" ON public.courses;
CREATE POLICY "Teachers can insert courses"
ON public.courses FOR INSERT TO authenticated
WITH CHECK (
    auth.uid() = teacher_id AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
);

DROP POLICY IF EXISTS "Teachers can update own courses" ON public.courses;
CREATE POLICY "Teachers can update own courses"
ON public.courses FOR UPDATE TO authenticated
USING (auth.uid() = teacher_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (auth.uid() = teacher_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Anyone can view lessons for available courses" ON public.lessons;
CREATE POLICY "Anyone can view lessons for available courses"
ON public.lessons FOR SELECT
USING (true);
