import { createClient } from "@/lib/supabase/server";
import { getSafeRedirectPath } from "@/lib/auth/redirects";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  // Check for error parameters returned directly from OAuth provider / Supabase
  const errorParam = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  const origin = isLocalEnv
    ? requestUrl.origin
    : forwardedHost
      ? `https://${forwardedHost}`
      : requestUrl.origin;

  if (errorParam) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", errorDescription || errorParam);
    return NextResponse.redirect(loginUrl);
  }

  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      const loginUrl = new URL("/login", origin);
      loginUrl.searchParams.set("error", "auth_callback_failed");
      return NextResponse.redirect(loginUrl);
    }

    // Ensure a profile exists for the user in public.profiles
    if (data?.user) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", data.user.id)
          .maybeSingle();

        if (!profile) {
          const userMeta = data.user.user_metadata || {};
          await supabase.from("profiles").upsert({
            id: data.user.id,
            email: data.user.email,
            full_name:
              userMeta.full_name ||
              userMeta.name ||
              data.user.email?.split("@")[0] ||
              "Student",
            role: "student",
            avatar_url: userMeta.avatar_url || userMeta.picture || null,
          });
        }
      } catch {
        // Continue navigation if profile check fails (trigger or client can backfill)
      }
    }
  }

  const redirectPath = getSafeRedirectPath(next);

  return NextResponse.redirect(new URL(redirectPath, origin));
}
