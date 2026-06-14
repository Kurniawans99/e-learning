"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  GraduationCap, Users, Search, BookOpen,
  Clock, BarChart2, User, Download, Filter,
  ArrowUpDown, ChevronDown, TrendingUp
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie
} from "recharts";
import { exportToExcel, formatDateForExport, formatPercent } from "@/lib/export-utils";

type StudentEnrollment = {
  id: string;
  user_id: string;
  course_id: string;
  progress: number;
  status: string;
  enrolled_at: string;
  last_accessed_at: string;
  completed_at: string | null;
  courses: { title: string; slug: string };
  user_name?: string;
};

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "paused", label: "Paused" },
];

const DATE_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "this_month", label: "This Month" },
  { value: "3_months", label: "Last 3 Months" },
  { value: "6_months", label: "Last 6 Months" },
];

const PROGRESS_OPTIONS = [
  { value: "all", label: "All Progress" },
  { value: "0-25", label: "0% – 25%" },
  { value: "26-50", label: "26% – 50%" },
  { value: "51-75", label: "51% – 75%" },
  { value: "76-100", label: "76% – 100%" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Most Recent" },
  { value: "progress_desc", label: "Highest Progress" },
  { value: "progress_asc", label: "Lowest Progress" },
  { value: "name_asc", label: "Name A–Z" },
];

const PROGRESS_COLORS = ["#F59E0B", "#0EA5E9", "#2563EB", "#10B981"];
const STATUS_COLORS = { Active: "#0EA5E9", Completed: "#10B981", Paused: "#F59E0B" };

export default function TeacherStudentsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [courses, setCourses] = useState<any[]>([]);

  // Filters
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDate, setSelectedDate] = useState("all");
  const [selectedProgress, setSelectedProgress] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      const { data: me } = await supabase.from("users").select("role").eq("id", user.id).single();
      if (me?.role !== "teacher" && me?.role !== "admin") { router.push("/dashboard"); return; }

      const { data: instructors } = await supabase
        .from("instructors").select("id").eq("user_id", user.id).limit(1);

      if (instructors && instructors.length > 0) {
        const { data: teacherCourses } = await supabase
          .from("courses").select("id, title, slug").eq("instructor_id", instructors[0].id);

        const coursesArr = teacherCourses || [];
        setCourses(coursesArr);

        if (coursesArr.length > 0) {
          const courseIds = coursesArr.map(c => c.id);
          const courseMap = new Map(coursesArr.map(c => [c.id, c]));

          const { data: enrollData } = await supabase
            .from("user_enrollments")
            .select("id, user_id, course_id, progress, status, enrolled_at, last_accessed_at, completed_at")
            .in("course_id", courseIds)
            .order("enrolled_at", { ascending: false });

          if (enrollData) {
            const userIds = [...new Set(enrollData.map((e: any) => e.user_id))];
            const { data: usersData } = await supabase
              .from("users").select("id, full_name").in("id", userIds);

            const userMap = new Map((usersData || []).map(u => [u.id, u.full_name || "Unknown"]));

            setEnrollments(enrollData.map((e: any) => ({
              ...e,
              user_name: userMap.get(e.user_id) || "Unknown Student",
              courses: courseMap.get(e.course_id) || { title: "Unknown Course", slug: "" }
            })));
          }
        }
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    let result = enrollments.filter(e => {
      // Course filter
      const matchesCourse = selectedCourse === "all" || (e.courses as any)?.title === selectedCourse;
      // Search
      const matchesSearch = (e.user_name || "").toLowerCase().includes(searchQuery.toLowerCase());
      // Status filter
      const matchesStatus = selectedStatus === "all" || e.status === selectedStatus;
      // Date filter
      let matchesDate = true;
      if (selectedDate !== "all") {
        const now = new Date();
        const enrollDate = new Date(e.enrolled_at);
        if (selectedDate === "this_month") {
          matchesDate = enrollDate.getMonth() === now.getMonth() && enrollDate.getFullYear() === now.getFullYear();
        } else if (selectedDate === "3_months") {
          const threeMonths = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          matchesDate = enrollDate >= threeMonths;
        } else if (selectedDate === "6_months") {
          const sixMonths = new Date(now.getFullYear(), now.getMonth() - 6, 1);
          matchesDate = enrollDate >= sixMonths;
        }
      }
      // Progress filter
      let matchesProgress = true;
      if (selectedProgress !== "all") {
        const [min, max] = selectedProgress.split("-").map(Number);
        matchesProgress = e.progress >= min && e.progress <= max;
      }
      return matchesCourse && matchesSearch && matchesStatus && matchesDate && matchesProgress;
    });

    // Sort
    switch (sortBy) {
      case "progress_desc":
        result.sort((a, b) => b.progress - a.progress);
        break;
      case "progress_asc":
        result.sort((a, b) => a.progress - b.progress);
        break;
      case "name_asc":
        result.sort((a, b) => (a.user_name || "").localeCompare(b.user_name || ""));
        break;
      case "recent":
      default:
        result.sort((a, b) => new Date(b.enrolled_at).getTime() - new Date(a.enrolled_at).getTime());
    }

    return result;
  }, [enrollments, selectedCourse, searchQuery, selectedStatus, selectedDate, selectedProgress, sortBy]);

  // Chart data
  const progressDistribution = useMemo(() => {
    const ranges = [
      { range: "0–25%", min: 0, max: 25, count: 0 },
      { range: "26–50%", min: 26, max: 50, count: 0 },
      { range: "51–75%", min: 51, max: 75, count: 0 },
      { range: "76–100%", min: 76, max: 100, count: 0 },
    ];
    filtered.forEach(e => {
      const r = ranges.find(r => e.progress >= r.min && e.progress <= r.max);
      if (r) r.count++;
    });
    return ranges;
  }, [filtered]);

  const statusChart = useMemo(() => {
    const counts: Record<string, number> = { Active: 0, Completed: 0, Paused: 0 };
    filtered.forEach(e => {
      if (e.status === "active") counts.Active++;
      else if (e.status === "completed") counts.Completed++;
      else if (e.status === "paused") counts.Paused++;
    });
    return Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const handleExport = () => {
    const data = filtered.map(e => ({
      "Student Name": e.user_name,
      "Course": (e.courses as any)?.title || "",
      "Progress": `${e.progress}%`,
      "Status": e.status,
      "Enrolled At": formatDateForExport(e.enrolled_at),
      "Last Accessed": formatDateForExport(e.last_accessed_at),
      "Completed At": formatDateForExport(e.completed_at),
    }));
    exportToExcel([{ name: "Student Enrollments", data }], "Teacher_Students_Report");
  };

  function statusColor(status: string) {
    switch (status) {
      case "active": return { text: "#0EA5E9", bg: "#F0F9FF", border: "rgba(14,165,233,0.2)" };
      case "completed": return { text: "#10B981", bg: "#ECFDF5", border: "rgba(16,185,129,0.2)" };
      case "paused": return { text: "#F59E0B", bg: "#FFFBEB", border: "rgba(245,158,11,0.2)" };
      default: return { text: "var(--text-3)", bg: "var(--bg-base)", border: "var(--border)" };
    }
  }

  function progressColor(progress: number) {
    if (progress >= 100) return "#10B981";
    if (progress >= 50) return "var(--primary)";
    if (progress >= 25) return "#0EA5E9";
    return "#F59E0B";
  }

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ height: 72, borderRadius: 12, animation: "shimmer 1.5s infinite", backgroundImage: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)", backgroundSize: "200% 100%" }} />
        ))}
      </div>
    );
  }

  const selectStyle: React.CSSProperties = {
    appearance: "none", background: "white",
    border: "1.5px solid var(--border)", borderRadius: 10,
    padding: "8px 32px 8px 14px", fontSize: 12, fontWeight: 600,
    color: "var(--text-1)", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2394A3B8' viewBox='0 0 24 24'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
  };

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <GraduationCap size={14} color="#059669" />
            <span style={{ fontSize: 12, color: "#059669", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>STUDENTS</span>
          </div>
          <h1 style={{ fontSize: "clamp(24px, 3vw, 36px)", marginBottom: 12, color: "var(--text-1)" }}>Student Progress</h1>
          <p style={{ color: "var(--text-2)", fontSize: 15, lineHeight: 1.6, maxWidth: 500 }}>
            Track enrollment and progress of students in your courses.
          </p>
        </div>
        <button onClick={handleExport} style={{
          display: "flex", alignItems: "center", gap: 8, padding: "10px 18px",
          background: "white", border: "1.5px solid var(--border)", borderRadius: 12,
          fontSize: 13, fontWeight: 700, color: "var(--text-1)", cursor: "pointer",
          fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: "0 1px 4px rgba(15,23,42,0.06)",
        }}>
          <Download size={15} /> Export Students
        </button>
      </div>

      {/* Stats */}
      <div className="mobile-col-2" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { icon: Users, label: "Total Enrolled", value: enrollments.length, color: "#2563EB", bg: "#EFF6FF" },
          { icon: BarChart2, label: "Active", value: enrollments.filter(e => e.status === "active").length, color: "#0EA5E9", bg: "#F0F9FF" },
          { icon: GraduationCap, label: "Completed", value: enrollments.filter(e => e.status === "completed").length, color: "#10B981", bg: "#ECFDF5" },
          { icon: TrendingUp, label: "Avg Progress", value: `${enrollments.length > 0 ? Math.round(enrollments.reduce((s, e) => s + e.progress, 0) / enrollments.length) : 0}%`, color: "#8B5CF6", bg: "#F5F3FF" },
        ].map(stat => (
          <div key={stat.label} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <stat.icon size={16} color={stat.color} />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts: Progress Distribution + Status */}
      <div className="mobile-col-1 mobile-flex-col" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 24 }}>
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: 24, boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>Progress Distribution</h3>
          <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 16 }}>How students are progressing ({filtered.length} shown)</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={progressDistribution}>
              <XAxis dataKey="range" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Students">
                {progressDistribution.map((_, i) => (
                  <Cell key={i} fill={PROGRESS_COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: 24, boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>Status Breakdown</h3>
          <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 12 }}>Filtered results</p>
          {statusChart.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={statusChart} cx="50%" cy="50%" innerRadius={38} outerRadius={58} paddingAngle={3} dataKey="value">
                    {statusChart.map((entry, i) => (
                      <Cell key={i} fill={(STATUS_COLORS as any)[entry.name] || "#94A3B8"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 8 }}>
                {statusChart.map(s => (
                  <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: (STATUS_COLORS as any)[s.name] || "#94A3B8" }} />
                    <span style={{ color: "var(--text-2)", flex: 1, fontWeight: 500 }}>{s.name}</span>
                    <span style={{ fontWeight: 700, color: "var(--text-1)" }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: 20, color: "var(--text-3)", fontSize: 13 }}>No data</div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "white", borderRadius: 10, padding: "8px 14px", border: "1.5px solid var(--border)", flex: "1 1 200px", maxWidth: 280 }}>
          <Search size={14} color="var(--text-3)" />
          <input type="text" placeholder="Search students..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, color: "var(--text-1)", fontFamily: "'Inter', sans-serif", width: "100%" }}
          />
        </div>
        {courses.length > 1 && (
          <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} style={selectStyle}>
            <option value="all">All Courses</option>
            {courses.map(c => <option key={c.id} value={c.title}>{c.title}</option>)}
          </select>
        )}
        <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} style={selectStyle}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={selectStyle}>
          {DATE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={selectedProgress} onChange={e => setSelectedProgress(e.target.value)} style={selectStyle}>
          {PROGRESS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...selectStyle, borderColor: sortBy !== "recent" ? "rgba(37,99,235,0.3)" : "var(--border)", color: sortBy !== "recent" ? "#2563EB" : "var(--text-1)" }}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Results count */}
      <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 12, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        Showing <strong style={{ color: "var(--text-1)" }}>{filtered.length}</strong> of {enrollments.length} students
      </div>

      {/* Student list */}
      {filtered.length > 0 ? (
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
          {filtered.map((enrollment, i) => {
            const sc = statusColor(enrollment.status);
            const pc = progressColor(enrollment.progress);
            return (
              <div key={enrollment.id} style={{
                display: "grid", gridTemplateColumns: "1fr 200px 80px 100px", gap: 16,
                padding: "14px 20px", alignItems: "center",
                borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
              }}>
                {/* Student */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: "linear-gradient(135deg, var(--primary-dark), var(--primary-light))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, color: "white", flexShrink: 0,
                  }}>
                    {(enrollment.user_name || "S").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{enrollment.user_name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)" }}>{(enrollment.courses as any)?.title}</div>
                  </div>
                </div>

                {/* Progress */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className="progress-bar" style={{ flex: 1, height: 6 }}>
                    <div className="progress-fill" style={{ width: `${enrollment.progress}%`, background: pc }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: pc, fontFamily: "'Plus Jakarta Sans', sans-serif", minWidth: 36 }}>{enrollment.progress}%</span>
                </div>

                {/* Status */}
                <span style={{
                  fontSize: 10, fontWeight: 700, color: sc.text, background: sc.bg,
                  border: `1px solid ${sc.border}`, padding: "3px 8px", borderRadius: 99,
                  textTransform: "uppercase", textAlign: "center",
                }}>{enrollment.status}</span>

                {/* Date */}
                <div style={{ fontSize: 11, color: "var(--text-3)", textAlign: "right" }}>
                  {new Date(enrollment.enrolled_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "48px 32px", background: "white", border: "1px dashed var(--border)", borderRadius: 14 }}>
          <Users size={32} color="var(--text-3)" style={{ marginBottom: 12 }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: "var(--text-1)" }}>
            {searchQuery || selectedStatus !== "all" || selectedDate !== "all" ? "No students match your filters" : "No students enrolled yet"}
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-3)" }}>
            {searchQuery || selectedStatus !== "all" || selectedDate !== "all" ? "Try adjusting your filter criteria." : "Students will appear here once they enroll in your courses."}
          </p>
        </div>
      )}
    </>
  );
}
