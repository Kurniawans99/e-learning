"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, BookOpen, TrendingUp, BarChart2,
  ArrowRight, Shield, UserPlus, Activity,
  Zap, Clock, GraduationCap, Download,
  ArrowUp, ArrowDown, Eye, CalendarDays, FileText
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, BarChart, Bar
} from "recharts";
import { exportToExcel, formatDateForExport } from "@/lib/export-utils";

const ROLE_COLORS = { Student: "#2563EB", Teacher: "#059669", Admin: "#DC2626" };
const COLORS = ["#2563EB", "#059669", "#DC2626", "#F59E0B"];

export default function AdminDashboardPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0, totalStudents: 0, totalTeachers: 0, totalAdmins: 0,
    totalCourses: 0, totalEnrollments: 0,
    newUsersThisMonth: 0, newUsersLastMonth: 0,
    enrollmentsThisMonth: 0, enrollmentsLastMonth: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState({ day: 0, week: 0, month: 0 });

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single();
      if (userData?.role !== "admin") { router.push("/dashboard"); return; }

      // Fetch all users
      const { data: usersArr } = await supabase.from("users").select("id, full_name, role, created_at").order("created_at", { ascending: false });
      const users = usersArr || [];
      setAllUsers(users);

      // Fetch courses
      const { data: coursesData } = await supabase.from("courses").select("id, title, category, level, student_count, rating, created_at");
      setCourses(coursesData || []);

      // Fetch enrollments
      const { data: enrollData } = await supabase.from("user_enrollments").select("id, user_id, course_id, progress, status, enrolled_at, last_accessed_at, completed_at").order("enrolled_at", { ascending: false });
      setEnrollments(enrollData || []);

      // Count submissions pending
      const { count: pendingCount } = await supabase.from("student_submissions").select("*", { count: "exact", head: true }).eq("status", "submitted");

      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const newUsersThisMonth = users.filter(u => new Date(u.created_at) >= thisMonthStart).length;
      const newUsersLastMonth = users.filter(u => {
        const d = new Date(u.created_at);
        return d >= lastMonthStart && d < thisMonthStart;
      }).length;

      const enrollArr = enrollData || [];
      const enrollmentsThisMonth = enrollArr.filter(e => new Date(e.enrolled_at) >= thisMonthStart).length;
      const enrollmentsLastMonth = enrollArr.filter(e => {
        const d = new Date(e.enrolled_at);
        return d >= lastMonthStart && d < thisMonthStart;
      }).length;

      // Active users computation
      const now24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const now7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const now30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const activeDay = new Set(enrollArr.filter(e => new Date(e.last_accessed_at) >= now24h).map(e => e.user_id)).size;
      const activeWeek = new Set(enrollArr.filter(e => new Date(e.last_accessed_at) >= now7d).map(e => e.user_id)).size;
      const activeMonth = new Set(enrollArr.filter(e => new Date(e.last_accessed_at) >= now30d).map(e => e.user_id)).size;
      setActiveUsers({ day: activeDay, week: activeWeek, month: activeMonth });

      setStats({
        totalUsers: users.length,
        totalStudents: users.filter(u => u.role === "student").length,
        totalTeachers: users.filter(u => u.role === "teacher").length,
        totalAdmins: users.filter(u => u.role === "admin").length,
        totalCourses: (coursesData || []).length,
        totalEnrollments: enrollArr.length,
        newUsersThisMonth,
        newUsersLastMonth,
        enrollmentsThisMonth,
        enrollmentsLastMonth,
      });

      setRecentUsers(users.slice(0, 5));
      setLoading(false);
    }
    fetchData();
  }, []);

  // Chart data
  const userGrowth = useMemo(() => {
    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      months[key] = 0;
    }
    allUsers.forEach(u => {
      const d = new Date(u.created_at);
      const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      if (months[key] !== undefined) months[key]++;
    });
    return Object.entries(months).map(([month, count]) => ({ month, count }));
  }, [allUsers]);

  const enrollmentTrend = useMemo(() => {
    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      months[key] = 0;
    }
    enrollments.forEach(e => {
      const d = new Date(e.enrolled_at);
      const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      if (months[key] !== undefined) months[key]++;
    });
    return Object.entries(months).map(([month, count]) => ({ month, count }));
  }, [enrollments]);

  const roleDistribution = useMemo(() => {
    return [
      { name: "Student", value: stats.totalStudents },
      { name: "Teacher", value: stats.totalTeachers },
      { name: "Admin", value: stats.totalAdmins },
    ].filter(r => r.value > 0);
  }, [stats]);

  const topCourses = useMemo(() => {
    const courseEnroll: Record<string, { title: string; count: number }> = {};
    const courseMap = new Map(courses.map(c => [c.id, c.title]));
    enrollments.forEach(e => {
      const title = courseMap.get(e.course_id) || "Unknown";
      if (!courseEnroll[e.course_id]) courseEnroll[e.course_id] = { title, count: 0 };
      courseEnroll[e.course_id].count++;
    });
    return Object.values(courseEnroll).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [enrollments, courses]);

  const handleExport = () => {
    const userSheet = allUsers.map(u => ({
      "Name": u.full_name || "—",
      "Role": u.role,
      "Joined": formatDateForExport(u.created_at),
    }));
    const courseSheet = courses.map(c => ({
      "Title": c.title,
      "Category": c.category,
      "Level": c.level,
      "Students": c.student_count ?? 0,
      "Rating": c.rating ?? "—",
      "Created": formatDateForExport(c.created_at),
    }));
    const enrollSheet = enrollments.map(e => ({
      "User ID": e.user_id,
      "Course ID": e.course_id,
      "Progress": `${e.progress}%`,
      "Status": e.status,
      "Enrolled At": formatDateForExport(e.enrolled_at),
      "Last Accessed": formatDateForExport(e.last_accessed_at),
      "Completed At": formatDateForExport(e.completed_at),
    }));
    exportToExcel([
      { name: "Users", data: userSheet },
      { name: "Courses", data: courseSheet },
      { name: "Enrollments", data: enrollSheet },
    ], "Admin_Platform_Report");
  };

  function trendIndicator(current: number, previous: number) {
    if (previous === 0 && current === 0) return null;
    const diff = current - previous;
    const pct = previous > 0 ? Math.round((diff / previous) * 100) : current > 0 ? 100 : 0;
    const isUp = diff >= 0;
    return { diff, pct, isUp };
  }

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ height: 120, borderRadius: 14, animation: "shimmer 1.5s infinite", backgroundImage: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)", backgroundSize: "200% 100%" }} />
        ))}
      </div>
    );
  }

  const userTrend = trendIndicator(stats.newUsersThisMonth, stats.newUsersLastMonth);
  const enrollTrend = trendIndicator(stats.enrollmentsThisMonth, stats.enrollmentsLastMonth);

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Shield size={14} color="#DC2626" />
            <span style={{ fontSize: 12, color: "#DC2626", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>ADMIN PANEL</span>
          </div>
          <h1 style={{ fontSize: "clamp(24px, 3vw, 36px)", marginBottom: 12, color: "var(--text-1)" }}>Platform Overview</h1>
          <p style={{ color: "var(--text-2)", fontSize: 15, lineHeight: 1.6, maxWidth: 500 }}>
            Monitor and manage IntelliCourse platform metrics.
          </p>
        </div>
        <button onClick={handleExport} style={{
          display: "flex", alignItems: "center", gap: 8, padding: "10px 18px",
          background: "white", border: "1.5px solid var(--border)", borderRadius: 12,
          fontSize: 13, fontWeight: 700, color: "var(--text-1)", cursor: "pointer",
          fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: "0 1px 4px rgba(15,23,42,0.06)",
        }}>
          <Download size={15} /> Export All Data
        </button>
      </div>

      {/* Stats cards with trends */}
      <div className="mobile-col-2" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          {
            icon: Users, label: "Total Users", value: stats.totalUsers, color: "#2563EB", bg: "#EFF6FF",
            sub: `${stats.totalStudents} students, ${stats.totalTeachers} teachers`,
            trend: userTrend, trendLabel: "vs last month",
          },
          {
            icon: BookOpen, label: "Total Courses", value: stats.totalCourses, color: "#059669", bg: "#ECFDF5",
            sub: "published courses", trend: null, trendLabel: "",
          },
          {
            icon: GraduationCap, label: "Enrollments", value: stats.totalEnrollments, color: "#F59E0B", bg: "#FFFBEB",
            sub: `${stats.enrollmentsThisMonth} this month`,
            trend: enrollTrend, trendLabel: "vs last month",
          },
        ].map((stat) => (
          <div key={stat.label} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 22px", boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: "var(--text-2)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}>{stat.label}</span>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <stat.icon size={16} color={stat.color} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <div style={{ fontSize: 32, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", color: stat.color }}>{stat.value}</div>
              {stat.trend && (
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: stat.trend.isUp ? "#10B981" : "#EF4444",
                  display: "flex", alignItems: "center", gap: 3,
                }}>
                  {stat.trend.isUp ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                  {stat.trend.isUp ? "+" : ""}{stat.trend.diff} {stat.trendLabel}
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Active Users Card */}
      <div style={{ background: "linear-gradient(135deg, #1E3A5F, #2563EB)", borderRadius: 14, padding: "22px 26px", marginBottom: 24, display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: "1 1 200px" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.2)" }}>
            <Activity size={20} color="white" />
          </div>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "white", marginBottom: 2 }}>Active Users</h3>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>Users who accessed courses recently</p>
          </div>
        </div>
        {[
          { label: "Last 24h", value: activeUsers.day, color: "#34D399" },
          { label: "Last 7 days", value: activeUsers.week, color: "#60A5FA" },
          { label: "Last 30 days", value: activeUsers.month, color: "#FBBF24" },
        ].map(item => (
          <div key={item.label} style={{ textAlign: "center", flex: "0 0 auto", padding: "8px 24px", borderRadius: 12, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", color: item.color }}>{item.value}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Charts: User Growth + Role Distribution */}
      <div className="mobile-col-1 mobile-flex-col" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 24 }}>
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: 24, boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <UserPlus size={16} color="#2563EB" />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>User Growth</h3>
              <p style={{ fontSize: 11, color: "var(--text-3)" }}>New user registrations over 6 months</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={userGrowth}>
              <defs>
                <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 12 }} />
              <Area type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2.5} fill="url(#userGrad)" name="New Users" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: 24, boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>User Roles</h3>
          <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 16 }}>Distribution by role</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={roleDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {roleDistribution.map((entry, i) => (
                  <Cell key={i} fill={(ROLE_COLORS as any)[entry.name] || COLORS[i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid #E2E8F0" }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
            {roleDistribution.map(r => (
              <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: (ROLE_COLORS as any)[r.name] }} />
                <span style={{ color: "var(--text-2)", flex: 1, fontWeight: 500 }}>{r.name}</span>
                <span style={{ fontWeight: 700, color: "var(--text-1)" }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enrollment Trend + Top Courses */}
      <div className="mobile-col-1 mobile-flex-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: 24, boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "#FFFBEB", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp size={16} color="#F59E0B" />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>Enrollment Trends</h3>
              <p style={{ fontSize: 11, color: "var(--text-3)" }}>Monthly enrollments over 6 months</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={enrollmentTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid #E2E8F0" }} />
              <Bar dataKey="count" fill="#F59E0B" radius={[6, 6, 0, 0]} name="Enrollments" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: 24, boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>Top Courses</h3>
          <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 16 }}>Most enrolled courses</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {topCourses.length > 0 ? topCourses.map((c, i) => {
              const maxCount = topCourses[0].count;
              const pct = maxCount > 0 ? (c.count / maxCount) * 100 : 0;
              return (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>{c.title}</span>
                    <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 700 }}>{c.count}</span>
                  </div>
                  <div style={{ height: 6, background: "var(--bg-base)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: COLORS[i % COLORS.length], borderRadius: 99, transition: "width 0.5s" }} />
                  </div>
                </div>
              );
            }) : (
              <div style={{ textAlign: "center", padding: 20, color: "var(--text-3)", fontSize: 13 }}>No enrollment data yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions + Recent Users */}
      <div className="mobile-col-1 mobile-flex-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <section>
          <h2 style={{ fontSize: 20, marginBottom: 16, color: "var(--text-1)" }}>Quick Actions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { icon: Users, label: "Manage Users", desc: "View and manage all user accounts", href: "/dashboard/admin/users", color: "#2563EB", bg: "#EFF6FF" },
              { icon: BookOpen, label: "Manage Courses", desc: "Review and manage all courses", href: "/dashboard/admin/courses", color: "#059669", bg: "#ECFDF5" },
              { icon: BarChart2, label: "View Analytics", desc: "Detailed platform performance metrics", href: "/dashboard/admin/analytics", color: "#F59E0B", bg: "#FFFBEB" },
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
