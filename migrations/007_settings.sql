-- ==============================================================================
-- Migration: 007_settings.sql
-- Description: Complete User Settings schema with 38 categorized preferences
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- 1. Appearance
    theme TEXT NOT NULL DEFAULT 'dark',
    accent_color TEXT NOT NULL DEFAULT 'violet',
    layout_density TEXT NOT NULL DEFAULT 'comfortable',
    reduce_animations BOOLEAN DEFAULT false,
    font_size TEXT NOT NULL DEFAULT 'normal',

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
    notification_frequency TEXT NOT NULL DEFAULT 'instant',

    -- 3. Privacy
    profile_visibility TEXT NOT NULL DEFAULT 'public',
    show_learning_progress BOOLEAN DEFAULT true,
    show_certificates BOOLEAN DEFAULT true,
    show_achievements BOOLEAN DEFAULT true,
    show_online_status BOOLEAN DEFAULT true,
    allow_discovery BOOLEAN DEFAULT true,
    data_sharing BOOLEAN DEFAULT false,

    -- 4. Language & Region
    language TEXT NOT NULL DEFAULT 'en',
    country TEXT NOT NULL DEFAULT 'US',
    timezone TEXT NOT NULL DEFAULT 'UTC',
    date_format TEXT NOT NULL DEFAULT 'MMM D, YYYY',
    currency TEXT NOT NULL DEFAULT 'USD',

    -- 5. Accessibility
    keyboard_navigation BOOLEAN DEFAULT true,
    reduced_motion BOOLEAN DEFAULT false,
    high_contrast BOOLEAN DEFAULT false,
    screen_reader_cues BOOLEAN DEFAULT false,
    text_scaling INTEGER DEFAULT 100,

    -- 6. Student Preferences
    difficulty_preference TEXT NOT NULL DEFAULT 'all',
    daily_study_target_minutes INTEGER DEFAULT 30,
    daily_reminder_time TEXT DEFAULT '19:00',
    preferred_subjects JSONB DEFAULT '["Web Development", "Computer Science", "Cloud Architecture"]'::jsonb,
    course_recommendations BOOLEAN DEFAULT true,

    -- 7. Teacher Preferences
    teaching_mode TEXT DEFAULT 'online',
    teaching_available_hours INTEGER DEFAULT 20,
    student_capacity INTEGER DEFAULT 250,
    auto_approve_enrollment BOOLEAN DEFAULT true,
    allow_student_messaging BOOLEAN DEFAULT true,
    payout_notification_threshold NUMERIC(10, 2) DEFAULT 100.00,
    preferred_payout_method TEXT DEFAULT 'bank_transfer',
    payout_account_info JSONB DEFAULT '{}'::jsonb,

    -- 8. Admin Preferences
    maintenance_notifications BOOLEAN DEFAULT true,
    audit_logging_level TEXT DEFAULT 'detailed',

    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own settings" ON public.user_settings;
CREATE POLICY "Users can read own settings"
ON public.user_settings FOR SELECT TO authenticated
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
CREATE POLICY "Users can insert own settings"
ON public.user_settings FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
CREATE POLICY "Users can update own settings"
ON public.user_settings FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
