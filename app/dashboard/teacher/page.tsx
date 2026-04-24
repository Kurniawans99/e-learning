"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen, Users, Star, TrendingUp,
  PlusCircle, ArrowRight, GraduationCap,
  Clock, BarChart2, Zap
} from "lucide-react";

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

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      const { data: me } = await supabase.from("users").select("role").eq("id", user.id).single();
      if (me?.role !== "teacher" && me?.role !== "admin") { router.push("/dashboard"); return; }

      // Get instructor record linked to this user
      const { data: instructor } = await supabase
        .from("instructors")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (instructor) {
        const { data: coursesData } = await supabase
          .from("courses")
          .select("id, slug, title, subtitle, category, level, rating, student_count, hours, review_count, created_at")
          .eq("instructor_id", instructor.id)
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
      }

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <GraduationCap size={14} color="#059669" />
            <span style={{ fontSize: 12, color: "#059669", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>TEACHER PANEL</span>
          </div>
          <h1 style={{ fontSize: "clamp(24px, 3vw, 36px)", marginBottom: 12, color: "var(--text-1)" }}>Teacher Dashboard</h1>
          <p style={{ color: "var(--text-2)", fontSize: 15, lineHeight: 1.6, maxWidth: 500 }}>
            Manage your courses and track student progress.
          </p>
        </div>
        <Link href="/dashboard/teacher/create-course" className="btn-primary" style={{ fontSize: 14, padding: "10px 20px", textDecoration: "none" }}>
          <PlusCircle size={16} /> Create Course
        </Link>
      </div>

      {/* Stats */}
      <div className="mobile-col-2" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 36 }}>
        {[
          { icon: BookOpen, label: "My Courses", value: stats.courseCount, color: "#059669", bg: "#ECFDF5", sub: "published" },
          { icon: Users, label: "Total Students", value: stats.totalStudents, color: "#2563EB", bg: "#EFF6FF", sub: "enrolled" },
          { icon: Star, label: "Avg Rating", value: stats.avgRating || "—", color: "#F59E0B", bg: "#FFFBEB", sub: "across all courses" },
          { icon: Clock, label: "Total Hours", value: stats.totalHours, color: "#0EA5E9", bg: "#F0F9FF", sub: "of content" },
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

      {/* Quick Actions + Recent courses */}
      <div className="mobile-col-1 mobile-flex-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Quick Actions */}
        <section>
          <h2 style={{ fontSize: 20, marginBottom: 16, color: "var(--text-1)" }}>Quick Actions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { icon: PlusCircle, label: "Create New Course", desc: "Design and publish a new course", href: "/dashboard/teacher/create-course", color: "#059669", bg: "#ECFDF5" },
              { icon: BookOpen, label: "Manage Courses", desc: "Edit and manage your courses", href: "/dashboard/teacher/courses", color: "#2563EB", bg: "#EFF6FF" },
              { icon: Users, label: "View Students", desc: "Track student enrollment and progress", href: "/dashboard/teacher/students", color: "#F59E0B", bg: "#FFFBEB" },
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

        {/* Recent Courses */}
        <section>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, color: "var(--text-1)" }}>My Recent Courses</h2>
            {courses.length > 3 && (
              <Link href="/dashboard/teacher/courses" style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>View all →</Link>
            )}
          </div>
          {courses.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {courses.slice(0, 3).map(course => (
                <Link key={course.id} href={`/courses/${course.slug}`} style={{ textDecoration: "none" }}>
                  <div className="card-hover" style={{
                    background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px",
                    boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
                  }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>{course.title}</h3>
                    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4 }}><Users size={10} />{course.student_count}</span>
                      <span style={{ fontSize: 11, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4 }}><Star size={10} fill="#F59E0B" color="#F59E0B" />{course.rating?.toFixed(1)}</span>
                      <span style={{ fontSize: 11, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4 }}><Clock size={10} />{course.hours}h</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "48px 24px", background: "white", border: "1px dashed var(--border)", borderRadius: 14 }}>
              <BookOpen size={32} color="var(--text-3)" style={{ marginBottom: 12 }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: "var(--text-1)" }}>No courses yet</h3>
              <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 16 }}>Create your first course to start teaching.</p>
              <Link href="/dashboard/teacher/create-course" className="btn-primary" style={{ textDecoration: "none", fontSize: 13 }}>
                <PlusCircle size={14} /> Create Course
              </Link>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
