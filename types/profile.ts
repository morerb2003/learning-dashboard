export type ProfileRole = "student" | "pending_teacher" | "teacher" | "admin";

export interface BaseProfile {
  id: string;
  full_name: string | null;
  username?: string | null;
  email: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  role: ProfileRole;
  created_at?: string;
  updated_at?: string;
}

export interface StudentProfile {
  user_id: string;
  date_of_birth?: string | null;
  gender?: string | null;
  learning_goals: string[];
  skills: string[];
  preferred_language: string;
  learning_streak: number;
  profile_visibility: "public" | "students_only" | "private";
  show_learning_progress: boolean;
  show_certificates: boolean;
  show_achievements: boolean;
  notification_preferences: {
    email: boolean;
    course_updates: boolean;
    quiz_reminders: boolean;
    community_activity: boolean;
  };
  created_at?: string;
  updated_at?: string;
}

export type TeacherVerificationStatus = "pending" | "verified" | "rejected" | "suspended";

export interface TeacherProfile {
  user_id: string;
  headline: string;
  expertise: string[];
  experience_years: number;
  organization?: string | null;
  previous_organizations: string[];
  education?: string | null;
  certifications: string[];
  teaching_experience?: string | null;
  teaching_style?: string | null;
  preferred_categories: string[];
  available_hours: number;
  student_capacity: number;
  delivery_preference: "online" | "offline" | "hybrid";
  rating: number;
  reviews_count: number;
  total_students_count: number;
  total_courses_count: number;
  verification_status: TeacherVerificationStatus;
  identity_verified: boolean;
  qualification_verified: boolean;
  certification_verified: boolean;
  created_at?: string;
  updated_at?: string;
}

export type AdminRoleType =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "MODERATOR"
  | "SUPPORT_ADMIN"
  | "CONTENT_ADMIN"
  | "FINANCE_ADMIN";

export interface AdminPermissions {
  user_management: boolean;
  teacher_management: boolean;
  course_management: boolean;
  payments: boolean;
  subscriptions: boolean;
  reports: boolean;
  analytics: boolean;
  moderation: boolean;
  system_settings: boolean;
  audit_logs: boolean;
}

export interface AdminProfile {
  user_id: string;
  designation: string;
  department: string;
  admin_role: AdminRoleType;
  permissions: AdminPermissions;
  security_level: string;
  recovery_email?: string | null;
  two_factor_enabled: boolean;
  last_login_ip?: string | null;
  last_login_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StudentOverviewStats {
  enrolledCoursesCount: number;
  completedCoursesCount: number;
  inProgressCoursesCount: number;
  learningHours: number;
  overallProgress: number;
  certificatesEarnedCount: number;
  currentStreak: number;
  averageQuizScore: number;
}

export interface TeacherOverviewStats {
  totalCourses: number;
  totalStudents: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
  completionRate: number;
  availableBalance: number;
  pendingEarnings: number;
}

export interface FullProfileData {
  base: BaseProfile;
  student?: StudentProfile | null;
  teacher?: TeacherProfile | null;
  admin?: AdminProfile | null;
  studentStats?: StudentOverviewStats | null;
  teacherStats?: TeacherOverviewStats | null;
  enrolledCourses?: Array<{
    id: string;
    title: string;
    category?: string | null;
    progress: number;
    thumbnail_url?: string | null;
    last_accessed_at?: string | null;
  }>;
  certificates?: Array<{
    id: string;
    certificate_number: string;
    course_title: string;
    issued_at: string;
  }>;
  teacherCourses?: Array<{
    id: string;
    title: string;
    category?: string | null;
    is_published: boolean;
    price: number;
    created_at: string;
  }>;
  recentAuditLogs?: Array<{
    id: number;
    action: string;
    entity_type: string;
    created_at: string;
    details?: any;
  }>;
}
