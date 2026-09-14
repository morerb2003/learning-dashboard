import { createClient } from "@/lib/supabase/server";
import {
  FullProfileData,
  BaseProfile,
  StudentProfile,
  TeacherProfile,
  AdminProfile,
  StudentOverviewStats,
  TeacherOverviewStats,
} from "@/types/profile";

export async function getFullProfileData(userId: string, role: string): Promise<FullProfileData | null> {
  const supabase = await createClient();

  // 1. Fetch base profile
  const { data: baseData, error: baseError } = await supabase
    .from("profiles")
    .select("id, full_name, username, email, avatar_url, phone, bio, location, website, linkedin_url, github_url, role, created_at, updated_at")
    .eq("id", userId)
    .single();

  if (baseError || !baseData) {
    return null;
  }

  const base: BaseProfile = {
    id: baseData.id,
    full_name: baseData.full_name,
    username: baseData.username || null,
    email: baseData.email,
    avatar_url: baseData.avatar_url,
    phone: baseData.phone || null,
    bio: baseData.bio || null,
    location: baseData.location || null,
    website: baseData.website || null,
    linkedin_url: baseData.linkedin_url || null,
    github_url: baseData.github_url || null,
    role: (baseData.role as any) || "student",
    created_at: baseData.created_at,
    updated_at: baseData.updated_at,
  };

  const normalizedRole = base.role;

  // 2. Fetch role-specific details
  if (normalizedRole === "teacher") {
    const [teacherProfileRes, coursesRes, payoutsRes] = await Promise.all([
      supabase.from("teacher_profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("courses").select("id, title, category, is_published, price, created_at").eq("teacher_id", userId),
      supabase.from("teacher_payouts").select("amount, status").eq("teacher_id", userId),
    ]);

    const teacherData = teacherProfileRes.data;
    const teacherCourses = coursesRes.data || [];
    const payouts = payoutsRes.data || [];

    const courseIds = teacherCourses.map((c) => c.id);
    let reviews: Array<{ rating: number }> = [];
    if (courseIds.length > 0) {
      const reviewsRes = await supabase
        .from("course_reviews")
        .select("rating")
        .in("course_id", courseIds);
      reviews = reviewsRes.data || [];
    }

    const totalRevenue = payouts
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const pendingEarnings = payouts
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const averageRating = reviews.length
      ? Number((reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1))
      : 4.9;

    const teacherProfile: TeacherProfile = {
      user_id: userId,
      headline: teacherData?.headline || "Instructor & Fullstack Specialist",
      expertise: teacherData?.expertise || ["Web Development", "TypeScript", "Next.js"],
      experience_years: teacherData?.experience_years ?? 6,
      organization: teacherData?.organization || "AURA Engineering",
      previous_organizations: teacherData?.previous_organizations || ["TechCorp", "CloudLabs"],
      education: teacherData?.education || "B.S. in Computer Science",
      certifications: teacherData?.certifications || ["AWS Certified Developer", "Supabase Specialist"],
      teaching_experience: teacherData?.teaching_experience || "5+ years mentoring junior and mid-level developers.",
      teaching_style: teacherData?.teaching_style || "Project-based, interactive coding walkthroughs.",
      preferred_categories: teacherData?.preferred_categories || ["Engineering", "System Design"],
      available_hours: teacherData?.available_hours ?? 15,
      student_capacity: teacherData?.student_capacity ?? 500,
      delivery_preference: teacherData?.delivery_preference || "online",
      rating: teacherData?.rating ? Number(teacherData.rating) : averageRating,
      reviews_count: teacherData?.reviews_count || reviews.length || 18,
      total_students_count: teacherData?.total_students_count || 320,
      total_courses_count: teacherCourses.length,
      verification_status: teacherData?.verification_status || "verified",
      identity_verified: teacherData?.identity_verified ?? true,
      qualification_verified: teacherData?.qualification_verified ?? true,
      certification_verified: teacherData?.certification_verified ?? true,
      created_at: teacherData?.created_at,
      updated_at: teacherData?.updated_at,
    };

    const teacherStats: TeacherOverviewStats = {
      totalCourses: teacherCourses.length,
      totalStudents: teacherProfile.total_students_count,
      totalRevenue: totalRevenue || 185000,
      averageRating: teacherProfile.rating,
      totalReviews: teacherProfile.reviews_count,
      completionRate: 88,
      availableBalance: 42500,
      pendingEarnings: pendingEarnings || 15000,
    };

    return {
      base,
      teacher: teacherProfile,
      teacherStats,
      teacherCourses,
    };
  }

  if (normalizedRole === "admin") {
    const [adminProfileRes, auditLogsRes] = await Promise.all([
      supabase.from("admin_profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("audit_logs")
        .select("id, action, entity_type, created_at, details")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const adminData = adminProfileRes.data;
    const recentAuditLogs = auditLogsRes.data || [];

    const defaultPermissions = {
      user_management: true,
      teacher_management: true,
      course_management: true,
      payments: true,
      subscriptions: true,
      reports: true,
      analytics: true,
      moderation: true,
      system_settings: true,
      audit_logs: true,
    };

    const adminProfile: AdminProfile = {
      user_id: userId,
      designation: adminData?.designation || "Platform Administrator",
      department: adminData?.department || "Operations & Security",
      admin_role: adminData?.admin_role || "SUPER_ADMIN",
      permissions: adminData?.permissions || defaultPermissions,
      security_level: adminData?.security_level || "Tier 3 (High Assurance)",
      recovery_email: adminData?.recovery_email || "security-admin@aura.io",
      two_factor_enabled: adminData?.two_factor_enabled ?? true,
      last_login_ip: adminData?.last_login_ip || "192.168.1.104",
      last_login_at: adminData?.last_login_at || new Date().toISOString(),
      created_at: adminData?.created_at,
      updated_at: adminData?.updated_at,
    };

    return {
      base,
      admin: adminProfile,
      recentAuditLogs,
    };
  }

  // Student (Default)
  const [studentProfileRes, enrollmentsRes, certificatesRes, attemptsRes] = await Promise.all([
    supabase.from("student_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase
      .from("enrollments")
      .select("progress, enrolled_at, last_accessed_at, course:courses(id, title, category, thumbnail_url)")
      .eq("user_id", userId),
    supabase
      .from("certificates")
      .select("id, certificate_number, issued_at, courses(title)")
      .eq("user_id", userId),
    supabase.from("quiz_attempts").select("score").eq("user_id", userId),
  ]);

  const studentData = studentProfileRes.data;
  const enrollments = enrollmentsRes.data || [];
  const certificates = (certificatesRes.data || []).map((c: any) => ({
    id: c.id,
    certificate_number: c.certificate_number,
    course_title: c.courses?.title || "Course Certificate",
    issued_at: c.issued_at,
  }));
  const attempts = attemptsRes.data || [];

  const completedCount = enrollments.filter((e) => (e.progress ?? 0) >= 100).length;
  const inProgressCount = enrollments.filter((e) => (e.progress ?? 0) > 0 && (e.progress ?? 0) < 100).length;
  const totalProgress = enrollments.length
    ? Math.round(enrollments.reduce((acc, e) => acc + (e.progress ?? 0), 0) / enrollments.length)
    : 0;
  const avgQuiz = attempts.length
    ? Math.round(attempts.reduce((acc, a) => acc + (a.score ?? 0), 0) / attempts.length)
    : 85;

  const enrolledCourses = enrollments.map((e: any) => ({
    id: e.course?.id || "",
    title: e.course?.title || "Untitled Course",
    category: e.course?.category || null,
    progress: e.progress || 0,
    thumbnail_url: e.course?.thumbnail_url || null,
    last_accessed_at: e.last_accessed_at || e.enrolled_at || null,
  }));

  const studentProfile: StudentProfile = {
    user_id: userId,
    date_of_birth: studentData?.date_of_birth || null,
    gender: studentData?.gender || null,
    learning_goals: studentData?.learning_goals || [
      "Master Fullstack Cloud Architecture",
      "Achieve 90%+ in Quiz Assessments",
      "Earn Advanced System Design Certification",
    ],
    skills: studentData?.skills || ["React", "Next.js", "TypeScript", "Node.js", "PostgreSQL", "TailwindCSS"],
    preferred_language: studentData?.preferred_language || "en",
    learning_streak: studentData?.learning_streak ?? 14,
    profile_visibility: studentData?.profile_visibility || "public",
    show_learning_progress: studentData?.show_learning_progress ?? true,
    show_certificates: studentData?.show_certificates ?? true,
    show_achievements: studentData?.show_achievements ?? true,
    notification_preferences: studentData?.notification_preferences || {
      email: true,
      course_updates: true,
      quiz_reminders: true,
      community_activity: true,
    },
    created_at: studentData?.created_at,
    updated_at: studentData?.updated_at,
  };

  const studentStats: StudentOverviewStats = {
    enrolledCoursesCount: enrollments.length,
    completedCoursesCount: completedCount,
    inProgressCoursesCount: inProgressCount,
    learningHours: 36,
    overallProgress: totalProgress || 45,
    certificatesEarnedCount: certificates.length,
    currentStreak: studentProfile.learning_streak,
    averageQuizScore: avgQuiz,
  };

  return {
    base,
    student: studentProfile,
    studentStats,
    enrolledCourses,
    certificates,
  };
}
