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
  "/profile",
  "/reset-password",
  "/settings",
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

  if (user) {
    const roleCheckNeeded =
      pathname.startsWith("/admin") ||
      pathname.startsWith("/teacher") ||
      isAuthRoute(pathname);

    if (roleCheckNeeded) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const userRole = profile?.role?.toLowerCase() || "student";

      // If already logged in and visiting login/register, send to appropriate dashboard
      if (isAuthRoute(pathname)) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname =
          userRole === "admin"
            ? "/admin"
            : userRole === "teacher"
              ? "/teacher"
              : "/dashboard";
        redirectUrl.search = "";
        return NextResponse.redirect(redirectUrl);
      }

      // Block non-admins from /admin
      if (pathname.startsWith("/admin") && userRole !== "admin") {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = userRole === "teacher" ? "/teacher" : "/dashboard";
        redirectUrl.search = "";
        return NextResponse.redirect(redirectUrl);
      }

      // Block students from /teacher (teachers and admins allowed)
      if (pathname.startsWith("/teacher") && userRole !== "teacher" && userRole !== "admin") {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/dashboard";
        redirectUrl.search = "";
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|css|js|map)$).*)",
  ],
};
