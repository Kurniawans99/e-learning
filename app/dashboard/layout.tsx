import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import DashboardShell from "./DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Check onboarding completion
  const { data: prefs, error: prefsError } = await supabase
    .from("user_preferences")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!prefs) {
    console.warn("Dashboard Layout: No user_preferences found or error occurred, redirecting to /onboarding.", prefsError);
    redirect("/onboarding");
  }

  const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Learner";
  const userEmail = user.email || "";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <DashboardShell
      userName={userName}
      userEmail={userEmail}
      userInitial={userInitial}
    >
      {children}
    </DashboardShell>
  );
}
