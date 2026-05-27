-- 1. Create the courses table matching the requested schema
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    progress INTEGER NOT NULL CHECK (progress >= 0 AND progress <= 100),
    icon_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- 3. Create a policy to allow public read access (RSC select)
-- Without this, fetching from the server using the anon key will return 0 rows
CREATE POLICY "Enable read access for all users" 
ON public.courses 
FOR SELECT 
USING (true);

-- 4. Clean existing rows to avoid duplicates on re-run
TRUNCATE TABLE public.courses;

-- 5. Insert mock seed data
INSERT INTO public.courses (title, progress, icon_name) VALUES
('Advanced React Patterns', 75, 'Atom'),
('Next.js App Router Architecture', 40, 'Network'),
('Framer Motion Animations', 90, 'Sparkles'),
('Supabase & Postgres Masterclass', 15, 'Database');

-- Notes Table
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.notes FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable delete access for all users" ON public.notes FOR DELETE USING (true);

TRUNCATE TABLE public.notes;

INSERT INTO public.notes (title, content) VALUES
('Dashboard UI Design', 'We need to make sure the bento grid is responsive across all mobile devices. The mesh gradients look great!'),
('Next JS Routing', 'Remember to use force-dynamic for the dashboard page so the server fetches latest data directly from supabase.'),
('Supabase RLS', 'Row Level Security is enabled. Right now policies allow anon select, insert, and delete to keep prototype interactive without full auth setup.');
