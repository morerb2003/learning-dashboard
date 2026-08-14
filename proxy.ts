import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSafeRedirectPath } from "@/lib/auth/redirects";
import { getSupabaseUrl } from "@/lib/supabase/url";

const protectedRoutes = [
  "/admin",
  "/community",
  "/course",
  "/dashboard",
  "/learning",
  "/reset-password",
  "/teacher",
];
const authRoutes = ["/login", "/register"];

function isProtectedRoute(pathname: string) {
  return protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isAuthRoute(pathname: string) {
  return authRoutes.includes(pathname);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const requiresAuthCheck = isProtectedRoute(pathname) || isAuthRoute(pathname);

  // If this is a purely public route (e.g. landing page or public assets), bypass middleware auth overhead
  if (!requiresAuthCheck) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    getSupabaseUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtectedRoute(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set(
      "next",
      getSafeRedirectPath(`${pathname}${request.nextUrl.search}`)
    );
    return NextResponse.redirect(redirectUrl);
  }

  if (
    user &&
    (pathname.startsWith("/admin") ||
      pathname.startsWith("/teacher") ||
      isAuthRoute(pathname))
  ) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const canAccessAdmin = pathname.startsWith("/admin") && profile?.role === "admin";
    const canAccessTeacher =
      pathname.startsWith("/teacher") &&
      (profile?.role === "teacher" || profile?.role === "admin");

    if (isAuthRoute(pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname =
        profile?.role === "admin"
          ? "/admin"
          : profile?.role === "teacher"
            ? "/teacher"
            : "/learning";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    if (!canAccessAdmin && !canAccessTeacher) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|css|js|map)$).*)",
  ],
};
