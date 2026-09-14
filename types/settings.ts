export type ThemeMode = "dark" | "light" | "system";
export type AccentColor = "violet" | "cyan" | "sky" | "emerald" | "rose" | "amber";
export type LayoutDensity = "comfortable" | "compact";
export type FontSizeOption = "small" | "normal" | "large";
export type NotificationFrequency = "instant" | "daily" | "weekly";

export interface UserSettings {
  user_id: string;

  // Appearance
  theme: ThemeMode;
  accent_color: AccentColor;
  layout_density: LayoutDensity;
  reduce_animations: boolean;
  font_size: FontSizeOption;

  // Notifications
  email_notifications: boolean;
  in_app_notifications: boolean;
  course_updates: boolean;
  quiz_reminders: boolean;
  certificate_alerts: boolean;
  new_course_alerts: boolean;
  payment_alerts: boolean;
  messages_alerts: boolean;
  announcements_alerts: boolean;
  notification_frequency: NotificationFrequency;

  // Privacy
  profile_visibility: "public" | "students_only" | "private";
  show_learning_progress: boolean;
  show_certificates: boolean;
  show_achievements: boolean;
  show_online_status: boolean;
  allow_discovery: boolean;
  data_sharing: boolean;

  // Language & Region
  language: string;
  country: string;
  timezone: string;
  date_format: string;
  currency: string;

  // Accessibility
  keyboard_navigation: boolean;
  reduced_motion: boolean;
  high_contrast: boolean;
  screen_reader_cues: boolean;
  text_scaling: number;

  // Student Preferences
  difficulty_preference: "beginner" | "intermediate" | "advanced" | "all";
  daily_study_target_minutes: number;
  daily_reminder_time: string;
  preferred_subjects: string[];
  course_recommendations: boolean;

  // Teacher Preferences
  teaching_mode: "online" | "offline" | "hybrid";
  teaching_available_hours: number;
  student_capacity: number;
  auto_approve_enrollment: boolean;
  allow_student_messaging: boolean;
  payout_notification_threshold: number;
  preferred_payout_method: "bank_transfer" | "stripe" | "paypal" | "upi";
  payout_account_info: {
    account_name?: string;
    account_number?: string;
    bank_name?: string;
    routing_or_ifsc?: string;
    upi_id?: string;
  };

  // Admin Preferences
  maintenance_notifications?: boolean;
  audit_logging_level?: "standard" | "detailed" | "verbose";

  created_at?: string;
  updated_at?: string;
}

export interface UserSettingsResponse {
  settings: UserSettings;
  userEmail: string;
  userFullName: string;
  userRole: string;
  username?: string;
}
