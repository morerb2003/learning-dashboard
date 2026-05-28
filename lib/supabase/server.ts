import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseUrl } from "@/lib/supabase/url";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    getSupabaseUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            // This will throw when called from a Server Component — that's fine.
            // In Route Handlers and Server Actions it works correctly.
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Intentionally ignored: cookies can only be set in Route Handlers
            // or Server Actions, not from Server Components.
          }
        },
      },
    }
  );
}
