import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/types";
import {
  TrendingUp, ArrowRight, Zap,
  Clock, Flame, BarChart2,
  Star, CheckCircle2, Trophy, Sparkles, Lock
} from "lucide-react";

function categoryColor(category: string): string {
  const map: Record<string, string> = {
    "AI & ML": "var(--primary)",
    "Engineering": "var(--cyan)",
    "Design": "var(--amber)",
    "Web3": "var(--emerald)",
  };
  return map[category] ?? "var(--primary)";
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Fetch user role
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole: UserRole = (userData?.role as UserRole) || "student";

  // Redirect admin and teacher to their specific dashboards
  if (userRole === "admin") {
    redirect("/dashboard/admin");
  }
  if (userRole === "teacher") {
    redirect("/dashboard/teacher");
  }

  // ── STUDENT DASHBOARD (unchanged) ──

  // Fetch courses for recommendations
  const { data: recommendations } = await supabase
    .from("courses")
    .select("*")
    .limit(3);

  // Fetch user enrollments count
  const { count: enrollmentCount } = await supabase
    .from("user_enrollments")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  // Fetch completed count
  const { count: completedCount } = await supabase
    .from("user_enrollments")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "completed");

  // Fetch achievements count
  const { count: achievementCount } = await supabase
    .from("user_achievements")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const firstName = user.user_metadata?.full_name?.split(" ")[0] || user.email?.split("@")[0] || "Learner";

  return (
    <>
      {/* Welcome + Velocity */}
      <div className="mobile-col-1 mobile-flex-col" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "start", marginBottom: 40 }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--primary)", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.06em", marginBottom: 8, textTransform: "uppercase" }}>WELCOME BACK, {firstName} 👋</div>
          <h1 style={{ fontSize: "clamp(24px, 3vw, 36px)", marginBottom: 12, color: "var(--text-1)" }}>Cultivating your<br />expertise today.</h1>
          <p style={{ color: "var(--text-2)", fontSize: 15, lineHeight: 1.6, maxWidth: 500 }}>
            {(enrollmentCount ?? 0) > 0
              ? `You have ${enrollmentCount} active course${(enrollmentCount ?? 0) > 1 ? "s" : ""}. Keep up the great work!`
              : "You have no active courses currently. Explore our catalog below to start your personalized learning journey."}
          </p>
        </div>

        {/* Learning velocity card */}
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px", minWidth: 220, boxShadow: "0 2px 8px rgba(15,23,42,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <TrendingUp size={14} color="var(--primary)" />
            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--text-1)" }}>Learning Velocity</span>
          </div>
          <div style={{ color: "var(--text-3)", fontSize: 12, marginBottom: 16, fontWeight: 600 }}>No data this week</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 52 }}>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ width: "100%", height: "4px", background: "var(--border)", borderRadius: 4 }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="mobile-col-2" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 36 }}>
        {[
          { icon: Flame, label: "Day Streak", value: "0", color: "#F59E0B", bg: "#FFFBEB", sub: "Start learning today!" },
          { icon: Clock, label: "Hours This Week", value: "0", color: "#0EA5E9", bg: "#F0F9FF", sub: "No activity yet" },
          { icon: CheckCircle2, label: "Completed", value: String(completedCount ?? 0), color: "#10B981", bg: "#ECFDF5", sub: "courses overall" },
          { icon: Trophy, label: "Achievements", value: String(achievementCount ?? 0), color: "var(--primary)", bg: "var(--primary-subtle)", sub: "badges earned" },
        ].map((stat) => (
          <div key={stat.label} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: "var(--text-2)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}>{stat.label}</span>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <stat.icon size={15} color={stat.color} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 4, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Recommendations + Skills */}
      <div className="mobile-col-1 mobile-flex-col" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24, marginBottom: 40 }}>

        {/* Recommendations */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <Sparkles size={16} color="var(--primary)" />
            <span style={{ fontSize: 11, color: "var(--primary)", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.06em" }}>PERSONALIZED SELECTION</span>
          </div>
          <h2 style={{ fontSize: 22, marginBottom: 20, color: "var(--text-1)" }}>Curated for Your Path</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {recommendations && recommendations.length > 0 ? recommendations.map((rec) => {
              const color = categoryColor(rec.category);
              return (
                <Link key={rec.id} href={`/courses/${rec.slug}`} style={{ textDecoration: "none" }}>
                  <div className="recommendation-card" style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: "18px", display: "grid", gridTemplateColumns: "80px 1fr auto", gap: 16, alignItems: "center", transition: "all 0.2s", boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}>
                    <div style={{ width: 80, height: 64, borderRadius: 10, background: "var(--primary-subtle)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0, fontWeight: 800, color: "var(--primary)", opacity: 0.5 }}>
                      {rec.title.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: "var(--text-1)" }}>{rec.title}</h3>
                      <p style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 8, lineHeight: 1.5 }}>{rec.subtitle}</p>
                      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 4 }}><Clock size={10} />{rec.hours}h</span>
                        <span style={{ fontSize: 11, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 4 }}><BarChart2 size={10} />{rec.level}</span>
                        <span style={{ fontSize: 11, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 4 }}><Star size={10} fill="#F59E0B" color="#F59E0B" />{rec.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "center", flexShrink: 0 }}>
                      <div style={{ background: `${color}15`, border: `1px solid ${color}25`, borderRadius: 10, padding: "8px 12px", marginBottom: 8 }}>
                        <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", color }}>98%</div>
                        <div style={{ fontSize: 9, color: "var(--text-3)", fontWeight: 600 }}>MATCH</div>
                      </div>
                      <ArrowRight size={14} color="var(--text-3)" />
                    </div>
                  </div>
                </Link>
              );
            }) : (
              <div style={{ padding: 32, textAlign: "center", color: "var(--text-3)", border: "1px dashed var(--border)", borderRadius: 14 }}>
                No recommendations yet. Start exploring courses.
              </div>
            )}
          </div>
        </section>

        {/* Skill Trajectory */}
        <section>
          <h2 style={{ fontSize: 22, marginBottom: 20, color: "var(--text-1)" }}>Skill Trajectory</h2>
          <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: "0 1px 4px rgba(15,23,42,0.05)", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
            Complete courses to build your skill tree.
          </div>

          {/* Achievements preview */}
          <h2 style={{ fontSize: 18, marginBottom: 14, color: "var(--text-1)" }}>Achievements</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
            {[1,2,3,4,5].map((ach) => (
              <div key={ach} style={{
                width: 48, height: 48, background: "var(--bg-base)",
                border: "1.5px solid var(--border)", borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Lock size={14} color="var(--text-3)" />
              </div>
            ))}
          </div>
          <Link href="/dashboard/achievements" style={{ display: "block", marginTop: 12, fontSize: 12, color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
            View all achievements →
          </Link>
        </section>
      </div>
    </>
  );
}
