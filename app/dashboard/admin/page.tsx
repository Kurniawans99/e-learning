"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, BookOpen, TrendingUp, BarChart2,
  ArrowRight, Shield, UserPlus, Activity,
  Zap, Clock, GraduationCap
} from "lucide-react";

export default function AdminDashboardPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalAdmins: 0,
    totalCourses: 0,
    totalEnrollments: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      // Check role
      const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single();
      if (userData?.role !== "admin") { router.push("/dashboard"); return; }

      // Count users by role
      const { data: allUsers } = await supabase.from("users").select("id, full_name, role, created_at").order("created_at", { ascending: false });
      const users = allUsers || [];
      
      // Count courses
      const { count: courseCount } = await supabase.from("courses").select("*", { count: "exact", head: true });

      // Count enrollments
      const { count: enrollCount } = await supabase.from("user_enrollments").select("*", { count: "exact", head: true });

      setStats({
        totalUsers: users.length,
        totalStudents: users.filter(u => u.role === "student").length,
        totalTeachers: users.filter(u => u.role === "teacher").length,
        totalAdmins: users.filter(u => u.role === "admin").length,
        totalCourses: courseCount ?? 0,
        totalEnrollments: enrollCount ?? 0,
      });

      setRecentUsers(users.slice(0, 5));
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

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Shield size={14} color="#DC2626" />
          <span style={{ fontSize: 12, color: "#DC2626", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>ADMIN PANEL</span>
        </div>
        <h1 style={{ fontSize: "clamp(24px, 3vw, 36px)", marginBottom: 12, color: "var(--text-1)" }}>Platform Overview</h1>
        <p style={{ color: "var(--text-2)", fontSize: 15, lineHeight: 1.6, maxWidth: 500 }}>
          Monitor and manage IntelliCourse platform metrics.
        </p>
      </div>

      {/* Stats cards */}
      <div className="mobile-col-2" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 36 }}>
        {[
          { icon: Users, label: "Total Users", value: stats.totalUsers, color: "#2563EB", bg: "#EFF6FF", sub: `${stats.totalStudents} students, ${stats.totalTeachers} teachers, ${stats.totalAdmins} admins` },
          { icon: BookOpen, label: "Total Courses", value: stats.totalCourses, color: "#059669", bg: "#ECFDF5", sub: "published courses" },
          { icon: GraduationCap, label: "Enrollments", value: stats.totalEnrollments, color: "#F59E0B", bg: "#FFFBEB", sub: "total enrollments" },
        ].map((stat) => (
          <div key={stat.label} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 22px", boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: "var(--text-2)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}>{stat.label}</span>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <stat.icon size={16} color={stat.color} />
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 4, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions + Recent Users */}
      <div className="mobile-col-1 mobile-flex-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

        {/* Quick Actions */}
        <section>
          <h2 style={{ fontSize: 20, marginBottom: 16, color: "var(--text-1)" }}>Quick Actions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { icon: Users, label: "Manage Users", desc: "View and manage all user accounts", href: "/dashboard/admin/users", color: "#2563EB", bg: "#EFF6FF" },
              { icon: BookOpen, label: "Manage Courses", desc: "Review and manage all courses", href: "/dashboard/admin/courses", color: "#059669", bg: "#ECFDF5" },
              { icon: BarChart2, label: "View Analytics", desc: "Platform performance metrics", href: "/dashboard/admin/analytics", color: "#F59E0B", bg: "#FFFBEB" },
            ].map((action) => (
              <Link key={action.label} href={action.href} style={{ textDecoration: "none" }}>
                <div className="card-hover" style={{
                  background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px",
                  display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
                }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: action.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <action.icon size={18} color={action.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", marginBottom: 2 }}>{action.label}</div>
                    <div style={{ fontSize: 12, color: "var(--text-3)" }}>{action.desc}</div>
                  </div>
                  <ArrowRight size={14} color="var(--text-3)" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Users */}
        <section>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, color: "var(--text-1)" }}>Recent Users</h2>
            <Link href="/dashboard/admin/users" style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>View all →</Link>
          </div>
          <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
            {recentUsers.length > 0 ? recentUsers.map((u, i) => {
              const rc = u.role === "admin" ? { text: "#DC2626", bg: "rgba(220,38,38,0.08)" } : u.role === "teacher" ? { text: "#059669", bg: "rgba(5,150,105,0.08)" } : { text: "#2563EB", bg: "rgba(37,99,235,0.08)" };
              return (
                <div key={u.id} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "14px 18px",
                  borderBottom: i < recentUsers.length - 1 ? "1px solid var(--border)" : "none",
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: "linear-gradient(135deg, var(--primary-dark), var(--primary-light))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, color: "white", flexShrink: 0,
                  }}>
                    {(u.full_name || "U").charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{u.full_name || "Unnamed User"}</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)" }}>Joined {new Date(u.created_at).toLocaleDateString()}</div>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: rc.text, background: rc.bg,
                    padding: "2px 8px", borderRadius: 99, textTransform: "uppercase",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}>{u.role}</span>
                </div>
              );
            }) : (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>No users found.</div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
