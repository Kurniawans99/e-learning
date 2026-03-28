"use client";
import { useState, use } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  Star, Users, Clock, Play, ChevronDown, ChevronRight,
  Check, Zap, ArrowRight, Shield, Award, Smartphone,
  BookOpen, MessageSquare, TrendingUp, Globe, Lock,
  Sparkles, BarChart2, Target, Brain, Download
} from "lucide-react";

const COURSE_DATA: Record<string, {
  id: string; title: string; subtitle: string; category: string; level: string;
  price: number; originalPrice: number; rating: number; reviewCount: number;
  students: number; hours: number; modules: number; match: number;
  gradient: string; accent: string; emoji: string;
  instructor: { name: string; title: string; students: number; courses: number; avatar: string; gradient: string };
  tags: string[];
  narrative: string;
  outcomes: string[];
  curriculum: { title: string; open?: boolean; lessons: { title: string; duration: string; type: "video" | "quiz" | "project" | "reading"; locked?: boolean }[] }[];
  reviews: { name: string; avatar: string; gradient: string; rating: number; text: string; date: string }[];
  related: { id: string; title: string; price: number; emoji: string; gradient: string; accent: string; level: string }[];
}> = {
  default: {
    id: "neural-aesthetics",
    title: "Mastering Neural Aesthetics: The Future of Interface Curation",
    subtitle: "Explore the symbiotic relationship between AI and human-centered design.",
    category: "AI CURATED",
    level: "Intermediate",
    price: 199,
    originalPrice: 299,
    rating: 4.9,
    reviewCount: 2450,
    students: 15200,
    hours: 24,
    modules: 8,
    match: 98,
    gradient: "linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #3B82F6 100%)",
    accent: "#2563EB",
    emoji: "🧠",
    instructor: {
      name: "Dr. Julian Sterling",
      title: "AI Design Researcher & Former Lead at Figma",
      students: 42000,
      courses: 7,
      avatar: "JS",
      gradient: "linear-gradient(135deg, var(--primary-dark), var(--primary-light))",
    },
    tags: ["AI Design", "Neural UX", "Glassmorphism", "Generative AI", "Typography"],
    narrative: "Neural Aesthetics is not just another design course — it's an exploration into the symbiotic relationship between artificial intelligence and human-centered design. We delve deep into how machine learning models interpret visual hierarchy and how you, as a curator, can leverage these insights to create breathtakingly intuitive interfaces.\n\nThrough high-end editorial examples and real-world AI implementation, you will learn to move beyond generic layouts and embrace intentional asymmetry and tonal depth.",
    outcomes: [
      "The principles of AI-driven visual curation and hierarchy",
      "Advanced typography strategies for premium editorial looks",
      "Implementing glassmorphism and depth without clutter",
      "Integrating generative AI into your design workflow",
      "Building adaptive design systems that learn from user behavior",
      "Creating tonal compositions with intentional asymmetry",
    ],
    curriculum: [
      {
        title: "Introduction to Neural Curating",
        lessons: [
          { title: "What is Neural Aesthetics?", duration: "8:20", type: "video" },
          { title: "The AI-Design Symbiosis", duration: "12:45", type: "video" },
          { title: "Setting Up Your Workflow", duration: "6:10", type: "video" },
          { title: "Module Quiz", duration: "10 mins", type: "quiz" },
        ],
      },
      {
        title: "Designing with Depth and Tonal Shift",
        open: true,
        lessons: [
          { title: "Background Layers and Scaffolding", duration: "12:40", type: "video" },
          { title: "Shadow Play vs. Color Contrast", duration: "18:15", type: "video" },
          { title: "Case Study: The Borderless UI", duration: "10 mins", type: "reading" },
          { title: "Depth Workshop Project", duration: "45 mins", type: "project" },
        ],
      },
      {
        title: "Intentional Asymmetry in Grid Layouts",
        lessons: [
          { title: "Breaking the Grid — Intentionally", duration: "14:00", type: "video" },
          { title: "Editorial Asymmetry Techniques", duration: "22:30", type: "video" },
          { title: "Asymmetry with Visual Balance", duration: "16:20", type: "video", locked: true },
        ],
      },
      {
        title: "Generative AI in Your Design Toolkit",
        lessons: [
          { title: "Prompt Engineering for Designers", duration: "20:10", type: "video", locked: true },
          { title: "Midjourney + Figma Integration", duration: "28:45", type: "video", locked: true },
          { title: "Final Capstone Project", duration: "2 hrs", type: "project", locked: true },
        ],
      },
    ],
    reviews: [
      { name: "Mia Tanaka", avatar: "MT", gradient: "linear-gradient(135deg, #7C5CFC, #22D3EE)", rating: 5, text: "This course redefined how I approach UI design. Julian's teaching style is incredibly precise and inspiring. The AI integration section alone is worth triple the price.", date: "2 weeks ago" },
      { name: "David Park", avatar: "DP", gradient: "linear-gradient(135deg, #F59E0B, #F97316)", rating: 5, text: "Finally a design course that takes AI seriously. The curriculum blueprint is structured unlike anything I've seen — each module builds on the last with surgical precision.", date: "1 month ago" },
      { name: "Priya Nair", avatar: "PN", gradient: "linear-gradient(135deg, #10B981, #22D3EE)", rating: 4, text: "Genuinely transformed my portfolio. Got three interview requests within a week of completing the capstone project.", date: "3 weeks ago" },
    ],
    related: [
      { id: "ui-design", title: "Micro-Interactions in Modern Web Apps", price: 49, emoji: "🎨", gradient: "linear-gradient(135deg, #1f1004, #431407)", accent: "#F59E0B", level: "Beginner" },
      { id: "systems-thinking", title: "Typography as Interface", price: 89, emoji: "📝", gradient: "linear-gradient(135deg, #1a1a2e, #16213e)", accent: "#9B7EFF", level: "Intermediate" },
    ],
  }
};

const LESSON_ICONS = {
  video: Play,
  quiz: Target,
  project: Zap,
  reading: BookOpen,
};

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const course = COURSE_DATA[id] ?? COURSE_DATA["default"];
  const [openSections, setOpenSections] = useState<Record<number, boolean>>(
    Object.fromEntries(course.curriculum.map((s, i) => [i, !!s.open]))
  );
  const [enrolled, setEnrolled] = useState(false);

  const toggleSection = (i: number) => setOpenSections(prev => ({ ...prev, [i]: !prev[i] }));

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
        {/* Background glow */}
        <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -50, left: "30%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 340px", gap: 48, position: "relative" }}>
          <div>
            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
              <Link href="/" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>Home</Link>
              <ChevronRight size={12} />
              <Link href="#" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>Courses</Link>
              <ChevronRight size={12} />
              <span style={{ color: "white" }}>{course.category}</span>
            </div>

            {/* Badges */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              <span className="badge badge-primary"><Zap size={9} fill="currentColor" /> {course.category}</span>
              <span className="badge badge-cyan">{course.level}</span>
              <span style={{
                background: `${course.accent}18`, color: course.accent,
                border: `1px solid ${course.accent}30`,
                borderRadius: 99, padding: "4px 10px",
                fontSize: 11, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace",
              }}>{course.match}% AI MATCH</span>
            </div>

            <h1 style={{ fontSize: "clamp(26px, 3vw, 42px)", marginBottom: 16, lineHeight: 1.15, color: "white" }}>
              {course.title}
            </h1>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.8)", marginBottom: 28, lineHeight: 1.6, maxWidth: 580 }}>
              {course.subtitle}
            </p>

            {/* Instructor */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                border: "2px solid rgba(255,255,255,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 14, color: "white",
                flexShrink: 0,
              }}>{course.instructor.avatar}</div>
              <div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 2 }}>INSTRUCTOR</div>
                <div style={{ fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: "white" }}>{course.instructor.name}</div>
              </div>
            </div>

            {/* Meta stats */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
              {[
                { icon: Star, value: `${course.rating} (${course.reviewCount.toLocaleString()} ratings)`, color: "#FCD34D" },
                { icon: Users, value: `${(course.students / 1000).toFixed(1)}k students`, color: "rgba(255,255,255,0.8)" },
                { icon: Clock, value: `${course.hours} hours of content`, color: "rgba(255,255,255,0.8)" },
                { icon: BookOpen, value: `${course.modules} modules`, color: "rgba(255,255,255,0.8)" },
              ].map((m) => (
                <div key={m.value} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <m.icon size={14} fill={m.icon === Star ? "#FCD34D" : undefined} color={m.color} />
                  <span style={{ fontSize: 13, color: m.color }}>{m.value}</span>
                </div>
              ))}
            </div>

            {/* Tags */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20 }}>
              {course.tags.map(tag => (
                <span key={tag} style={{
                  background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)",
                  borderRadius: 6, padding: "4px 10px", fontSize: 12, color: "white",
                  backdropFilter: "blur(4px)",
                }}>{tag}</span>
              ))}
            </div>
          </div>

          {/* ── ENROLLMENT CARD ── */}
          <div style={{ position: "sticky", top: 80 }}>
            <div style={{
              background: "white",
              border: "1px solid var(--border)",
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 8px 40px rgba(15,23,42,0.12)",
            }}>
              {/* Preview thumbnail */}
              <div style={{
                height: 180,
                background: course.gradient,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 64, position: "relative", cursor: "pointer",
              }}>
                {course.emoji}
                <button style={{
                  position: "absolute",
                  width: 52, height: 52, borderRadius: "50%",
                  background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
                  border: "2px solid rgba(255,255,255,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                }}>
                  <Play size={20} fill="white" color="white" style={{ marginLeft: 3 }} />
                </button>
                <div style={{
                  position: "absolute", bottom: 12, left: 0, right: 0,
                  textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.7)",
                }}>Preview this Course</div>
              </div>

              <div style={{ padding: "24px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 34, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>${course.price}</span>
                  <span style={{ fontSize: 16, color: "var(--text-3)", textDecoration: "line-through" }}>${course.originalPrice}</span>
                  <span style={{ fontSize: 13, color: "var(--emerald)", fontWeight: 700 }}>
                    {Math.round((1 - course.price / course.originalPrice) * 100)}% OFF
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "var(--amber)", marginBottom: 20 }}>⏱ Offer expires in 2 days</p>

                {/* Includes */}
                <div style={{ marginBottom: 20 }}>
                  {[
                    { icon: Clock, text: `${course.hours} hours of content` },
                    { icon: Globe, text: "Lifetime Access" },
                    { icon: Award, text: "Certificate of Excellence" },
                    { icon: Smartphone, text: "Mobile & Desktop Friendly" },
                    { icon: Download, text: "Downloadable resources" },
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
                    width: "100%",
                    background: enrolled
                      ? "linear-gradient(135deg, var(--emerald), #059669)"
                      : "linear-gradient(135deg, var(--primary-dark), var(--primary))",
                    border: "none",
                    borderRadius: 12,
                    padding: "14px",
                    color: "white",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: "pointer",
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    transition: "all 0.3s",
                    boxShadow: enrolled ? "0 4px 20px rgba(16,185,129,0.35)" : "0 4px 20px rgba(37,99,235,0.35)",
                  }}
                >
                  {enrolled ? <><Check size={16} /> Enrolled!</> : <>Add to Cart <ArrowRight size={16} /></>}
                </button>

                <button style={{
                  width: "100%", background: "transparent",
                  border: "1.5px solid var(--border-strong)", borderRadius: 12,
                  padding: "13px", color: "var(--text-1)",
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600,
                  fontSize: 14, cursor: "pointer", marginBottom: 16,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}>
                  Apply Coupon
                </button>

                <div style={{ textAlign: "center" }}>
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

          {/* Course Narrative */}
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 24, marginBottom: 20 }}>Course Narrative</h2>
            <div style={{
              background: "white", border: "1px solid var(--border)",
              borderRadius: 16, padding: "28px",
              boxShadow: "0 1px 4px rgba(15,23,42,0.05)",
            }}>
              {course.narrative.split("\n\n").map((para, i) => (
                <p key={i} style={{ color: "var(--text-2)", lineHeight: 1.75, fontSize: 15, marginBottom: i < 1 ? 16 : 0 }}>{para}</p>
              ))}
            </div>
          </section>

          {/* What You'll Master */}
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 24, marginBottom: 20 }}>What You Will Master</h2>
            <div style={{
              background: "white", border: "1px solid var(--border)",
              borderRadius: 16, padding: "28px",
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16,
              boxShadow: "0 1px 4px rgba(15,23,42,0.05)",
            }}>
              {course.outcomes.map((outcome) => (
                <div key={outcome} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: "var(--primary-subtle)",
                    border: "1px solid rgba(37,99,235,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginTop: 1,
                  }}>
                    <Check size={11} color="var(--primary)" />
                  </div>
                  <span style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.5 }}>{outcome}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Curriculum Blueprint */}
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 24, marginBottom: 20 }}>Curriculum Blueprint</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {course.curriculum.map((section, sIdx) => (
                <div key={sIdx} style={{
                  background: "white", border: "1px solid var(--border)",
                  borderRadius: 14, overflow: "hidden",
                  boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
                }}>
                  <button
                    onClick={() => toggleSection(sIdx)}
                    style={{
                      width: "100%", background: "transparent", border: "none",
                      padding: "18px 20px", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <span style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: openSections[sIdx] ? "var(--primary-subtle)" : "var(--bg-base)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "'Plus Jakarta Sans', monospace",
                        fontSize: 11, fontWeight: 700,
                        color: openSections[sIdx] ? "var(--primary)" : "var(--text-3)",
                        flexShrink: 0,
                      }}>
                        {String(sIdx + 1).padStart(2, "0")}
                      </span>
                      <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, color: "var(--text-1)" }}>{section.title}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 12, color: "var(--text-3)" }}>{section.lessons.length} lessons</span>
                      <ChevronDown size={16} color="var(--text-2)" style={{ transform: openSections[sIdx] ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                    </div>
                  </button>

                  {openSections[sIdx] && (
                    <div style={{ borderTop: "1px solid var(--border)" }}>
                      {section.lessons.map((lesson, lIdx) => {
                        const LIcon = LESSON_ICONS[lesson.type];
                        return (
                          <div key={lIdx} style={{
                            display: "flex", alignItems: "center", gap: 14,
                            padding: "12px 20px 12px 32px",
                            borderBottom: lIdx < section.lessons.length - 1 ? "1px solid var(--border)" : "none",
                            opacity: lesson.locked ? 0.5 : 1,
                          }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: 7,
                              background: lesson.type === "project" ? "rgba(245,158,11,0.1)" :
                                lesson.type === "quiz" ? "rgba(14,165,233,0.1)" :
                                lesson.type === "reading" ? "rgba(16,185,129,0.1)" : "var(--primary-subtle)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              flexShrink: 0,
                            }}>
                              {lesson.locked
                                ? <Lock size={11} color="var(--text-3)" />
                                : <LIcon size={12} color={
                                    lesson.type === "project" ? "var(--amber)" :
                                    lesson.type === "quiz" ? "var(--cyan)" :
                                    lesson.type === "reading" ? "var(--emerald)" : "var(--primary)"
                                  } />
                              }
                            </div>
                            <span style={{ flex: 1, fontSize: 13, color: lesson.locked ? "var(--text-3)" : "var(--text-1)" }}>{lesson.title}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{
                                fontSize: 10, fontFamily: "'IBM Plex Mono', monospace",
                                color: "var(--text-3)", textTransform: "uppercase",
                              }}>{lesson.type}</span>
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

          {/* Instructor */}
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 24, marginBottom: 20 }}>Your Instructor</h2>
            <div style={{
              background: "white", border: "1px solid var(--border)",
              borderRadius: 16, padding: "28px",
              display: "flex", gap: 24, alignItems: "flex-start",
              boxShadow: "0 1px 4px rgba(15,23,42,0.05)",
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: 18, flexShrink: 0,
                background: course.instructor.gradient,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26, fontWeight: 700, color: "white",
              }}>{course.instructor.avatar}</div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 20, marginBottom: 4 }}>{course.instructor.name}</h3>
                <p style={{ color: "var(--primary)", fontSize: 13, marginBottom: 16 }}>{course.instructor.title}</p>
                <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
                  {[
                    { icon: Star, value: "4.9", label: "Rating" },
                    { icon: Users, value: `${(course.instructor.students / 1000).toFixed(0)}k`, label: "Students" },
                    { icon: BookOpen, value: String(course.instructor.courses), label: "Courses" },
                  ].map(m => (
                    <div key={m.label} style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center", marginBottom: 2 }}>
                        <m.icon size={13} color="var(--text-2)" />
                        <span style={{ fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16 }}>{m.value}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-3)" }}>{m.label}</div>
                    </div>
                  ))}
                </div>
                <p style={{ color: "var(--text-2)", fontSize: 14, lineHeight: 1.7 }}>
                  Dr. Sterling spent 8 years at Figma as Head of AI Research before founding his design education studio. His work sits at the intersection of cognitive psychology and computational aesthetics — he's spoken at 40+ conferences and authored the widely-read paper "Visual Cognition in the Age of Generative AI."
                </p>
              </div>
            </div>
          </section>

          {/* Reviews */}
          <section style={{ marginBottom: 48 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 24 }}>Student Reviews</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ display: "flex", gap: 2 }}>
                  {[1,2,3,4,5].map(s => <Star key={s} size={16} fill="var(--amber)" color="var(--amber)" />)}
                </div>
                <span style={{ fontWeight: 800, fontSize: 22, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{course.rating}</span>
                <span style={{ color: "var(--text-2)", fontSize: 13 }}>({course.reviewCount.toLocaleString()} ratings)</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {course.reviews.map((rev) => (
                <div key={rev.name} style={{
                  background: "white", border: "1px solid var(--border)",
                  borderRadius: 14, padding: "22px",
                  boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: rev.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: "white" }}>{rev.avatar}</div>
                      <div>
                        <div style={{ fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14 }}>{rev.name}</div>
                        <div style={{ display: "flex", gap: 2 }}>
                          {Array.from({ length: rev.rating }).map((_, i) => <Star key={i} size={11} fill="var(--amber)" color="var(--amber)" />)}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: 12, color: "var(--text-3)" }}>{rev.date}</span>
                  </div>
                  <p style={{ color: "var(--text-2)", fontSize: 14, lineHeight: 1.7 }}>"{rev.text}"</p>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <aside>
          {/* AI Recommended For You */}
          <div style={{ position: "sticky", top: 80 }}>
            <div style={{
              background: "var(--primary-subtle)",
              border: "1px solid rgba(37,99,235,0.15)",
              borderRadius: 16, padding: "20px", marginBottom: 20,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Sparkles size={14} color="var(--primary)" />
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.04em" }}>AI RECOMMENDED FOR YOU</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {course.related.map((rel) => (
                  <Link key={rel.id} href={`/courses/${rel.id}`} style={{ textDecoration: "none" }}>
                    <div style={{
                      background: "white", border: "1px solid var(--border)",
                      borderRadius: 12, display: "flex", gap: 12,
                      padding: "12px", transition: "all 0.2s",
                      boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
                    }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--primary)"; el.style.boxShadow = "0 4px 12px rgba(37,99,235,0.08)"; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--border)"; el.style.boxShadow = "0 1px 3px rgba(15,23,42,0.04)"; }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 10,
                        background: "#EFF6FF",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 22, flexShrink: 0,
                      }}>{rel.emoji}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>{rel.title}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", color: rel.accent }}>${rel.price}</span>
                          <span style={{ fontSize: 10, color: "var(--text-3)" }}>{rel.level}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Course quick stats */}
            <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 16, padding: "20px", boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
              <h3 style={{ fontSize: 16, marginBottom: 16 }}>This Course Includes</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { icon: BarChart2, label: "Skill Level", value: course.level },
                  { icon: MessageSquare, label: "Language", value: "English" },
                  { icon: TrendingUp, label: "Last Updated", value: "November 2024" },
                  { icon: Brain, label: "AI Integration", value: "Fully Integrated" },
                  { icon: Award, label: "Certificate", value: "Yes — Shareable" },
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

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "32px", background: "white" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, var(--primary-dark), var(--primary-light))", display: "flex", alignItems: "center", justifyContent: "center" }}><Zap size={13} color="white" fill="white" /></div>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 15 }}>Intelli<span style={{ color: "var(--primary)" }}>Course</span></span>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {["Privacy Policy", "Terms of Service", "Help Center"].map(l => (
              <Link key={l} href="#" style={{ color: "var(--text-3)", fontSize: 12, textDecoration: "none" }}>{l}</Link>
            ))}
          </div>
          <span style={{ color: "var(--text-3)", fontSize: 12 }}>© 2024 IntelliCourse. AI-Driven Excellence.</span>
        </div>
      </footer>
    </div>
  );
}
