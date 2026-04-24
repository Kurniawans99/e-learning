"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  BarChart2, Shield, Users, BookOpen,
  TrendingUp, GraduationCap, Activity, Clock
} from "lucide-react";

export default function AdminAnalyticsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    completedEnrollments: 0,
    activeEnrollments: 0,
    avgCoursesPerUser: 0,
    categoryCounts: {} as Record<string, number>,
    levelCounts: {} as Record<string, number>,
  });

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      const { data: me } = await supabase.from("users").select("role").eq("id", user.id).single();
      if (me?.role !== "admin") { router.push("/dashboard"); return; }

      const { count: userCount } = await supabase.from("users").select("*", { count: "exact", head: true });
      const { count: courseCount } = await supabase.from("courses").select("*", { count: "exact", head: true });
      const { count: enrollCount } = await supabase.from("user_enrollments").select("*", { count: "exact", head: true });
      const { count: completedCount } = await supabase.from("user_enrollments").select("*", { count: "exact", head: true }).eq("status", "completed");
      const { count: activeCount } = await supabase.from("user_enrollments").select("*", { count: "exact", head: true }).eq("status", "active");

      const { data: courseData } = await supabase.from("courses").select("category, level");
      const categoryCounts: Record<string, number> = {};
      const levelCounts: Record<string, number> = {};
      (courseData || []).forEach(c => {
        categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
        levelCounts[c.level] = (levelCounts[c.level] || 0) + 1;
      });

      const totalUsers = userCount ?? 0;
      const totalEnrollments = enrollCount ?? 0;

      setStats({
        totalUsers,
        totalCourses: courseCount ?? 0,
        totalEnrollments,
        completedEnrollments: completedCount ?? 0,
        activeEnrollments: activeCount ?? 0,
        avgCoursesPerUser: totalUsers > 0 ? Number((totalEnrollments / totalUsers).toFixed(1)) : 0,
        categoryCounts,
        levelCounts,
      });

      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ height: 120, borderRadius: 14, animation: "shimmer 1.5s infinite", backgroundImage: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)", backgroundSize: "200% 100%" }} />
        ))}
      </div>
    );
  }

  const completionRate = stats.totalEnrollments > 0 ? Math.round((stats.completedEnrollments / stats.totalEnrollments) * 100) : 0;

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Shield size={14} color="#DC2626" />
          <span style={{ fontSize: 12, color: "#DC2626", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>ADMIN</span>
        </div>
        <h1 style={{ fontSize: "clamp(24px, 3vw, 36px)", marginBottom: 12, color: "var(--text-1)" }}>Analytics</h1>
        <p style={{ color: "var(--text-2)", fontSize: 15, lineHeight: 1.6, maxWidth: 500 }}>
          Platform performance metrics and insights.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="mobile-col-2" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 36 }}>
        {[
          { icon: Users, label: "Total Users", value: stats.totalUsers, color: "#2563EB", bg: "#EFF6FF", sub: "registered users" },
          { icon: BookOpen, label: "Total Courses", value: stats.totalCourses, color: "#059669", bg: "#ECFDF5", sub: "published courses" },
          { icon: GraduationCap, label: "Enrollments", value: stats.totalEnrollments, color: "#F59E0B", bg: "#FFFBEB", sub: `${stats.activeEnrollments} active, ${stats.completedEnrollments} completed` },
          { icon: TrendingUp, label: "Completion Rate", value: `${completionRate}%`, color: "#0EA5E9", bg: "#F0F9FF", sub: "of all enrollments" },
        ].map(stat => (
          <div key={stat.label} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 22px", boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: "var(--text-2)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}>{stat.label}</span>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <stat.icon size={16} color={stat.color} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 4, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Breakdowns */}
      <div className="mobile-col-1 mobile-flex-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 36 }}>
        {/* Categories */}
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: 24, boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: "var(--text-1)" }}>Courses by Category</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Object.entries(stats.categoryCounts).map(([category, count]) => {
              const pct = stats.totalCourses > 0 ? Math.round((count / stats.totalCourses) * 100) : 0;
              const colorMap: Record<string, string> = {
                "AI & ML": "#2563EB", "Engineering": "#0EA5E9", "Design": "#F59E0B", "Web3": "#10B981",
              };
              const color = colorMap[category] || "#94A3B8";
              return (
                <div key={category}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{category}</span>
                    <span style={{ fontSize: 12, color: "var(--text-3)" }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: 8, background: "var(--bg-base)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.5s" }} />
                  </div>
                </div>
              );
            })}
            {Object.keys(stats.categoryCounts).length === 0 && (
              <p style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center" }}>No data yet.</p>
            )}
          </div>
        </div>

        {/* Levels */}
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: 24, boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: "var(--text-1)" }}>Courses by Level</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Object.entries(stats.levelCounts).map(([level, count]) => {
              const pct = stats.totalCourses > 0 ? Math.round((count / stats.totalCourses) * 100) : 0;
              const colorMap: Record<string, string> = {
                "Beginner": "#10B981", "Intermediate": "#F59E0B", "Advanced": "#DC2626",
              };
              const color = colorMap[level] || "#94A3B8";
              return (
                <div key={level}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{level}</span>
                    <span style={{ fontSize: 12, color: "var(--text-3)" }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: 8, background: "var(--bg-base)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.5s" }} />
                  </div>
                </div>
              );
            })}
            {Object.keys(stats.levelCounts).length === 0 && (
              <p style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center" }}>No data yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Avg ratio */}
      <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: 24, boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <Activity size={16} color="var(--primary)" />
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>Engagement Metric</span>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 16 }}>Average courses per user</p>
        <div style={{ fontSize: 42, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--primary)" }}>{stats.avgCoursesPerUser}</div>
      </div>
    </>
  );
}
