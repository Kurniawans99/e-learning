"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  GraduationCap, Users, Search, BookOpen,
  Clock, BarChart2, User
} from "lucide-react";

type StudentEnrollment = {
  id: string;
  user_id: string;
  progress: number;
  status: string;
  enrolled_at: string;
  courses: {
    title: string;
    slug: string;
  };
  user_name?: string;
};

export default function TeacherStudentsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("all");

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      const { data: me } = await supabase.from("users").select("role").eq("id", user.id).single();
      if (me?.role !== "teacher" && me?.role !== "admin") { router.push("/dashboard"); return; }

      const { data: instructor } = await supabase
        .from("instructors")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (instructor) {
        // Get courses by this teacher
        const { data: teacherCourses } = await supabase
          .from("courses")
          .select("id, title, slug")
          .eq("instructor_id", instructor.id);

        const coursesArr = teacherCourses || [];
        setCourses(coursesArr);

        if (coursesArr.length > 0) {
          const courseIds = coursesArr.map(c => c.id);
          
          // Get enrollments for these courses
          const { data: enrollData } = await supabase
            .from("user_enrollments")
            .select("id, user_id, progress, status, enrolled_at, courses(title, slug)")
            .in("course_id", courseIds)
            .order("enrolled_at", { ascending: false });

          if (enrollData) {
            // Fetch user names for each enrollment
            const userIds = [...new Set(enrollData.map((e: any) => e.user_id))];
            const { data: usersData } = await supabase
              .from("users")
              .select("id, full_name")
              .in("id", userIds);

            const userMap = new Map((usersData || []).map(u => [u.id, u.full_name || "Unknown"]));
            
            setEnrollments(enrollData.map((e: any) => ({
              ...e,
              user_name: userMap.get(e.user_id) || "Unknown Student",
            })));
          }
        }
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const filtered = enrollments.filter(e => {
    const matchesCourse = selectedCourse === "all" || (e.courses as any)?.title === selectedCourse;
    const matchesSearch = (e.user_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCourse && matchesSearch;
  });

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

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <GraduationCap size={14} color="#059669" />
          <span style={{ fontSize: 12, color: "#059669", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>STUDENTS</span>
        </div>
        <h1 style={{ fontSize: "clamp(24px, 3vw, 36px)", marginBottom: 12, color: "var(--text-1)" }}>Student Progress</h1>
        <p style={{ color: "var(--text-2)", fontSize: 15, lineHeight: 1.6, maxWidth: 500 }}>
          Track enrollment and progress of students in your courses.
        </p>
      </div>

      {/* Stats */}
      <div className="mobile-col-2" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { icon: Users, label: "Total Students", value: enrollments.length, color: "#2563EB", bg: "#EFF6FF" },
          { icon: BarChart2, label: "Active", value: enrollments.filter(e => e.status === "active").length, color: "#0EA5E9", bg: "#F0F9FF" },
          { icon: GraduationCap, label: "Completed", value: enrollments.filter(e => e.status === "completed").length, color: "#10B981", bg: "#ECFDF5" },
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

      {/* Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "white", borderRadius: 10, padding: "8px 14px", border: "1.5px solid var(--border)", flex: "1 1 200px", maxWidth: 300 }}>
          <Search size={14} color="var(--text-3)" />
          <input type="text" placeholder="Search students..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, color: "var(--text-1)", fontFamily: "'Inter', sans-serif", width: "100%" }}
          />
        </div>
        {courses.length > 1 && (
          <select
            value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
            style={{
              appearance: "none", background: "white",
              border: "1.5px solid var(--border)", borderRadius: 10,
              padding: "8px 32px 8px 14px", fontSize: 13, fontWeight: 600,
              color: "var(--text-1)", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <option value="all">All Courses</option>
            {courses.map(c => (
              <option key={c.id} value={c.title}>{c.title}</option>
            ))}
          </select>
        )}
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
            {searchQuery ? "No students match your search" : "No students enrolled yet"}
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-3)" }}>
            {searchQuery ? "Try a different search term." : "Students will appear here once they enroll in your courses."}
          </p>
        </div>
      )}
    </>
  );
}
