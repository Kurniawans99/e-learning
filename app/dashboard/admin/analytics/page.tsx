"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  BarChart2, Shield, Users, BookOpen,
  TrendingUp, GraduationCap, Activity, Clock,
  Download, FileText, CheckCircle2, XCircle,
  CalendarDays, Target
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar, Cell, PieChart, Pie
} from "recharts";
import { exportToExcel, formatDateForExport } from "@/lib/export-utils";

const DATE_FILTERS = [
  { key: "this_week", label: "This Week" },
  { key: "this_month", label: "This Month" },
  { key: "3_months", label: "Last 3 Months" },
  { key: "this_year", label: "This Year" },
  { key: "all", label: "All Time" },
];

const CATEGORY_COLORS: Record<string, string> = {
  "AI & ML": "#2563EB", "Engineering": "#0EA5E9", "Design": "#F59E0B",
  "Web3": "#10B981", "Data Science": "#8B5CF6", "Web Development": "#059669",
  "Game Development": "#DC2626", "Cybersecurity": "#EF4444", "Mobile Dev": "#0D9488",
};

const LEVEL_COLORS: Record<string, string> = {
  "Beginner": "#10B981", "Intermediate": "#F59E0B", "Advanced": "#DC2626",
};

const SCORE_COLORS: Record<string, string> = {
  "0-20": "#EF4444", "21-40": "#F59E0B", "41-60": "#0EA5E9", "61-80": "#2563EB", "81-100": "#10B981",
};

export default function AdminAnalyticsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("all");

  // Raw data
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [allEnrollments, setAllEnrollments] = useState<any[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      const { data: me } = await supabase.from("users").select("role").eq("id", user.id).single();
      if (me?.role !== "admin") { router.push("/dashboard"); return; }

      const [usersRes, coursesRes, enrollRes, subsRes] = await Promise.all([
        supabase.from("users").select("id, full_name, role, created_at").order("created_at", { ascending: false }),
        supabase.from("courses").select("id, title, category, level, student_count, rating, hours, created_at"),
        supabase.from("user_enrollments").select("id, user_id, course_id, progress, status, enrolled_at, last_accessed_at, completed_at").order("enrolled_at", { ascending: false }),
        supabase.from("student_submissions").select("id, assessment_id, student_id, status, score, submitted_at, graded_at").not("status", "eq", "in_progress"),
      ]);

      setAllUsers(usersRes.data || []);
      setAllCourses(coursesRes.data || []);
      setAllEnrollments(enrollRes.data || []);
      setAllSubmissions(subsRes.data || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  // Date filter logic
  const getDateRange = (key: string): Date | null => {
    const now = new Date();
    switch (key) {
      case "this_week": return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "this_month": return new Date(now.getFullYear(), now.getMonth(), 1);
      case "3_months": return new Date(now.getFullYear(), now.getMonth() - 3, 1);
      case "this_year": return new Date(now.getFullYear(), 0, 1);
      default: return null;
    }
  };

  const filteredEnrollments = useMemo(() => {
    const start = getDateRange(dateFilter);
    if (!start) return allEnrollments;
    return allEnrollments.filter(e => new Date(e.enrolled_at) >= start);
  }, [allEnrollments, dateFilter]);

  const filteredSubmissions = useMemo(() => {
    const start = getDateRange(dateFilter);
    if (!start) return allSubmissions;
    return allSubmissions.filter(s => s.submitted_at && new Date(s.submitted_at) >= start);
  }, [allSubmissions, dateFilter]);

  const filteredUsers = useMemo(() => {
    const start = getDateRange(dateFilter);
    if (!start) return allUsers;
    return allUsers.filter(u => new Date(u.created_at) >= start);
  }, [allUsers, dateFilter]);

  // Stats
  const totalUsers = filteredUsers.length;
  const totalCourses = allCourses.length;
  const totalEnrollments = filteredEnrollments.length;
  const completedEnrollments = filteredEnrollments.filter(e => e.status === "completed").length;
  const activeEnrollments = filteredEnrollments.filter(e => e.status === "active").length;
  const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

  // Submissions stats
  const gradedSubs = filteredSubmissions.filter(s => s.status === "graded" && s.score !== null);
  const pendingSubs = filteredSubmissions.filter(s => s.status === "submitted");
  const avgScore = gradedSubs.length > 0 ? Math.round(gradedSubs.reduce((sum, s) => sum + s.score, 0) / gradedSubs.length) : 0;

  // Chart data
  const enrollmentTrend = useMemo(() => {
    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      months[key] = 0;
    }
    allEnrollments.forEach(e => {
      const d = new Date(e.enrolled_at);
      const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      if (months[key] !== undefined) months[key]++;
    });
    return Object.entries(months).map(([month, count]) => ({ month, count }));
  }, [allEnrollments]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allCourses.forEach(c => { counts[c.category] = (counts[c.category] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [allCourses]);

  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allCourses.forEach(c => { counts[c.level] = (counts[c.level] || 0) + 1; });
    return Object.entries(counts);
  }, [allCourses]);

  const coursePopularity = useMemo(() => {
    const courseEnroll: Record<string, { title: string; count: number }> = {};
    const courseMap = new Map(allCourses.map(c => [c.id, c.title]));
    filteredEnrollments.forEach(e => {
      const title = courseMap.get(e.course_id) || "Unknown";
      if (!courseEnroll[e.course_id]) courseEnroll[e.course_id] = { title, count: 0 };
      courseEnroll[e.course_id].count++;
    });
    return Object.values(courseEnroll).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [filteredEnrollments, allCourses]);

  const scoreDistribution = useMemo(() => {
    const ranges = { "0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0 };
    gradedSubs.forEach(s => {
      if (s.score <= 20) ranges["0-20"]++;
      else if (s.score <= 40) ranges["21-40"]++;
      else if (s.score <= 60) ranges["41-60"]++;
      else if (s.score <= 80) ranges["61-80"]++;
      else ranges["81-100"]++;
    });
    return Object.entries(ranges).map(([range, count]) => ({ range, count, fill: SCORE_COLORS[range] }));
  }, [gradedSubs]);

  const activeUsersTrend = useMemo(() => {
    const months: Record<string, Set<string>> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      months[key] = new Set();
    }
    allEnrollments.forEach(e => {
      const d = new Date(e.last_accessed_at);
      const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      if (months[key]) months[key].add(e.user_id);
    });
    return Object.entries(months).map(([month, users]) => ({ month, count: users.size }));
  }, [allEnrollments]);

  const handleExport = () => {
    const userSheet = allUsers.map(u => ({
      "Name": u.full_name || "—", "Role": u.role, "Joined": formatDateForExport(u.created_at),
    }));
    const courseSheet = allCourses.map(c => ({
      "Title": c.title, "Category": c.category, "Level": c.level,
      "Students": c.student_count ?? 0, "Rating": c.rating ?? "—",
      "Hours": c.hours, "Created": formatDateForExport(c.created_at),
    }));
    const enrollSheet = filteredEnrollments.map(e => ({
      "User ID": e.user_id, "Course ID": e.course_id,
      "Progress": `${e.progress}%`, "Status": e.status,
      "Enrolled At": formatDateForExport(e.enrolled_at),
      "Last Accessed": formatDateForExport(e.last_accessed_at),
      "Completed At": formatDateForExport(e.completed_at),
    }));
    const subSheet = filteredSubmissions.map(s => ({
      "Student ID": s.student_id, "Assessment ID": s.assessment_id,
      "Status": s.status, "Score": s.score ?? "—",
      "Submitted At": formatDateForExport(s.submitted_at),
      "Graded At": formatDateForExport(s.graded_at),
    }));
    exportToExcel([
      { name: "Users", data: userSheet },
      { name: "Courses", data: courseSheet },
      { name: "Enrollments", data: enrollSheet },
      { name: "Submissions", data: subSheet },
    ], "Admin_Analytics_Report");
  };

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Shield size={14} color="#DC2626" />
            <span style={{ fontSize: 12, color: "#DC2626", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>ADMIN</span>
          </div>
          <h1 style={{ fontSize: "clamp(24px, 3vw, 36px)", marginBottom: 12, color: "var(--text-1)" }}>Analytics</h1>
          <p style={{ color: "var(--text-2)", fontSize: 15, lineHeight: 1.6, maxWidth: 500 }}>
            Platform performance metrics and insights.
          </p>
        </div>
        <button onClick={handleExport} style={{
          display: "flex", alignItems: "center", gap: 8, padding: "10px 18px",
          background: "white", border: "1.5px solid var(--border)", borderRadius: 12,
          fontSize: 13, fontWeight: 700, color: "var(--text-1)", cursor: "pointer",
          fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: "0 1px 4px rgba(15,23,42,0.06)",
        }}>
          <Download size={15} /> Export Analytics
        </button>
      </div>

      {/* Date Range Filter */}
      <div style={{ display: "flex", gap: 4, background: "white", borderRadius: 12, padding: 4, border: "1.5px solid var(--border)", marginBottom: 24, flexWrap: "wrap", width: "fit-content" }}>
        {DATE_FILTERS.map(f => (
          <button key={f.key} onClick={() => setDateFilter(f.key)} style={{
            background: dateFilter === f.key ? "var(--primary)" : "transparent",
            border: "none", borderRadius: 9, padding: "8px 16px",
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 12,
            cursor: "pointer",
            color: dateFilter === f.key ? "white" : "var(--text-2)",
            transition: "all 0.15s",
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="mobile-col-2" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { icon: Users, label: "Users", value: totalUsers, color: "#2563EB", bg: "#EFF6FF", sub: `${dateFilter === "all" ? "all time" : "in period"}` },
          { icon: BookOpen, label: "Courses", value: totalCourses, color: "#059669", bg: "#ECFDF5", sub: "published" },
          { icon: GraduationCap, label: "Enrollments", value: totalEnrollments, color: "#F59E0B", bg: "#FFFBEB", sub: `${activeEnrollments} active, ${completedEnrollments} completed` },
          { icon: TrendingUp, label: "Completion Rate", value: `${completionRate}%`, color: "#0EA5E9", bg: "#F0F9FF", sub: "of enrollments" },
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

      {/* Submission Analytics */}
      <div style={{ background: "linear-gradient(135deg, #1E3A5F, #2563EB)", borderRadius: 14, padding: "22px 26px", marginBottom: 24, display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: "1 1 200px" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.2)" }}>
            <FileText size={20} color="white" />
          </div>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "white", marginBottom: 2 }}>Submission Analytics</h3>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>Assessment performance overview</p>
          </div>
        </div>
        {[
          { label: "Total", value: filteredSubmissions.length, color: "#E2E8F0" },
          { label: "Graded", value: gradedSubs.length, color: "#34D399" },
          { label: "Pending", value: pendingSubs.length, color: "#FBBF24" },
          { label: "Avg Score", value: `${avgScore}%`, color: "#60A5FA" },
        ].map(item => (
          <div key={item.label} style={{ textAlign: "center", padding: "8px 20px", borderRadius: 12, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", color: item.color }}>{item.value}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Charts: Enrollment Trend + Active Users */}
      <div className="mobile-col-1 mobile-flex-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: 24, boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "#FFFBEB", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp size={16} color="#F59E0B" />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>Enrollment Trends</h3>
              <p style={{ fontSize: 11, color: "var(--text-3)" }}>Monthly enrollments</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={enrollmentTrend}>
              <defs>
                <linearGradient id="enrollGradAdmin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }} />
              <Area type="monotone" dataKey="count" stroke="#F59E0B" strokeWidth={2.5} fill="url(#enrollGradAdmin)" name="Enrollments" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: 24, boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Activity size={16} color="#059669" />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>Active Users</h3>
              <p style={{ fontSize: 11, color: "var(--text-3)" }}>Unique active users per month</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={activeUsersTrend}>
              <defs>
                <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }} />
              <Area type="monotone" dataKey="count" stroke="#059669" strokeWidth={2.5} fill="url(#activeGrad)" name="Active Users" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Score Distribution + Course Popularity */}
      <div className="mobile-col-1 mobile-flex-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: 24, boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "#F5F3FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Target size={16} color="#8B5CF6" />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>Score Distribution</h3>
              <p style={{ fontSize: 11, color: "var(--text-3)" }}>All graded submissions</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={scoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="range" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Students">
                {scoreDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: 24, boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>Course Popularity</h3>
          <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 16 }}>By enrollment count</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {coursePopularity.length > 0 ? coursePopularity.map((c, i) => {
              const maxCount = coursePopularity[0].count;
              const pct = maxCount > 0 ? (c.count / maxCount) * 100 : 0;
              const colors = ["#2563EB", "#059669", "#F59E0B", "#0EA5E9", "#8B5CF6", "#DC2626", "#0D9488", "#D97706"];
              return (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "75%" }}>{c.title}</span>
                    <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 700 }}>{c.count}</span>
                  </div>
                  <div style={{ height: 6, background: "var(--bg-base)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: colors[i % colors.length], borderRadius: 99, transition: "width 0.5s" }} />
                  </div>
                </div>
              );
            }) : (
              <div style={{ textAlign: "center", padding: 20, color: "var(--text-3)", fontSize: 13 }}>No data.</div>
            )}
          </div>
        </div>
      </div>

      {/* Breakdowns: Categories + Levels */}
      <div className="mobile-col-1 mobile-flex-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: 24, boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: "var(--text-1)" }}>Courses by Category</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {categoryCounts.map(([category, count]) => {
              const pct = totalCourses > 0 ? Math.round((count / totalCourses) * 100) : 0;
              const color = CATEGORY_COLORS[category] || "#94A3B8";
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
            {categoryCounts.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center" }}>No data yet.</p>
            )}
          </div>
        </div>

        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: 24, boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: "var(--text-1)" }}>Courses by Level</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {levelCounts.map(([level, count]) => {
              const pct = totalCourses > 0 ? Math.round((count / totalCourses) * 100) : 0;
              const color = LEVEL_COLORS[level] || "#94A3B8";
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
            {levelCounts.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center" }}>No data yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Engagement Metric */}
      <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: 24, boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <Activity size={16} color="var(--primary)" />
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>Engagement Metric</span>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 16 }}>Average courses per user</p>
        <div style={{ fontSize: 42, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--primary)" }}>
          {allUsers.length > 0 ? (allEnrollments.length / allUsers.length).toFixed(1) : 0}
        </div>
      </div>
    </>
  );
}
