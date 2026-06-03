import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type UserRole = "student" | "pending_teacher" | "teacher" | "admin";

export interface AuthUser {
  id: string;
  email: string | null;
  role: UserRole;
  full_name: string | null;
  avatar_url: string | null;
}

/**
 * Fetches the currently authenticated user along with their profile role.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email ?? user.email ?? null,
    role: (profile.role as UserRole) ?? "student",
    full_name: profile.full_name ?? null,
    avatar_url: profile.avatar_url ?? null,
  };
}

/**
 * Returns the role of the currently authenticated user.
 * Returns null if unauthenticated.
 */
export async function getUserRole(): Promise<UserRole | null> {
  const user = await getCurrentUser();
  return user?.role ?? null;
}

/**
 * Server-side guard: requires an authenticated admin user.
 * Redirects to "/" if user is not an admin.
 * Returns the authenticated admin user.
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "admin") {
    redirect("/");
  }

  return user;
}

/**
 * Server-side guard: requires an authenticated teacher or admin user.
 * Redirects to "/" if user does not satisfy the role requirement.
 * Returns the authenticated user.
 */
export async function requireTeacher(): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "teacher" && user.role !== "admin") {
    // pending_teacher is intentionally blocked — must be approved by admin first
    redirect("/");
  }

  return user;
}
