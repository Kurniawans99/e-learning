import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "./types";

/**
 * Fetch the current user's role from the users table.
 * Returns 'student' as default if no record found.
 */
export async function getUserRole(supabase: SupabaseClient): Promise<{ userId: string; role: UserRole } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return {
    userId: user.id,
    role: (data?.role as UserRole) || "student",
  };
}

/**
 * Server-side role guard. Returns user info or null.
 */
export async function requireRole(
  supabase: SupabaseClient,
  allowedRoles: UserRole[]
): Promise<{ userId: string; role: UserRole } | null> {
  const result = await getUserRole(supabase);
  if (!result) return null;
  if (!allowedRoles.includes(result.role)) return null;
  return result;
}

/** Convenience role checks */
export function isAdmin(role: UserRole): boolean {
  return role === "admin";
}

export function isTeacher(role: UserRole): boolean {
  return role === "teacher";
}

export function isTeacherOrAdmin(role: UserRole): boolean {
  return role === "teacher" || role === "admin";
}

export function isStudent(role: UserRole): boolean {
  return role === "student";
}

/** Get role display label */
export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case "admin": return "Administrator";
    case "teacher": return "Teacher";
    case "student": return "Student";
  }
}

/** Get role color config */
export function getRoleColor(role: UserRole): { text: string; bg: string; border: string } {
  switch (role) {
    case "admin":
      return { text: "#DC2626", bg: "rgba(220,38,38,0.08)", border: "rgba(220,38,38,0.2)" };
    case "teacher":
      return { text: "#059669", bg: "rgba(5,150,105,0.08)", border: "rgba(5,150,105,0.2)" };
    case "student":
      return { text: "#2563EB", bg: "rgba(37,99,235,0.08)", border: "rgba(37,99,235,0.2)" };
  }
}
