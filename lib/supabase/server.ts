import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

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
 * Standard Supabase client using @supabase/supabase-js
 */
export function createSupabaseClient() {
  const url = cleanSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  
  if (!url || !key) {
    // Return dummy client to prevent crashes if environment variables are missing
    return {
      from: () => ({
        select: () => Promise.resolve({ data: [], error: new Error("Missing Supabase credentials") })
      })
    } as any;
  }
  
  return createClient(url, key);
}

/**
 * SSR Supabase client using @supabase/ssr with Next.js Cookies
 */
export async function createSupabaseServerClient() {
  const url = cleanSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!url || !key) {
    console.warn("Supabase credentials missing in Server Client initialization. Returning fallback mock client.");
    return {
      from: () => ({
        select: () => ({
          order: () => Promise.resolve({ data: [], error: new Error("Missing Supabase credentials") })
        })
      })
    } as any;
  }

  let cookieStore: any = null;
  try {
    cookieStore = await cookies();
  } catch (err) {
    console.warn("Failed to retrieve cookies context during SSR. Using mock cookies storage.", err);
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore ? cookieStore.getAll() : [];
      },
      setAll(cookiesToSet) {
        if (!cookieStore) return;
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Can be ignored if called from a Server Component.
        }
      },
    },
  });
}