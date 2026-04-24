"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen, Users, Star, Clock, PlusCircle,
  Edit3, Trash2, GraduationCap, BarChart2,
  CheckCircle2
} from "lucide-react";

export default function TeacherCoursesPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

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
        const { data } = await supabase
          .from("courses")
          .select("id, slug, title, subtitle, category, level, rating, student_count, hours, review_count, created_at")
          .eq("instructor_id", instructor.id)
          .order("created_at", { ascending: false });
        setCourses(data || []);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleDelete = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    setDeleting(courseId);
    try {
      const { error } = await supabase.from("courses").delete().eq("id", courseId);
      if (error) throw error;
      setCourses(prev => prev.filter(c => c.id !== courseId));
      setSuccessMsg("Course deleted successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ height: 100, borderRadius: 14, animation: "shimmer 1.5s infinite", backgroundImage: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)", backgroundSize: "200% 100%" }} />
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
            <span style={{ fontSize: 12, color: "#059669", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>MY COURSES</span>
          </div>
          <h1 style={{ fontSize: "clamp(24px, 3vw, 36px)", marginBottom: 12, color: "var(--text-1)" }}>Published Courses</h1>
          <p style={{ color: "var(--text-2)", fontSize: 15, lineHeight: 1.6, maxWidth: 500 }}>
            Manage and track all your published courses.
          </p>
        </div>
        <Link href="/dashboard/teacher/create-course" className="btn-primary" style={{ fontSize: 14, padding: "10px 20px", textDecoration: "none" }}>
          <PlusCircle size={16} /> New Course
        </Link>
      </div>

      {successMsg && (
        <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10B981", padding: "12px 16px", borderRadius: 10, fontSize: 13, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {/* Course list */}
      {courses.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {courses.map(course => (
            <div key={course.id} style={{
              background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: "20px",
              display: "grid", gridTemplateColumns: "60px 1fr auto", gap: 16, alignItems: "center",
              boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
            }}>
              <div style={{
                width: 60, height: 48, borderRadius: 10, background: "var(--primary-subtle)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, fontWeight: 800, color: "var(--primary)", opacity: 0.5,
              }}>
                {course.title.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>{course.title}</h3>
                <p style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 8 }}>{course.subtitle}</p>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4 }}><Users size={10} />{course.student_count} students</span>
                  <span style={{ fontSize: 11, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4 }}><Star size={10} fill="#F59E0B" color="#F59E0B" />{course.rating?.toFixed(1)}</span>
                  <span style={{ fontSize: 11, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4 }}><Clock size={10} />{course.hours}h</span>
                  <span style={{ fontSize: 11, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4 }}><BarChart2 size={10} />{course.level}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <Link href={`/courses/${course.slug}`} style={{
                  display: "flex", alignItems: "center", gap: 4,
                  background: "var(--primary-subtle)", color: "var(--primary)",
                  border: "1px solid rgba(37,99,235,0.2)", borderRadius: 8,
                  padding: "6px 12px", fontSize: 12, fontWeight: 600, textDecoration: "none",
                }}>
                  <Edit3 size={12} /> View
                </Link>
                <button onClick={() => handleDelete(course.id)} disabled={deleting === course.id} style={{
                  display: "flex", alignItems: "center", gap: 4,
                  background: "rgba(239,68,68,0.08)", color: "#EF4444",
                  border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8,
                  padding: "6px 12px", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", opacity: deleting === course.id ? 0.5 : 1,
                }}>
                  <Trash2 size={12} /> {deleting === course.id ? "..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "64px 32px", background: "white", border: "1px dashed var(--border)", borderRadius: 16 }}>
          <BookOpen size={40} color="var(--text-3)" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "var(--text-1)" }}>No courses yet</h3>
          <p style={{ fontSize: 14, color: "var(--text-3)", marginBottom: 24 }}>Create your first course to start teaching on IntelliCourse.</p>
          <Link href="/dashboard/teacher/create-course" className="btn-primary" style={{ textDecoration: "none" }}>
            <PlusCircle size={16} /> Create Your First Course
          </Link>
        </div>
      )}
    </>
  );
}
