import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { hasPermission, hasAtLeastRole } from "./permissions";
import type { UserRole, AuthUser } from "./roles";

/**
 * Route guard: redirects to loginPath if user is not authenticated.
 */
export async function requireAuth(loginPath = "/login"): Promise<AuthUser> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(loginPath);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile) redirect(loginPath);

  return {
    id: profile.id,
    email: profile.email ?? user.email ?? null,
    role: (profile.role as UserRole) ?? "student",
    full_name: profile.full_name ?? null,
    avatar_url: profile.avatar_url ?? null,
  };
}

/**
 * Route guard: requires minimum role privilege level.
 * Redirects to redirectPath if the user doesn't meet the threshold.
 */
export async function requireMinRole(
  minRole: UserRole,
  redirectPath = "/"
): Promise<AuthUser> {
  const user = await requireAuth();
  if (!hasAtLeastRole(user.role, minRole)) {
    redirect(redirectPath);
  }
  return user;
}

/**
 * Route guard: requires a specific permission string.
 * Redirects to redirectPath if not permitted.
 */
export async function requirePermission(
  permission: string,
  redirectPath = "/"
): Promise<AuthUser> {
  const user = await requireAuth();
  if (!hasPermission(user.role, permission)) {
    redirect(redirectPath);
  }
  return user;
}

/**
 * Client-side permission check helper (no redirect — returns boolean).
 * Useful in "use client" components for conditional rendering.
 */
export function canAccess(role: UserRole, permission: string): boolean {
  return hasPermission(role, permission);
}
