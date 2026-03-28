"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase";
import type { Course } from "@/lib/types";
import {
  Star, Users, Clock, Play, ChevronDown, ChevronRight,
  Check, Zap, ArrowRight, Shield, Award, Smartphone,
  BookOpen, MessageSquare, TrendingUp, Globe, Lock,
  Sparkles, BarChart2, Target, Brain, Download
} from "lucide-react";

const LESSON_ICONS = {
  video: Play,
  quiz: Target,
  project: Zap,
  reading: BookOpen,
};

function categoryColor(category: string): string {
  const map: Record<string, string> = {
    "AI & ML":     "var(--primary)",
    "Engineering": "var(--cyan)",
    "Design":      "var(--amber)",
    "Web3":        "var(--emerald)",
  };
  return map[category] ?? "var(--primary)";
}

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // In Next.js 15, params is a Promise so we use React.use() to unwrap it
  const { id } = use(params);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({});
  const [enrolled, setEnrolled] = useState(false);

  useEffect(() => {
    async function fetchCourse() {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from("courses")
        .select(`
          *,
          instructor:instructors(*),
          tags:course_tags(*),
          outcomes:course_outcomes(*),
          sections:curriculum_sections(
            *,
            lessons(*)
          ),
          reviews:course_reviews(*)
        `)
        .eq("slug", id)
        .single();

      if (data) {
        // Sort relations to ensure correct order
        data.outcomes?.sort((a: any, b: any) => a.order - b.order);
        data.sections?.sort((a: any, b: any) => a.order - b.order);
        data.sections?.forEach((sec: any) => sec.lessons?.sort((a: any, b: any) => a.order - b.order));
        
        setCourse(data as Course);
        // Default first section open
        if (data.sections && data.sections.length > 0) {
          setOpenSections({ 0: true });
        }
      }
      setLoading(false);
    }
    fetchCourse();
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--text-2)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}>Loading course intel...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
        <Navbar />
        <div style={{ padding: "100px 32px", textAlign: "center" }}>
          <h1 style={{ fontSize: 32, marginBottom: 16 }}>Course Not Found</h1>
          <p style={{ color: "var(--text-2)", marginBottom: 24 }}>The intelligence you are looking for has been archived or does not exist.</p>
          <Link href="/" style={{ color: "var(--primary)", fontWeight: 600 }}>Return to Hub</Link>
        </div>
      </div>
    );
  }

  const toggleSection = (i: number) => setOpenSections(prev => ({ ...prev, [i]: !prev[i] }));
  const themeColor = categoryColor(course.category);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <Navbar />

      {/* ── HERO HEADER ── */}
      <div className="hero-section" style={{
        borderBottom: "1px solid rgba(255,255,255,0.15)",
        padding: "56px 32px 48px",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -50, left: "30%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 340px", gap: 48, position: "relative" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
              <Link href="/" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>Home</Link>
              <ChevronRight size={12} />
              <Link href="#" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>Courses</Link>
              <ChevronRight size={12} />
              <span style={{ color: "white" }}>{course.category}</span>
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              <span className="badge badge-primary"><Zap size={9} fill="currentColor" /> {course.category}</span>
              <span className="badge badge-cyan">{course.level}</span>
              <span style={{
                background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 99, padding: "4px 10px", fontSize: 11, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace",
              }}>98% AI MATCH</span>
            </div>

            <h1 style={{ fontSize: "clamp(26px, 3vw, 42px)", marginBottom: 16, lineHeight: 1.15, color: "white" }}>
              {course.title}
            </h1>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.8)", marginBottom: 28, lineHeight: 1.6, maxWidth: 580 }}>
              {course.subtitle}
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 14, color: "white", flexShrink: 0,
              }}>
                {course.instructor?.name.slice(0, 2).toUpperCase() || "IN"}
              </div>
              <div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 2 }}>INSTRUCTOR</div>
                <div style={{ fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: "white" }}>
                  {course.instructor?.name || "Expert Instructor"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
              {[
                { icon: Star, value: `${course.rating} (${course.review_count.toLocaleString()} ratings)`, color: "#FCD34D" },
                { icon: Users, value: `${(course.student_count / 1000).toFixed(1)}k students`, color: "rgba(255,255,255,0.8)" },
                { icon: Clock, value: `${course.hours} hours of content`, color: "rgba(255,255,255,0.8)" },
                { icon: BookOpen, value: `${course.module_count} modules`, color: "rgba(255,255,255,0.8)" },
              ].map((m) => (
                <div key={m.value} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <m.icon size={14} fill={m.icon === Star ? "#FCD34D" : undefined} color={m.color} />
                  <span style={{ fontSize: 13, color: m.color }}>{m.value}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20 }}>
              {course.tags?.map(tag => (
                <span key={tag.id} style={{
                  background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)",
                  borderRadius: 6, padding: "4px 10px", fontSize: 12, color: "white", backdropFilter: "blur(4px)",
                }}>{tag.tag_name}</span>
              ))}
            </div>
          </div>

          <div style={{ position: "sticky", top: 80 }}>
            <div style={{
              background: "white", border: "1px solid var(--border)", borderRadius: 20, overflow: "hidden",
              boxShadow: "0 8px 40px rgba(15,23,42,0.12)",
            }}>
              <div style={{
                height: 180, background: "var(--primary-subtle)",
                display: "flex", alignItems: "center", justifyContent: "center", position: "relative", cursor: "pointer",
              }}>
                <span style={{ fontSize: 48, fontWeight: 800, color: "var(--primary)", opacity: 0.2, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {course.title.slice(0, 2).toUpperCase()}
                </span>
                <button style={{
                  position: "absolute", width: 52, height: 52, borderRadius: "50%",
                  background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", border: "2px solid rgba(255,255,255,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                }}>
                  <Play size={20} fill="white" color="white" style={{ marginLeft: 3 }} />
                </button>
              </div>

              <div style={{ padding: "24px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 34, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>${course.price}</span>
                  <span style={{ fontSize: 16, color: "var(--text-3)", textDecoration: "line-through" }}>${course.original_price}</span>
                  <span style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 700 }}>
                    {Math.round((1 - course.price / course.original_price) * 100)}% OFF
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "var(--amber)", marginBottom: 20 }}>⏱ Offer expires in 2 days</p>

                <div style={{ marginBottom: 20 }}>
                  {[
                    { icon: Clock, text: `${course.hours} hours of content` },
                    { icon: Globe, text: "Lifetime Access" },
                    { icon: Award, text: "Certificate of Excellence" },
                    { icon: Smartphone, text: "Mobile & Desktop Friendly" },
                  ].map(item => (
                    <div key={item.text} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <item.icon size={13} color="var(--primary-light)" />
                      <span style={{ fontSize: 13, color: "var(--text-2)" }}>{item.text}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setEnrolled(true)}
                  style={{
                    width: "100%", border: "none", borderRadius: 12, padding: "14px", color: "white",
                    background: enrolled ? "linear-gradient(135deg, var(--emerald), #059669)" : "linear-gradient(135deg, var(--primary-dark), var(--primary))",
                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 12,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.3s",
                    boxShadow: enrolled ? "0 4px 20px rgba(16,185,129,0.35)" : "0 4px 20px rgba(37,99,235,0.35)",
                  }}
                >
                  {enrolled ? <><Check size={16} /> Enrolled!</> : <>Add to Cart <ArrowRight size={16} /></>}
                </button>

                <div style={{ textAlign: "center", marginTop: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <Shield size={12} color="var(--text-3)" />
                    <span style={{ fontSize: 11, color: "var(--text-3)" }}>30-DAY MONEY-BACK GUARANTEE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 32px", display: "grid", gridTemplateColumns: "1fr 340px", gap: 48 }}>
        <div>

          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 24, marginBottom: 20 }}>Course Narrative</h2>
            <div style={{
              background: "white", border: "1px solid var(--border)", borderRadius: 16, padding: "28px",
              boxShadow: "0 1px 4px rgba(15,23,42,0.05)",
            }}>
              {course.narrative.split("\n\n").map((para, i) => (
                <p key={i} style={{ color: "var(--text-2)", lineHeight: 1.75, fontSize: 15, marginBottom: i < 1 ? 16 : 0 }}>{para}</p>
              ))}
            </div>
          </section>

          {(course.outcomes?.length ?? 0) > 0 && (
            <section style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 24, marginBottom: 20 }}>What You Will Master</h2>
              <div style={{
                background: "white", border: "1px solid var(--border)", borderRadius: 16, padding: "28px",
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, boxShadow: "0 1px 4px rgba(15,23,42,0.05)",
              }}>
                {course.outcomes?.map((outcome) => (
                  <div key={outcome.id} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--primary-subtle)", border: "1px solid rgba(37,99,235,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      <Check size={11} color="var(--primary)" />
                    </div>
                    <span style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.5 }}>{outcome.description}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {(course.sections?.length ?? 0) > 0 && (
            <section style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 24, marginBottom: 20 }}>Curriculum Blueprint</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {course.sections?.map((section, sIdx) => (
                  <div key={section.id} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}>
                    <button
                      onClick={() => toggleSection(sIdx)}
                      style={{
                        width: "100%", background: "transparent", border: "none", padding: "18px 20px", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <span style={{
                          width: 28, height: 28, borderRadius: 8,
                          background: openSections[sIdx] ? "var(--primary-subtle)" : "var(--bg-base)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: "'Plus Jakarta Sans', monospace", fontSize: 11, fontWeight: 700,
                          color: openSections[sIdx] ? "var(--primary)" : "var(--text-3)", flexShrink: 0,
                        }}>
                          {String(sIdx + 1).padStart(2, "0")}
                        </span>
                        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, color: "var(--text-1)" }}>{section.title}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 12, color: "var(--text-3)" }}>{section.lessons?.length || 0} lessons</span>
                        <ChevronDown size={16} color="var(--text-2)" style={{ transform: openSections[sIdx] ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                      </div>
                    </button>

                    {openSections[sIdx] && (section.lessons?.length ?? 0) > 0 && (
                      <div style={{ borderTop: "1px solid var(--border)" }}>
                        {section.lessons?.map((lesson, lIdx) => {
                          const LIcon = LESSON_ICONS[lesson.type as keyof typeof LESSON_ICONS] || Play;
                          return (
                            <div key={lesson.id} style={{
                              display: "flex", alignItems: "center", gap: 14, padding: "12px 20px 12px 32px",
                              borderBottom: lIdx < section.lessons!.length - 1 ? "1px solid var(--border)" : "none",
                              opacity: lesson.is_locked ? 0.5 : 1,
                            }}>
                              <div style={{
                                width: 28, height: 28, borderRadius: 7,
                                background: lesson.type === "project" ? "rgba(245,158,11,0.1)" : lesson.type === "quiz" ? "rgba(14,165,233,0.1)" : lesson.type === "reading" ? "rgba(16,185,129,0.1)" : "var(--primary-subtle)",
                                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                              }}>
                                {lesson.is_locked
                                  ? <Lock size={11} color="var(--text-3)" />
                                  : <LIcon size={12} color={lesson.type === "project" ? "var(--amber)" : lesson.type === "quiz" ? "var(--cyan)" : lesson.type === "reading" ? "var(--emerald)" : "var(--primary)"} />
                                }
                              </div>
                              <span style={{ flex: 1, fontSize: 13, color: lesson.is_locked ? "var(--text-3)" : "var(--text-1)" }}>{lesson.title}</span>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", color: "var(--text-3)", textTransform: "uppercase" }}>{lesson.type}</span>
                                <span style={{ fontSize: 12, color: "var(--text-2)", fontVariantNumeric: "tabular-nums", minWidth: 40, textAlign: "right" }}>{lesson.duration}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {course.instructor && (
            <section style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 24, marginBottom: 20 }}>Your Instructor</h2>
              <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 16, padding: "28px", display: "flex", gap: 24, alignItems: "flex-start", boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
                <div style={{ width: 72, height: 72, borderRadius: 18, flexShrink: 0, background: "var(--primary-subtle)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700, color: "var(--primary)" }}>
                  {course.instructor.name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 20, marginBottom: 4 }}>{course.instructor.name}</h3>
                  <p style={{ color: "var(--primary)", fontSize: 13, marginBottom: 16 }}>{course.instructor.title}</p>
                  <p style={{ color: "var(--text-2)", fontSize: 14, lineHeight: 1.7 }}>{course.instructor.bio}</p>
                </div>
              </div>
            </section>
          )}

          {(course.reviews?.length ?? 0) > 0 && (
            <section style={{ marginBottom: 48 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <h2 style={{ fontSize: 24 }}>Student Reviews</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "flex", gap: 2 }}>
                    {[1,2,3,4,5].map(s => <Star key={s} size={16} fill="var(--amber)" color="var(--amber)" />)}
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 22, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{course.rating}</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {course.reviews?.map((rev) => (
                  <div key={rev.id} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: "22px", boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--bg-base)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: "var(--primary)" }}>{rev.avatar_initials}</div>
                        <div>
                          <div style={{ fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14 }}>{rev.reviewer_name}</div>
                          <div style={{ display: "flex", gap: 2 }}>
                            {Array.from({ length: rev.rating }).map((_, i) => <Star key={i} size={11} fill="var(--amber)" color="var(--amber)" />)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <p style={{ color: "var(--text-2)", fontSize: 14, lineHeight: 1.7 }}>"{rev.text}"</p>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <aside>
          <div style={{ position: "sticky", top: 80 }}>
            {/* Quick stats summary */}
            <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 16, padding: "20px", boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
              <h3 style={{ fontSize: 16, marginBottom: 16 }}>Course Details</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { icon: BarChart2, label: "Skill Level", value: course.level },
                  { icon: Clock, label: "Duration", value: `${course.hours} Hours` },
                  { icon: BookOpen, label: "Lectures", value: course.module_count },
                  { icon: Brain, label: "Methodology", value: "AI-Curated" },
                  { icon: Award, label: "Certificate", value: "Yes" },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <item.icon size={13} color="var(--text-3)" />
                      <span style={{ fontSize: 13, color: "var(--text-2)" }}>{item.label}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

    </div>
  );
}
