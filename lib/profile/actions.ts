"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ActionResponse {
  success: boolean;
  message: string;
  error?: string;
}

export async function updateBaseProfile(formData: {
  full_name: string;
  username?: string;
  phone?: string;
  bio?: string;
  location?: string;
  website?: string;
  linkedin_url?: string;
  github_url?: string;
  avatar_url?: string;
}): Promise<ActionResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Unauthorized", error: "Please log in" };
  }

  const payload: Record<string, any> = {
    full_name: formData.full_name?.trim() || null,
    username: formData.username?.trim().toLowerCase() || null,
    phone: formData.phone?.trim() || null,
    bio: formData.bio?.trim() || null,
    location: formData.location?.trim() || null,
    website: formData.website?.trim() || null,
    linkedin_url: formData.linkedin_url?.trim() || null,
    github_url: formData.github_url?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  if (formData.avatar_url) {
    payload.avatar_url = formData.avatar_url;
  }

  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505" || error.message.includes("username")) {
      return { success: false, message: "Username is already taken.", error: error.message };
    }
    return { success: false, message: "Failed to update profile", error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: true, message: "Personal information saved successfully!" };
}

export async function updateStudentProfile(data: {
  date_of_birth?: string | null;
  gender?: string | null;
  learning_goals?: string[];
  skills?: string[];
  preferred_language?: string;
  profile_visibility?: "public" | "students_only" | "private";
  show_learning_progress?: boolean;
  show_certificates?: boolean;
  show_achievements?: boolean;
  notification_preferences?: {
    email: boolean;
    course_updates: boolean;
    quiz_reminders: boolean;
    community_activity: boolean;
  };
}): Promise<ActionResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Unauthorized" };
  }

  const payload = {
    user_id: user.id,
    date_of_birth: data.date_of_birth || null,
    gender: data.gender || null,
    learning_goals: data.learning_goals || [],
    skills: data.skills || [],
    preferred_language: data.preferred_language || "en",
    profile_visibility: data.profile_visibility || "public",
    show_learning_progress: data.show_learning_progress ?? true,
    show_certificates: data.show_certificates ?? true,
    show_achievements: data.show_achievements ?? true,
    notification_preferences: data.notification_preferences || {
      email: true,
      course_updates: true,
      quiz_reminders: true,
      community_activity: true,
    },
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("student_profiles")
    .upsert(payload, { onConflict: "user_id" });

  if (error) {
    return { success: false, message: "Failed to save student profile settings.", error: error.message };
  }

  revalidatePath("/profile");
  return { success: true, message: "Learning preferences & privacy updated!" };
}

export async function updateTeacherProfile(data: {
  headline?: string;
  expertise?: string[];
  experience_years?: number;
  organization?: string;
  previous_organizations?: string[];
  education?: string;
  certifications?: string[];
  teaching_experience?: string;
  teaching_style?: string;
  preferred_categories?: string[];
  available_hours?: number;
  student_capacity?: number;
  delivery_preference?: "online" | "offline" | "hybrid";
}): Promise<ActionResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Unauthorized" };
  }

  const payload = {
    user_id: user.id,
    headline: data.headline?.trim() || "Course Instructor",
    expertise: data.expertise || [],
    experience_years: data.experience_years ?? 0,
    organization: data.organization?.trim() || null,
    previous_organizations: data.previous_organizations || [],
    education: data.education?.trim() || null,
    certifications: data.certifications || [],
    teaching_experience: data.teaching_experience?.trim() || null,
    teaching_style: data.teaching_style?.trim() || null,
    preferred_categories: data.preferred_categories || [],
    available_hours: data.available_hours ?? 20,
    student_capacity: data.student_capacity ?? 250,
    delivery_preference: data.delivery_preference || "online",
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("teacher_profiles")
    .upsert(payload, { onConflict: "user_id" });

  if (error) {
    return { success: false, message: "Failed to save teaching profile.", error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/teacher");
  return { success: true, message: "Professional teaching credentials saved!" };
}

export async function updateAdminProfile(data: {
  designation?: string;
  department?: string;
  recovery_email?: string;
  two_factor_enabled?: boolean;
}): Promise<ActionResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Unauthorized" };
  }

  const payload = {
    user_id: user.id,
    designation: data.designation?.trim() || "Administrator",
    department: data.department?.trim() || "Operations",
    recovery_email: data.recovery_email?.trim() || null,
    two_factor_enabled: data.two_factor_enabled ?? false,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("admin_profiles")
    .upsert(payload, { onConflict: "user_id" });

  if (error) {
    return { success: false, message: "Failed to update admin profile.", error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/admin");
  return { success: true, message: "Admin security and identity updated!" };
}

export async function updateUserPassword(newPassword: string): Promise<ActionResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Unauthorized" };
  }

  if (!newPassword || newPassword.length < 8) {
    return { success: false, message: "Password must be at least 8 characters long." };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { success: false, message: error.message, error: error.message };
  }

  return { success: true, message: "Password updated successfully!" };
}
