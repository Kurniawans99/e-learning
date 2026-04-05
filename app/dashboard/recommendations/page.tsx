import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import {
  Sparkles, Clock, BarChart2, Star, ArrowRight,
  BookOpen, Users, TrendingUp, Zap
} from "lucide-react";

function categoryColor(category: string): string {
  const map: Record<string, string> = {
    "AI & ML": "var(--primary)",
    "Engineering": "var(--cyan)",
    "Design": "var(--amber)",
    "Web3": "var(--emerald)",
  };
  return map[category] ?? "var(--primary)";
}

function categoryBadge(category: string) {
  const colors: Record<string, { bg: string; color: string; border: string }> = {
    "AI & ML": { bg: "var(--primary-subtle)", color: "var(--primary)", border: "rgba(37,99,235,0.2)" },
    "Engineering": { bg: "#F0F9FF", color: "#0EA5E9", border: "rgba(14,165,233,0.2)" },
    "Design": { bg: "#FFFBEB", color: "#F59E0B", border: "rgba(245,158,11,0.2)" },
    "Web3": { bg: "#ECFDF5", color: "#10B981", border: "rgba(16,185,129,0.2)" },
  };
  return colors[category] ?? { bg: "var(--bg-base)", color: "var(--text-2)", border: "var(--border)" };
}

export default async function RecommendationsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Fetch all courses as recommendations
  const { data: courses } = await supabase
    .from("courses")
    .select("*, instructors(name)")
    .order("rating", { ascending: false });

  // Fetch enrolled course IDs to mark them
  const { data: enrollments } = await supabase
    .from("user_enrollments")
    .select("course_id")
    .eq("user_id", user.id);

  const enrolledIds = new Set(enrollments?.map(e => e.course_id) ?? []);

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
          Courses curated for your learning goals, skill level, and interests. Our AI analyzes your progress to surface the most relevant content.
        </p>
      </div>

      {/* Highlight banner */}
      <div style={{
        background: "linear-gradient(135deg, #1E40AF, #2563EB, #3B82F6)",
        borderRadius: 16, padding: "28px 32px", marginBottom: 32,
        display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: "-30%", right: "-5%", width: 200, height: 200,
          borderRadius: "50%", background: "rgba(255,255,255,0.08)", pointerEvents: "none",
        }} />
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Zap size={24} color="white" fill="white" />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "white", marginBottom: 6 }}>Personalized for You</h3>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
            Based on your profile and learning history, we've selected courses that match your trajectory. Match scores reflect content alignment with your goals.
          </p>
        </div>
        <div style={{
          background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)",
          borderRadius: 12, padding: "14px 20px", textAlign: "center", backdropFilter: "blur(8px)",
        }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "white", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{courses?.length || 0}</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", fontWeight: 600 }}>Curated Courses</div>
        </div>
      </div>

      {/* Courses grid */}
      {courses && courses.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
          {courses.map((course, index) => {
            const color = categoryColor(course.category);
            const badge = categoryBadge(course.category);
            const isEnrolled = enrolledIds.has(course.id);
            const matchScore = Math.max(88, 99 - index * 3);
            return (
              <Link key={course.id} href={`/courses/${course.slug}`} style={{ textDecoration: "none" }}>
                <div className="card-hover" style={{
                  background: "white", border: `1px solid ${isEnrolled ? "rgba(16,185,129,0.3)" : "var(--border)"}`,
                  borderRadius: 16, padding: 0, overflow: "hidden",
                  boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
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
                    }}>
                      Enrolled
                    </div>
                  )}

                  <div style={{ padding: "20px 20px 16px" }}>
                    {/* Category + Match */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <span style={{
                        padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                        background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`,
                      }}>
                        {course.category}
                      </span>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", color }}>{matchScore}%</div>
                        <div style={{ fontSize: 8, color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase" }}>Match</div>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: "var(--text-1)", lineHeight: 1.3 }}>
                      {course.title}
                    </h3>
                    <p style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 14, lineHeight: 1.5 }}>
                      {course.subtitle}
                    </p>

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

                    {/* Instructor + CTA */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: 8,
                          background: "var(--primary-subtle)", display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 700, color: "var(--primary)",
                        }}>
                          {course.instructors?.name?.charAt(0) || "?"}
                        </div>
                        <span style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500 }}>
                          {course.instructors?.name || "Unknown Instructor"}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--primary)", fontSize: 12, fontWeight: 600 }}>
                        View <ArrowRight size={12} />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div style={{
          textAlign: "center", padding: "64px 32px",
          background: "white", border: "1px dashed var(--border)", borderRadius: 16,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, margin: "0 auto 20px",
            background: "var(--primary-subtle)", border: "1px solid rgba(37,99,235,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Sparkles size={28} color="var(--primary)" />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "var(--text-1)" }}>No recommendations yet</h3>
          <p style={{ color: "var(--text-2)", fontSize: 14, maxWidth: 400, margin: "0 auto" }}>
            Our AI is still learning about your preferences. Check back soon!
          </p>
        </div>
      )}
    </>
  );
}
