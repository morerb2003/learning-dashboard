import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSafeRedirectPath } from "@/lib/auth/redirects";
import { getSupabaseUrl } from "@/lib/supabase/url";

const protectedPageRoutes = [
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

function isProtectedPageRoute(pathname: string) {
  return protectedPageRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isAuthRoute(pathname: string) {
  return authRoutes.includes(pathname);
}

function isProtectedApiRoute(pathname: string) {
  return (
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/teacher")
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Correlation Request ID
  const requestId =
    request.headers.get("x-request-id") ||
    request.headers.get("x-correlation-id") ||
    crypto.randomUUID();

  // Clone request headers and inject request ID
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  const applySecurityHeaders = (res: NextResponse) => {
    res.headers.set("X-Request-Id", requestId);
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("X-Frame-Options", "DENY");
    res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    return res;
  };

  const requiresAuthCheck =
    isProtectedPageRoute(pathname) ||
    isAuthRoute(pathname) ||
    isProtectedApiRoute(pathname);

  // If purely public asset or public page, pass through with request ID & security headers
  if (!requiresAuthCheck) {
    const res = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    return applySecurityHeaders(res);
  }

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const supabase = createServerClient(
    getSupabaseUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
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

  // 1. API Route Guards
  if (isProtectedApiRoute(pathname)) {
    if (!user) {
      return applySecurityHeaders(
        NextResponse.json(
          { success: false, error: "Authentication required", code: "UNAUTHORIZED" },
          { status: 401 }
        )
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const userRole = profile?.role?.toLowerCase() || "student";

    if (pathname.startsWith("/api/admin") && userRole !== "admin") {
      return applySecurityHeaders(
        NextResponse.json(
          { success: false, error: "Admin role required", code: "FORBIDDEN" },
          { status: 403 }
        )
      );
    }

    if (
      pathname.startsWith("/api/teacher") &&
      userRole !== "teacher" &&
      userRole !== "admin"
    ) {
      return applySecurityHeaders(
        NextResponse.json(
          { success: false, error: "Teacher or Admin role required", code: "FORBIDDEN" },
          { status: 403 }
        )
      );
    }

    return applySecurityHeaders(response);
  }

  // 2. Protected Page Redirects (Unauthenticated)
  if (!user && isProtectedPageRoute(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set(
      "next",
      getSafeRedirectPath(`${pathname}${request.nextUrl.search}`)
    );
    const redirectRes = NextResponse.redirect(redirectUrl);
    return applySecurityHeaders(redirectRes);
  }

  // 3. Role-Based Page Access & Redirection for Authenticated Users
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
        .maybeSingle();

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
        const redirectRes = NextResponse.redirect(redirectUrl);
        return applySecurityHeaders(redirectRes);
      }

      // Block non-admins from /admin
      if (pathname.startsWith("/admin") && userRole !== "admin") {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = userRole === "teacher" ? "/teacher" : "/dashboard";
        redirectUrl.search = "";
        const redirectRes = NextResponse.redirect(redirectUrl);
        return applySecurityHeaders(redirectRes);
      }

      // Block students from /teacher (teachers and admins allowed)
      if (
        pathname.startsWith("/teacher") &&
        userRole !== "teacher" &&
        userRole !== "admin"
      ) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/dashboard";
        redirectUrl.search = "";
        const redirectRes = NextResponse.redirect(redirectUrl);
        return applySecurityHeaders(redirectRes);
      }
    }
  }

  return applySecurityHeaders(response);
}

export const middleware = proxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|css|js|map)$).*)",
  ],
};
