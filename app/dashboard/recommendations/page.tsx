"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import {
  Sparkles, Clock, BarChart2, Star, ArrowRight,
  BookOpen, Users, TrendingUp, Zap, Brain, Loader2
} from "lucide-react";

type CourseData = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  level: string;
  hours: number;
  rating: number;
  student_count: number;
  instructors?: { name: string } | null;
};

type Recommendation = {
  course_id: string;
  match_score: number;
  reason: string;
};

function categoryColor(category: string): string {
  const map: Record<string, string> = {
    "AI & ML": "#7C3AED",
    "Engineering": "#0EA5E9",
    "Design": "#F59E0B",
    "Web3": "#10B981",
    "Web Development": "#2563EB",
    "Game Development": "#DC2626",
    "Data Science": "#059669",
  };
  return map[category] ?? "var(--primary)";
}

function categoryBadge(category: string) {
  const colors: Record<string, { bg: string; color: string; border: string }> = {
    "AI & ML": { bg: "#F5F3FF", color: "#7C3AED", border: "rgba(124,58,237,0.2)" },
    "Engineering": { bg: "#F0F9FF", color: "#0EA5E9", border: "rgba(14,165,233,0.2)" },
    "Design": { bg: "#FFFBEB", color: "#F59E0B", border: "rgba(245,158,11,0.2)" },
    "Web3": { bg: "#ECFDF5", color: "#10B981", border: "rgba(16,185,129,0.2)" },
    "Web Development": { bg: "#EFF6FF", color: "#2563EB", border: "rgba(37,99,235,0.2)" },
    "Game Development": { bg: "#FEF2F2", color: "#DC2626", border: "rgba(220,38,38,0.2)" },
    "Data Science": { bg: "#ECFDF5", color: "#059669", border: "rgba(5,150,105,0.2)" },
  };
  return colors[category] ?? { bg: "var(--bg-base)", color: "var(--text-2)", border: "var(--border)" };
}

export default function RecommendationsPage() {
  const supabase = createClient();
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingAI, setLoadingAI] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch courses
      const { data: coursesData } = await supabase
        .from("courses")
        .select("id, slug, title, subtitle, category, level, hours, rating, student_count, instructors(name)")
        .order("rating", { ascending: false });

      if (coursesData) setCourses(coursesData as unknown as CourseData[]);

      // Fetch enrolled
      const { data: enrollments } = await supabase
        .from("user_enrollments")
        .select("course_id")
        .eq("user_id", user.id);

      if (enrollments) setEnrolledIds(new Set(enrollments.map(e => e.course_id)));
      setLoadingCourses(false);

      // Fetch AI recommendations
      try {
        const res = await fetch("/api/ai/recommend");
        const data = await res.json();
        if (data.recommendations) {
          setRecommendations(data.recommendations);
        }
      } catch {
        // Fallback: no AI recommendations
      }
      setLoadingAI(false);
    }
    fetchData();
  }, []);

  // Merge course data with AI recommendations
  const getRecoForCourse = (courseId: string) => recommendations.find(r => r.course_id === courseId);

  // Sort courses by AI recommendation score if available
  const sortedCourses = [...courses].sort((a, b) => {
    const recoA = getRecoForCourse(a.id);
    const recoB = getRecoForCourse(b.id);
    if (recoA && recoB) return recoB.match_score - recoA.match_score;
    if (recoA) return -1;
    if (recoB) return 1;
    return b.rating - a.rating;
  });

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Sparkles size={16} color="var(--primary)" />
          <span style={{ fontSize: 12, color: "var(--primary)", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>AI-POWERED</span>
        </div>
        <h1 style={{ fontSize: "clamp(24px, 3vw, 36px)", marginBottom: 12, color: "var(--text-1)" }}>Recommendations</h1>
        <p style={{ color: "var(--text-2)", fontSize: 15, lineHeight: 1.6, maxWidth: 560 }}>
          Kursus yang dipilih khusus untuk Anda berdasarkan profil belajar, level pengalaman, dan minat Anda. AI kami menganalisis progress Anda untuk memunculkan konten paling relevan.
        </p>
      </div>

      {/* AI Status banner */}
      <div style={{
        background: "linear-gradient(135deg, #1E40AF, #7C3AED)",
        borderRadius: 16, padding: "24px 28px", marginBottom: 32,
        display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: "-30%", right: "-5%", width: 200, height: 200,
          borderRadius: "50%", background: "rgba(255,255,255,0.08)", pointerEvents: "none",
        }} />
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Brain size={22} color="white" />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "white", marginBottom: 4 }}>
            {loadingAI ? "AI sedang menganalisis profil Anda..." : "Dipersonalisasi oleh Gemini AI"}
          </h3>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
            {loadingAI
              ? "Mohon tunggu sebentar sementara AI kami menyesuaikan rekomendasi."
              : `${recommendations.length} kursus direkomendasikan berdasarkan spesialisasi dan tujuan belajar Anda.`}
          </p>
        </div>
        {loadingAI && (
          <Loader2 size={24} color="white" style={{ animation: "spin 1s linear infinite" }} />
        )}
        {!loadingAI && (
          <div style={{
            background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: 12, padding: "12px 18px", textAlign: "center", backdropFilter: "blur(8px)",
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "white", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{sortedCourses.length}</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", fontWeight: 600 }}>Tersedia</div>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loadingCourses && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ height: 260, borderRadius: 16, animation: "shimmer 1.5s infinite", backgroundImage: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)", backgroundSize: "200% 100%" }} />
          ))}
        </div>
      )}

      {/* Courses grid */}
      {!loadingCourses && sortedCourses.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
          {sortedCourses.map((course, index) => {
            const reco = getRecoForCourse(course.id);
            const color = categoryColor(course.category);
            const badge = categoryBadge(course.category);
            const isEnrolled = enrolledIds.has(course.id);
            const matchScore = reco?.match_score ?? null;
            const reason = reco?.reason ?? null;

            return (
              <Link key={course.id} href={`/courses/${course.slug}`} style={{ textDecoration: "none" }}>
                <div className="card-hover" style={{
                  background: "white", border: `1px solid ${isEnrolled ? "rgba(16,185,129,0.3)" : reco ? `${color}30` : "var(--border)"}`,
                  borderRadius: 16, padding: 0, overflow: "hidden",
                  boxShadow: reco ? `0 2px 12px ${color}12` : "0 1px 4px rgba(15,23,42,0.04)",
                  position: "relative",
                }}>
                  {/* Top color strip */}
                  <div style={{ height: 4, background: color }} />

                  {isEnrolled && (
                    <div style={{
                      position: "absolute", top: 16, right: 16,
                      padding: "3px 8px", borderRadius: 6, fontSize: 9,
                      fontWeight: 700, background: "#ECFDF5", color: "#10B981",
                      border: "1px solid rgba(16,185,129,0.2)", textTransform: "uppercase",
                    }}>Enrolled</div>
                  )}

                  <div style={{ padding: "20px 20px 16px" }}>
                    {/* Category + Match */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <span style={{
                        padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                        background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`,
                      }}>{course.category}</span>
                      {matchScore !== null && (
                        <div style={{ textAlign: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Brain size={12} color={color} />
                            <span style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", color }}>{matchScore}%</span>
                          </div>
                          <div style={{ fontSize: 8, color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase" }}>AI Match</div>
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: "var(--text-1)", lineHeight: 1.3 }}>{course.title}</h3>
                    <p style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 10, lineHeight: 1.5 }}>{course.subtitle}</p>

                    {/* AI Reason */}
                    {reason && (
                      <div style={{
                        background: `${color}08`, border: `1px solid ${color}20`,
                        borderRadius: 10, padding: "8px 12px", marginBottom: 12,
                        display: "flex", gap: 6, alignItems: "flex-start",
                      }}>
                        <Sparkles size={12} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
                        <p style={{ fontSize: 11, color: "var(--text-2)", lineHeight: 1.5, margin: 0 }}>{reason}</p>
                      </div>
                    )}

                    {/* Meta */}
                    <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4 }}>
                        <Clock size={10} />{course.hours}h
                      </span>
                      <span style={{ fontSize: 11, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4 }}>
                        <BarChart2 size={10} />{course.level}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4 }}>
                        <Star size={10} fill="#F59E0B" color="#F59E0B" />{Number(course.rating).toFixed(1)}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4 }}>
                        <Users size={10} />{(course.student_count / 1000).toFixed(1)}k
                      </span>
                    </div>

                    {/* CTA */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: 8,
                          background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 700, color,
                        }}>
                          {course.instructors?.name?.charAt(0) || "?"}
                        </div>
                        <span style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500 }}>
                          {course.instructors?.name || "Instructor"}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, color, fontSize: 12, fontWeight: 600 }}>
                        Lihat <ArrowRight size={12} />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Empty */}
      {!loadingCourses && sortedCourses.length === 0 && (
        <div style={{
          textAlign: "center", padding: "64px 32px",
          background: "white", border: "1px dashed var(--border)", borderRadius: 16,
        }}>
          <Sparkles size={28} color="var(--primary)" />
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, marginTop: 16, color: "var(--text-1)" }}>Belum ada rekomendasi</h3>
          <p style={{ color: "var(--text-2)", fontSize: 14 }}>AI kami masih mempelajari preferensi Anda. Cek kembali nanti!</p>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
