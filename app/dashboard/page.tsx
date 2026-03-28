import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import {
  LayoutDashboard, BookOpen, Trophy, Sparkles, Settings,
  TrendingUp, Play, ArrowRight, Zap, ChevronRight,
  Clock, Target, Flame, MessageSquare, BarChart2,
  Star, Users, CheckCircle2, Lock, Globe, Shield
} from "lucide-react";

// Helper client components can be pulled in if needed (like the chat input).
import DashboardInteractive from "./DashboardInteractive";

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", active: true },
  { icon: BookOpen, label: "My Courses", href: "#", badge: 0 },
  { icon: Trophy, label: "Achievements", href: "#" },
  { icon: Sparkles, label: "Recommendations", href: "#", badge: 3 },
  { icon: Settings, label: "Settings", href: "#" },
];

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
  let { data: { user } } = await supabase.auth.getUser();

  // If there's no user, use a dummy user so you can preview the dashboard without logging in.
  if (!user) {
    user = {
      id: "dummy-123",
      aud: "authenticated",
      role: "authenticated",
      email: "dummy@example.com",
      app_metadata: {},
      user_metadata: { full_name: "Dummy User" },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as any;
  }

  // Fetch some courses for recommendations
  const { data: recommendations } = await supabase
    .from("courses")
    .select("*")
    .limit(3);

  const firstName = user!.user_metadata?.full_name?.split(" ")[0] || "Learner";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      {/* Navbar imported from client so we don't have to duplicate */}
      <DashboardInteractive user={user} />

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: "calc(100vh - 64px)" }}>

        {/* ── SIDEBAR ── */}
        <aside style={{
          background: "white", borderRight: "1px solid var(--border)", padding: "24px 16px",
          display: "flex", flexDirection: "column", position: "sticky", top: 64,
          height: "calc(100vh - 64px)", overflowY: "auto", boxShadow: "2px 0 12px rgba(15,23,42,0.04)",
        }}>
          {SIDEBAR_ITEMS.map((item) => (
            <Link key={item.label} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10,
              textDecoration: "none", marginBottom: 4, background: item.active ? "var(--primary-subtle)" : "transparent",
              border: `1px solid ${item.active ? "rgba(37,99,235,0.2)" : "transparent"}`,
              color: item.active ? "var(--primary)" : "var(--text-2)",
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: item.active ? 700 : 500,
              fontSize: 14, transition: "all 0.15s",
            }} className="sidebar-link">
              <item.icon size={16} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span style={{ background: "var(--primary)", color: "white", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>
                  {item.badge}
                </span>
              )}
            </Link>
          ))}

          <div style={{ marginTop: "auto" }}>
            <div style={{ background: "var(--primary-subtle)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 12, padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, var(--primary-dark), var(--primary-light))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Zap size={13} color="white" fill="white" />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--primary)" }}>AI Concierge</div>
                  <div style={{ fontSize: 10, color: "var(--emerald)" }}>● Active</div>
                </div>
              </div>
              <p style={{ fontSize: 11, color: "var(--text-2)", lineHeight: 1.5 }}>Your learning path is being dynamically updated based on recent activity.</p>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main style={{ padding: "32px", overflowY: "auto", background: "var(--bg-base)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>

            {/* Welcome + Velocity */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "start", marginBottom: 40 }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--primary)", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.06em", marginBottom: 8, textTransform: "uppercase" }}>WELCOME BACK, {firstName} 👋</div>
                <h1 style={{ fontSize: "clamp(24px, 3vw, 36px)", marginBottom: 12, color: "var(--text-1)" }}>Cultivating your<br />expertise today.</h1>
                <p style={{ color: "var(--text-2)", fontSize: 15, lineHeight: 1.6, maxWidth: 500 }}>
                  You have no active courses currently. Explore our catalog below to start your personalized learning journey.
                </p>
              </div>

              {/* Learning velocity card - Empty State */}
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

            {/* Quick stats - Empty states for new user */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 36 }}>
              {[
                { icon: Flame, label: "Day Streak", value: "0", color: "#F59E0B", bg: "#FFFBEB", sub: "Start learning today!" },
                { icon: Clock, label: "Hours This Week", value: "0", color: "#0EA5E9", bg: "#F0F9FF", sub: "No activity yet" },
                { icon: CheckCircle2, label: "Completed", value: "0", color: "#10B981", bg: "#ECFDF5", sub: "modules overall" },
                { icon: Trophy, label: "Global Rank", value: "N/A", color: "var(--primary)", bg: "var(--primary-subtle)", sub: "Unranked" },
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24, marginBottom: 40 }}>
              
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
                    )
                  }) : (
                    <div style={{ padding: "32px", textAlign: "center", color: "var(--text-3)", border: "1px dashed var(--border)", borderRadius: 14 }}>
                      No recommendations yet. Start exploring courses.
                    </div>
                  )}
                </div>
              </section>

              {/* Skill Trajectory (Empty State) */}
              <section>
                <h2 style={{ fontSize: 22, marginBottom: 20, color: "var(--text-1)" }}>Skill Trajectory</h2>
                <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: "20px", marginBottom: 16, boxShadow: "0 1px 4px rgba(15,23,42,0.05)", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
                  Complete courses to build your skill tree.
                </div>

                {/* Achievements */}
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
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
