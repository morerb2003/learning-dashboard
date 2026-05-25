import { createBrowserClient } from "@supabase/ssr";

// Clean trailing /rest/v1/ or /rest/v1 if present in .env.local
function cleanSupabaseUrl(url: string): string {
  let cleanedUrl = url || "";
  if (cleanedUrl.endsWith("/rest/v1/")) {
    cleanedUrl = cleanedUrl.slice(0, -9);
  } else if (cleanedUrl.endsWith("/rest/v1")) {
    cleanedUrl = cleanedUrl.slice(0, -8);
  }
  return cleanedUrl;
}

/**
 * Browser-side Supabase client for client-side operations (Auth actions, login, logout, OAuth)
 */
export function createSupabaseBrowserClient() {
  const url = cleanSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createBrowserClient(url, key);
}
