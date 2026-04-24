import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import DashboardShell from "./DashboardShell";
import type { UserRole } from "@/lib/types";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Fetch user role from public.users
  let { data: userData, error: userError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  // If no row exists in public.users, create one with default role
  // Use the role from user_metadata if it was set during signup
  if (!userData) {
    const metaRole = user.user_metadata?.role;
    const defaultRole: UserRole = (metaRole === "teacher") ? "teacher" : "student";
    const fullName = user.user_metadata?.full_name || null;

    const { data: inserted, error: insertError } = await supabase
      .from("users")
      .insert({
        id: user.id,
        full_name: fullName,
        role: defaultRole,
      })
      .select("role")
      .single();

    if (insertError) {
      console.error("Failed to create user row:", insertError.message);
    }
    userData = inserted;
  }

  const userRole: UserRole = (userData?.role as UserRole) || "student";

  // Only check onboarding for students
  if (userRole === "student") {
    const { data: prefs, error: prefsError } = await supabase
      .from("user_preferences")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!prefs) {
      console.warn("Dashboard Layout: No user_preferences found, redirecting to /onboarding.", prefsError);
      redirect("/onboarding");
    }
  }

  const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Learner";
  const userEmail = user.email || "";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <DashboardShell
      userName={userName}
      userEmail={userEmail}
      userInitial={userInitial}
      userRole={userRole}
    >
      {children}
    </DashboardShell>
  );
}
