"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen, Users, Star, TrendingUp,
  PlusCircle, ArrowRight, GraduationCap,
  Clock, BarChart2, Zap, Download, Activity,
  Award, FileText, CalendarDays
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, Legend
} from "recharts";
import { exportToExcel, formatDateForExport } from "@/lib/export-utils";

const COLORS = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#0EA5E9"];
const SCORE_RANGES = ["0-20", "21-40", "41-60", "61-80", "81-100"];
const SCORE_COLORS: Record<string, string> = {
  "0-20": "#EF4444", "21-40": "#F59E0B", "41-60": "#0EA5E9", "61-80": "#2563EB", "81-100": "#10B981",
};

export default function TeacherDashboardPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    courseCount: 0,
    totalStudents: 0,
    avgRating: 0,
    totalHours: 0,
  });
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      const { data: me } = await supabase.from("users").select("role").eq("id", user.id).single();
      if (me?.role !== "teacher" && me?.role !== "admin") { router.push("/dashboard"); return; }

      // Get instructor record
      const { data: instructors } = await supabase
        .from("instructors")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      if (instructors && instructors.length > 0) {
        const instructorId = instructors[0].id;

        // Get courses
        const { data: coursesData } = await supabase
          .from("courses")
          .select("id, slug, title, subtitle, category, level, rating, student_count, hours, review_count, created_at")
          .eq("instructor_id", instructorId)
          .order("created_at", { ascending: false });

        const coursesArr = coursesData || [];
        setCourses(coursesArr);

        const totalStudents = coursesArr.reduce((sum, c) => sum + (c.student_count || 0), 0);
        const avgRating = coursesArr.length > 0 ? coursesArr.reduce((sum, c) => sum + (c.rating || 0), 0) / coursesArr.length : 0;
        const totalHours = coursesArr.reduce((sum, c) => sum + (c.hours || 0), 0);

        setStats({
          courseCount: coursesArr.length,
          totalStudents,
          avgRating: Number(avgRating.toFixed(1)),
          totalHours,
        });

        if (coursesArr.length > 0) {
          const courseIds = coursesArr.map(c => c.id);

          // Get enrollments
          const { data: enrollData } = await supabase
            .from("user_enrollments")
            .select("id, user_id, course_id, progress, status, enrolled_at, last_accessed_at, completed_at")
            .in("course_id", courseIds)
            .order("enrolled_at", { ascending: false });

          if (enrollData) {
            // Fetch user names
            const userIds = [...new Set(enrollData.map(e => e.user_id))];
            const { data: usersData } = await supabase.from("users").select("id, full_name").in("id", userIds);
            const userMap = new Map((usersData || []).map(u => [u.id, u.full_name || "Unknown"]));
            const courseMap = new Map(coursesArr.map(c => [c.id, c.title]));

            const enriched = enrollData.map(e => ({
              ...e,
              user_name: userMap.get(e.user_id) || "Unknown",
              course_title: courseMap.get(e.course_id) || "Unknown",
            }));
            setEnrollments(enriched);

            // Build recent activity
            const activities = enriched.slice(0, 8).map(e => ({
              type: "enrollment",
              name: e.user_name,
              detail: `enrolled in ${e.course_title}`,
              date: e.enrolled_at,
            }));
            setRecentActivity(activities);
          }

          // Get submissions for score distribution
          const { data: assessments } = await supabase
            .from("assessments")
            .select("id, title, course_id, passing_score")
            .in("course_id", courseIds);

          if (assessments && assessments.length > 0) {
            const assessmentIds = assessments.map(a => a.id);
            const { data: subsData } = await supabase
              .from("student_submissions")
              .select("id, assessment_id, student_id, status, score, submitted_at, graded_at")
              .in("assessment_id", assessmentIds)
              .not("status", "eq", "in_progress")
              .order("submitted_at", { ascending: false });

            if (subsData) {
              const assessmentMap = new Map(assessments.map(a => [a.id, a]));
              const userIds2 = [...new Set(subsData.map(s => s.student_id))];
              const { data: usersData2 } = await supabase.from("users").select("id, full_name").in("id", userIds2);
              const userMap2 = new Map((usersData2 || []).map(u => [u.id, u.full_name || "Unknown"]));
              const courseMap2 = new Map(coursesArr.map(c => [c.id, c.title]));

              const enrichedSubs = subsData.map(s => {
                const assessment = assessmentMap.get(s.assessment_id);
                return {
                  ...s,
                  student_name: userMap2.get(s.student_id) || "Unknown",
                  assessment_title: assessment?.title || "Unknown",
                  course_title: courseMap2.get(assessment?.course_id) || "Unknown",
                  passing_score: assessment?.passing_score || 60,
                };
              });
              setSubmissions(enrichedSubs);

              // Add submission activities
              const subActivities = enrichedSubs.slice(0, 4).map(s => ({
                type: "submission",
                name: s.student_name,
                detail: `submitted ${s.assessment_title}`,
                date: s.submitted_at,
              }));
              setRecentActivity(prev => {
                const merged = [...prev, ...subActivities].sort((a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime()
                );
                return merged.slice(0, 8);
              });
            }
          }
        }
      }

      setLoading(false);
    }
    fetchData();
  }, []);

  // Compute chart data
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

  const scoreDistribution = useMemo(() => {
    const ranges = { "0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0 };
    submissions.filter(s => s.status === "graded" && s.score !== null).forEach(s => {
      if (s.score <= 20) ranges["0-20"]++;
      else if (s.score <= 40) ranges["21-40"]++;
      else if (s.score <= 60) ranges["41-60"]++;
      else if (s.score <= 80) ranges["61-80"]++;
      else ranges["81-100"]++;
    });
    return Object.entries(ranges).map(([range, count]) => ({ range, count, fill: SCORE_COLORS[range] }));
  }, [submissions]);

  const statusDistribution = useMemo(() => {
    const counts = { Active: 0, Completed: 0, Paused: 0 };
    enrollments.forEach(e => {
      if (e.status === "active") counts.Active++;
      else if (e.status === "completed") counts.Completed++;
      else if (e.status === "paused") counts.Paused++;
    });
    return Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [enrollments]);

  const topStudents = useMemo(() => {
    const studentScores: Record<string, { name: string; total: number; count: number }> = {};
    submissions.filter(s => s.status === "graded" && s.score !== null).forEach(s => {
      if (!studentScores[s.student_id]) {
        studentScores[s.student_id] = { name: s.student_name, total: 0, count: 0 };
      }
      studentScores[s.student_id].total += s.score;
      studentScores[s.student_id].count++;
    });
    return Object.values(studentScores)
      .map(s => ({ name: s.name, avgScore: Math.round(s.total / s.count), count: s.count }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 5);
  }, [submissions]);

  const handleExport = () => {
    const courseSheet = courses.map(c => ({
      "Course Title": c.title,
      "Category": c.category,
      "Level": c.level,
      "Rating": c.rating ?? "—",
      "Students": c.student_count ?? 0,
      "Hours": c.hours,
      "Created": formatDateForExport(c.created_at),
    }));

    const enrollmentSheet = enrollments.map(e => ({
      "Student": e.user_name,
      "Course": e.course_title,
      "Progress": `${e.progress}%`,
      "Status": e.status,
      "Enrolled At": formatDateForExport(e.enrolled_at),
      "Last Accessed": formatDateForExport(e.last_accessed_at),
      "Completed At": formatDateForExport(e.completed_at),
    }));

    const submissionSheet = submissions.map(s => ({
      "Student": s.student_name,
      "Assessment": s.assessment_title,
      "Course": s.course_title,
      "Status": s.status,
      "Score": s.score ?? "—",
      "Passing Score": s.passing_score,
      "Result": s.score !== null ? (s.score >= s.passing_score ? "Passed" : "Failed") : "Pending",
      "Submitted At": formatDateForExport(s.submitted_at),
      "Graded At": formatDateForExport(s.graded_at),
    }));

    exportToExcel([
      { name: "Courses", data: courseSheet },
      { name: "Enrollments", data: enrollmentSheet },
      { name: "Submissions", data: submissionSheet },
    ], "Teacher_Dashboard_Report");
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

  const gradedSubs = submissions.filter(s => s.status === "graded" && s.score !== null);
  const avgScore = gradedSubs.length > 0 ? Math.round(gradedSubs.reduce((s, x) => s + x.score, 0) / gradedSubs.length) : 0;
  const pendingCount = submissions.filter(s => s.status === "submitted").length;

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <GraduationCap size={14} color="#059669" />
            <span style={{ fontSize: 12, color: "#059669", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>TEACHER PANEL</span>
          </div>
          <h1 style={{ fontSize: "clamp(24px, 3vw, 36px)", marginBottom: 12, color: "var(--text-1)" }}>Teacher Dashboard</h1>
          <p style={{ color: "var(--text-2)", fontSize: 15, lineHeight: 1.6, maxWidth: 500 }}>
            Manage your courses and track student progress with interactive analytics.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={handleExport} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "10px 18px",
            background: "white", border: "1.5px solid var(--border)", borderRadius: 12,
            fontSize: 13, fontWeight: 700, color: "var(--text-1)", cursor: "pointer",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            boxShadow: "0 1px 4px rgba(15,23,42,0.06)", transition: "all 0.15s",
          }}>
            <Download size={15} /> Export Data
          </button>
          <Link href="/dashboard/teacher/create-course" className="btn-primary" style={{ fontSize: 14, padding: "10px 20px", textDecoration: "none" }}>
            <PlusCircle size={16} /> Create Course
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mobile-col-2" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        {[
          { icon: BookOpen, label: "My Courses", value: stats.courseCount, color: "#059669", bg: "#ECFDF5", sub: "published" },
          { icon: Users, label: "Total Students", value: stats.totalStudents, color: "#2563EB", bg: "#EFF6FF", sub: `${enrollments.filter(e => e.status === 'active').length} active now` },
          { icon: Star, label: "Avg Rating", value: stats.avgRating || "—", color: "#F59E0B", bg: "#FFFBEB", sub: "across all courses" },
          { icon: BarChart2, label: "Avg Score", value: avgScore ? `${avgScore}%` : "—", color: "#0EA5E9", bg: "#F0F9FF", sub: `${pendingCount} pending review` },
        ].map(stat => (
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

      {/* Charts Row 1: Enrollment Trend + Status Distribution */}
      <div className="mobile-col-1 mobile-flex-col" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 24 }}>
        {/* Enrollment Trend */}
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: 24, boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp size={16} color="#2563EB" />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>Enrollment Trends</h3>
              <p style={{ fontSize: 11, color: "var(--text-3)" }}>Student enrollments over the last 6 months</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={enrollmentTrend}>
              <defs>
                <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 12 }}
              />
              <Area type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2.5} fill="url(#enrollGrad)" name="Enrollments" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: 24, boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>Student Status</h3>
          <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 16 }}>Enrollment status breakdown</p>
          {statusDistribution.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%" cy="50%"
                    innerRadius={45} outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid #E2E8F0" }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                {statusDistribution.map((s, i) => (
                  <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[i % COLORS.length] }} />
                    <span style={{ color: "var(--text-2)", flex: 1, fontWeight: 500 }}>{s.name}</span>
                    <span style={{ fontWeight: 700, color: "var(--text-1)" }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: 32, color: "var(--text-3)", fontSize: 13 }}>No enrollment data yet.</div>
          )}
        </div>
      </div>

      {/* Charts Row 2: Score Distribution + Top Students */}
      <div className="mobile-col-1 mobile-flex-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        {/* Score Distribution */}
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: 24, boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "#F0F9FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BarChart2 size={16} color="#0EA5E9" />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>Score Distribution</h3>
              <p style={{ fontSize: 11, color: "var(--text-3)" }}>Student scores across all assessments</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={scoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="range" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Students">
                {scoreDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Students */}
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: 24, boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "#FFFBEB", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Award size={16} color="#F59E0B" />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>Top Students</h3>
              <p style={{ fontSize: 11, color: "var(--text-3)" }}>By average assessment score</p>
            </div>
          </div>
          {topStudents.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {topStudents.map((student, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: i === 0 ? "rgba(245,158,11,0.06)" : "transparent", borderRadius: 10, border: i === 0 ? "1px solid rgba(245,158,11,0.15)" : "1px solid transparent" }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: i === 0 ? "linear-gradient(135deg, #F59E0B, #FBBF24)" : i === 1 ? "linear-gradient(135deg, #94A3B8, #CBD5E1)" : i === 2 ? "linear-gradient(135deg, #D97706, #F59E0B)" : "var(--bg-base)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800, color: i < 3 ? "white" : "var(--text-2)",
                    border: i >= 3 ? "1px solid var(--border)" : "none",
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{student.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)" }}>{student.count} assessments</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", color: student.avgScore >= 60 ? "#10B981" : "#F59E0B" }}>
                    {student.avgScore}%
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: 32, color: "var(--text-3)", fontSize: 13 }}>No graded submissions yet.</div>
          )}
        </div>
      </div>

      {/* Quick Actions + Recent Activity */}
      <div className="mobile-col-1 mobile-flex-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Quick Actions */}
        <section>
          <h2 style={{ fontSize: 20, marginBottom: 16, color: "var(--text-1)" }}>Quick Actions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { icon: PlusCircle, label: "Create New Course", desc: "Design and publish a new course", href: "/dashboard/teacher/create-course", color: "#059669", bg: "#ECFDF5" },
              { icon: BookOpen, label: "Manage Courses", desc: "Edit and manage your courses", href: "/dashboard/teacher/courses", color: "#2563EB", bg: "#EFF6FF" },
              { icon: Users, label: "View Students", desc: "Track student enrollment and progress", href: "/dashboard/teacher/students", color: "#F59E0B", bg: "#FFFBEB" },
              { icon: FileText, label: "Review Submissions", desc: `${pendingCount} submissions pending review`, href: "/dashboard/teacher/submissions", color: "#8B5CF6", bg: "#F5F3FF" },
            ].map(action => (
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

        {/* Recent Activity */}
        <section>
          <h2 style={{ fontSize: 20, marginBottom: 16, color: "var(--text-1)" }}>Recent Activity</h2>
          <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
            {recentActivity.length > 0 ? recentActivity.map((act, i) => {
              const timeAgo = getTimeAgo(act.date);
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "14px 18px",
                  borderBottom: i < recentActivity.length - 1 ? "1px solid var(--border)" : "none",
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: act.type === "enrollment" ? "#EFF6FF" : "#F5F3FF",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    {act.type === "enrollment" ? <Users size={14} color="#2563EB" /> : <FileText size={14} color="#8B5CF6" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: "var(--text-1)" }}>
                      <span style={{ fontWeight: 700 }}>{act.name}</span>
                      {" "}<span style={{ color: "var(--text-2)" }}>{act.detail}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--text-3)", whiteSpace: "nowrap" }}>{timeAgo}</span>
                </div>
              );
            }) : (
              <div style={{ padding: 32, textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>No recent activity.</div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
