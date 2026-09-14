-- ============================================================================
-- AURA LEARNING DASHBOARD: USER SETTINGS V2 MIGRATION
-- Creates public.user_settings table for personalized, role-based settings.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- 1. Appearance
    theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'system')),
    accent_color TEXT DEFAULT 'violet' CHECK (accent_color IN ('violet', 'cyan', 'sky', 'emerald', 'rose', 'amber')),
    layout_density TEXT DEFAULT 'comfortable' CHECK (layout_density IN ('comfortable', 'compact')),
    reduce_animations BOOLEAN DEFAULT false,
    font_size TEXT DEFAULT 'normal' CHECK (font_size IN ('small', 'normal', 'large')),

    -- 2. Notifications
    email_notifications BOOLEAN DEFAULT true,
    in_app_notifications BOOLEAN DEFAULT true,
    course_updates BOOLEAN DEFAULT true,
    quiz_reminders BOOLEAN DEFAULT true,
    certificate_alerts BOOLEAN DEFAULT true,
    new_course_alerts BOOLEAN DEFAULT true,
    payment_alerts BOOLEAN DEFAULT true,
    messages_alerts BOOLEAN DEFAULT true,
    announcements_alerts BOOLEAN DEFAULT true,
    notification_frequency TEXT DEFAULT 'instant' CHECK (notification_frequency IN ('instant', 'daily', 'weekly')),

    -- 3. Privacy
    profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'students_only', 'private')),
    show_learning_progress BOOLEAN DEFAULT true,
    show_certificates BOOLEAN DEFAULT true,
    show_achievements BOOLEAN DEFAULT true,
    show_online_status BOOLEAN DEFAULT true,
    allow_discovery BOOLEAN DEFAULT true,
    data_sharing BOOLEAN DEFAULT false,

    -- 4. Language & Region
    language TEXT DEFAULT 'en',
    country TEXT DEFAULT 'US',
    timezone TEXT DEFAULT 'UTC',
    date_format TEXT DEFAULT 'MMM D, YYYY',
    currency TEXT DEFAULT 'USD',

    -- 5. Accessibility
    keyboard_navigation BOOLEAN DEFAULT true,
    reduced_motion BOOLEAN DEFAULT false,
    high_contrast BOOLEAN DEFAULT false,
    screen_reader_cues BOOLEAN DEFAULT false,
    text_scaling INTEGER DEFAULT 100 CHECK (text_scaling >= 80 AND text_scaling <= 150),

    -- 6. Student Specific Preferences
    difficulty_preference TEXT DEFAULT 'all' CHECK (difficulty_preference IN ('beginner', 'intermediate', 'advanced', 'all')),
    daily_study_target_minutes INTEGER DEFAULT 30 CHECK (daily_study_target_minutes >= 5 AND daily_study_target_minutes <= 480),
    daily_reminder_time TEXT DEFAULT '19:00',
    preferred_subjects TEXT[] DEFAULT '{}',
    course_recommendations BOOLEAN DEFAULT true,

    -- 7. Teacher Specific Preferences
    teaching_mode TEXT DEFAULT 'online' CHECK (teaching_mode IN ('online', 'offline', 'hybrid')),
    teaching_available_hours INTEGER DEFAULT 20,
    student_capacity INTEGER DEFAULT 250,
    auto_approve_enrollment BOOLEAN DEFAULT true,
    allow_student_messaging BOOLEAN DEFAULT true,
    payout_notification_threshold NUMERIC(10,2) DEFAULT 100.00,
    preferred_payout_method TEXT DEFAULT 'bank_transfer' CHECK (preferred_payout_method IN ('bank_transfer', 'stripe', 'paypal', 'upi')),
    payout_account_info JSONB DEFAULT '{"account_name": "", "account_number": "", "bank_name": "", "routing_or_ifsc": ""}'::jsonb,

    -- 8. Admin Specific Preferences
    maintenance_notifications BOOLEAN DEFAULT true,
    audit_logging_level TEXT DEFAULT 'detailed' CHECK (audit_logging_level IN ('standard', 'detailed', 'verbose')),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own settings" ON public.user_settings;
CREATE POLICY "Users can read own settings"
ON public.user_settings FOR SELECT TO authenticated
USING (user_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
CREATE POLICY "Users can update own settings"
ON public.user_settings FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
CREATE POLICY "Users can insert own settings"
ON public.user_settings FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Provision default settings for existing profiles
INSERT INTO public.user_settings (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;
