import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import DashboardShell from "./DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
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
