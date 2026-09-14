import { createClient } from "@/lib/supabase/server";
import { UserSettings, UserSettingsResponse } from "@/types/settings";
import { defaultUserSettings } from "./defaults";


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
