"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { UserSettings } from "@/types/settings";
import { sanitizeSettingsByRole } from "./defaults";

export interface SettingsActionResult {
  success: boolean;
  message: string;
  error?: string;
}

export async function saveUserSettingsPartial(
  payload: Partial<UserSettings>
): Promise<SettingsActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Unauthorized. Please sign in." };
  }

  // Fetch user role for RBAC sanitization
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = profile?.role?.toLowerCase() || "student";

  // Prevent students and teachers from writing to privileged admin/teacher fields
  const sanitized = sanitizeSettingsByRole(payload, userRole);


  const cleanPayload = {
    ...sanitized,
    user_id: user.id,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("user_settings")
    .upsert(cleanPayload, { onConflict: "user_id" });

  if (error) {
    return { success: false, message: "Failed to save settings.", error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true, message: "Settings saved successfully!" };
}

export async function saveAccountInfo(formData: {
  fullName: string;
  username?: string;
  phone?: string;
}): Promise<SettingsActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Unauthorized." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: formData.fullName.trim(),
      username: formData.username?.trim().toLowerCase() || null,
      phone: formData.phone?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { success: false, message: error.message, error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/profile");
  return { success: true, message: "Account details updated!" };
}

export async function changeEmailRequest(newEmail: string): Promise<SettingsActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Unauthorized." };
  }

  if (!newEmail || !newEmail.includes("@")) {
    return { success: false, message: "Valid email address is required." };
  }

  const { error } = await supabase.auth.updateUser({
    email: newEmail.trim().toLowerCase(),
  });

  if (error) {
    return { success: false, message: error.message, error: error.message };
  }

  return {
    success: true,
    message: "Confirmation link sent to your new email address. Check your inbox!",
  };
}

export async function terminateOtherSessions(): Promise<SettingsActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Unauthorized." };
  }

  // Supabase signOut with scope: 'others' terminates all other sessions
  const { error } = await supabase.auth.signOut({ scope: "others" });

  if (error) {
    return { success: false, message: "Failed to terminate sessions: " + error.message };
  }

  return { success: true, message: "Successfully logged out from all other devices!" };
}
