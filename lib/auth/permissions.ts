import type { UserRole } from "./roles";

/**
 * Defines which roles are permitted to access specific resources.
 */
export const ROLE_PERMISSIONS: Record<string, UserRole[]> = {
  // Admin-only routes
  "admin:access": ["admin"],
  "admin:users:view": ["admin"],
  "admin:users:edit": ["admin"],
  "admin:users:delete": ["admin"],
  "admin:courses:manage": ["admin"],
  "admin:analytics:view": ["admin"],
  "admin:settings:manage": ["admin"],

  // Teacher + Admin
  "courses:create": ["teacher", "admin"],
  "courses:edit": ["teacher", "admin"],
  "lessons:manage": ["teacher", "admin"],

  // All authenticated users
  "courses:view": ["student", "teacher", "admin"],
  "notes:manage": ["student", "teacher", "admin"],
  "profile:edit": ["student", "teacher", "admin"],
};

/**
 * Check if a given role has permission for a specific action.
 */
export function hasPermission(role: UserRole, permission: string): boolean {
  const allowed = ROLE_PERMISSIONS[permission];
  if (!allowed) return false;
  return allowed.includes(role);
}

/**
 * Returns all permissions granted to a given role.
 */
export function getPermissionsForRole(role: UserRole): string[] {
  return Object.entries(ROLE_PERMISSIONS)
    .filter(([, roles]) => roles.includes(role))
    .map(([perm]) => perm);
}

/**
 * Role hierarchy — higher index = higher privilege.
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  student: 0,
  pending_teacher: 0,
  teacher: 1,
  admin: 2,
};

/**
 * Returns true if roleA has at least as much privilege as roleB.
 */
export function hasAtLeastRole(roleA: UserRole, roleB: UserRole): boolean {
  return ROLE_HIERARCHY[roleA] >= ROLE_HIERARCHY[roleB];
}
