export function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";

  return url.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}
