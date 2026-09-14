import { createClient } from "@/lib/supabase/server";
import { UserSettings, UserSettingsResponse } from "@/types/settings";

export const defaultUserSettings = (userId: string): UserSettings => ({
  user_id: userId,

  // Appearance
  theme: "dark",
  accent_color: "violet",
  layout_density: "comfortable",
  reduce_animations: false,
  font_size: "normal",

  // Notifications
  email_notifications: true,
  in_app_notifications: true,
  course_updates: true,
  quiz_reminders: true,
  certificate_alerts: true,
  new_course_alerts: true,
  payment_alerts: true,
  messages_alerts: true,
  announcements_alerts: true,
  notification_frequency: "instant",

  // Privacy
  profile_visibility: "public",
  show_learning_progress: true,
  show_certificates: true,
  show_achievements: true,
  show_online_status: true,
  allow_discovery: true,
  data_sharing: false,

  // Language & Region
  language: "en",
  country: "US",
  timezone: "UTC",
  date_format: "MMM D, YYYY",
  currency: "USD",

  // Accessibility
  keyboard_navigation: true,
  reduced_motion: false,
  high_contrast: false,
  screen_reader_cues: false,
  text_scaling: 100,

  // Student Preferences
  difficulty_preference: "all",
  daily_study_target_minutes: 30,
  daily_reminder_time: "19:00",
  preferred_subjects: ["Web Development", "Computer Science", "Cloud Architecture"],
  course_recommendations: true,

  // Teacher Preferences
  teaching_mode: "online",
  teaching_available_hours: 20,
  student_capacity: 250,
  auto_approve_enrollment: true,
  allow_student_messaging: true,
  payout_notification_threshold: 100.0,
  preferred_payout_method: "bank_transfer",
  payout_account_info: {
    account_name: "",
    account_number: "",
    bank_name: "",
    routing_or_ifsc: "",
  },

  // Admin Preferences
  maintenance_notifications: true,
  audit_logging_level: "detailed",
});

export async function getUserSettings(userId: string): Promise<UserSettingsResponse | null> {
  const supabase = await createClient();

  // 1. Fetch user base profile to get name, email, role, username
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, username")
    .eq("id", userId)
    .single();

  if (!profile) return null;

  // 2. Fetch user settings
  const { data: settingsData } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const defaults = defaultUserSettings(userId);
  const settings: UserSettings = settingsData ? { ...defaults, ...settingsData } : defaults;

  return {
    settings,
    userEmail: profile.email || "",
    userFullName: profile.full_name || profile.email?.split("@")[0] || "User",
    userRole: profile.role || "student",
    username: profile.username || undefined,
  };
}
