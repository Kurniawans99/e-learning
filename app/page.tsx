import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { Course, Testimonial } from "@/lib/types";
import {
  Zap, ArrowRight, Star, Play, Users, Clock, TrendingUp,
  Brain, Target, BarChart3, ChevronRight, Sparkles,
  BookOpen, Shield, Globe, Check, MessageSquare
} from "lucide-react";

// ── Static UI-only data (icons, copy — not from DB) ─────────────────
const FEATURES = [
  { icon: Brain,        title: "Cognitive Pattern Mapping",    desc: "The AI continuously maps your learning style, retention rate, and conceptual gaps — then adjusts every session automatically."       },
  { icon: Target,       title: "Dynamic Path Correction",      desc: "Falling behind? The system injects targeted micro-lessons exactly when and where you need them without disrupting your flow."          },
  { icon: BarChart3,    title: "Predictive Milestone Tracking", desc: "Real-time mastery scores predict your readiness for certifications, job roles, or your next advanced topic."                         },
  { icon: MessageSquare,title: "AI Concierge",                  desc: "A conversational AI that answers questions, builds custom syllabi, and synthesizes insights from your entire learning history."       },
];

const STATS = [
  { value: "500K+", label: "Learners worldwide" },
  { value: "98%",   label: "Retention rate"     },
  { value: "12K+",  label: "Curated paths"      },
  { value: "4.9★",  label: "Average rating"     },
];

/** Map course category to a CSS variable colour — no hardcoded hex in data */
function categoryColor(category: string): string {
  const map: Record<string, string> = {
    "AI & ML":     "var(--primary)",
    "Engineering": "var(--cyan)",
    "Design":      "var(--amber)",
    "Web3":        "var(--emerald)",
    "Strategy":    "#8B5CF6",
    "Data":        "#EC4899",
  };
  return map[category] ?? "var(--primary)";
}

// ── Server Component ─────────────────────────────────────────────────
export default async function LandingPage() {
  let courses: Course[]      = [];
  let testimonials: Testimonial[] = [];

  try {
    const supabase = await createServerSupabaseClient();

    const [{ data: coursesData }, { data: testimonialsData }] = await Promise.all([
      supabase.from("courses").select("*").order("student_count", { ascending: false }).limit(6),
      supabase.from("testimonials").select("*").order("created_at", { ascending: false }).limit(3),
    ]);

    courses      = coursesData      ?? [];
    testimonials = testimonialsData ?? [];
  } catch {
    // Supabase URL not yet configured — pages render with empty arrays
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      {/* Navbar imported client-side to support interactive state */}
      <ClientNavbar />

      {/* ── HERO ── */}
      <section className="hero-section" style={{ padding: "80px 32px 100px", position: "relative" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center", position: "relative", zIndex: 1 }}>
          <div>
            <div style={{ marginBottom: 22 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 99, padding: "5px 14px", fontSize: 12, fontWeight: 600,
                color: "white", backdropFilter: "blur(8px)",
              }}>
                <Zap size={11} fill="currentColor" /> AI-Powered Learning Platform
              </span>
            </div>
            <h1 style={{ fontSize: "clamp(38px, 4.5vw, 60px)", fontWeight: 800, lineHeight: 1.08, marginBottom: 22, color: "white" }}>
              Learn Faster with{" "}
              <span style={{ borderBottom: "3px solid rgba(255,255,255,0.6)", paddingBottom: 2 }}>Personalized</span>{" "}
              Intelligence
            </h1>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.85)", lineHeight: 1.7, marginBottom: 36, maxWidth: 460 }}>
              Our AI analyzes your goals, maps your knowledge gaps, and builds a curriculum that evolves with you — in real time.
            </p>
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 44 }}>
              <Link href="/auth" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "white", color: "var(--primary)", borderRadius: 10,
                padding: "13px 26px", fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 700, fontSize: 15, textDecoration: "none",
                boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              }}>
                Start Learning Free <ArrowRight size={16} />
              </Link>
              <Link href="#" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(255,255,255,0.15)", color: "white",
                border: "1.5px solid rgba(255,255,255,0.3)", borderRadius: 10,
                padding: "13px 22px", fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 600, fontSize: 15, textDecoration: "none",
                backdropFilter: "blur(8px)",
              }}>
                <Play size={14} fill="white" /> Watch Demo
              </Link>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ display: "flex" }}>
                {["A","B","C","D","E"].map((l, i) => (
                  <div key={l} style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.9)", border: "2px solid rgba(37,99,235,0.4)", marginLeft: i===0?0:-8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--primary)" }}>{l}</div>
                ))}
              </div>
              <div>
                <div style={{ display: "flex", gap: 2, marginBottom: 2 }}>{[1,2,3,4,5].map(s => <Star key={s} size={12} fill="#FCD34D" color="#FCD34D" />)}</div>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}><strong style={{ color: "white" }}>500K+</strong> learners trust IntelliCourse</span>
              </div>
            </div>
          </div>

          {/* Hero Card */}
          <div style={{ position: "relative" }}>
            <div style={{
              background: "white", borderRadius: 20, padding: 24,
              boxShadow: "0 30px 80px rgba(15,23,42,0.25), 0 0 0 1px rgba(255,255,255,0.1)",
            }}>
              <div style={{
                background: "var(--primary-subtle)", border: "1px solid rgba(37,99,235,0.15)",
                borderRadius: 12, padding: "14px 16px", marginBottom: 18,
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Sparkles size={16} color="white" />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--primary)", fontWeight: 700, marginBottom: 2 }}>AI RECOMMENDATION</div>
                  <div style={{ fontSize: 13, color: "var(--text-1)" }}>Based on your Python quiz, added "Advanced Data Structures" to your path.</div>
                </div>
              </div>
              {[
                { title: "Mastering Neural Networks", progress: 72 },
                { title: "System Design Patterns",    progress: 45 },
                { title: "TypeScript Deep Dive",      progress: 89 },
              ].map((c, i) => (
                <div key={c.title} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: ["var(--primary)","var(--cyan)","var(--emerald)"][i], flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: "var(--text-1)" }}>{c.title}</div>
                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${c.progress}%`, background: ["var(--primary)","var(--cyan)","var(--emerald)"][i] }} /></div>
                  </div>
                  <span style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 600, flexShrink: 0 }}>{c.progress}%</span>
                </div>
              ))}
              <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 2, fontWeight: 600 }}>LEARNING VELOCITY</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-1)" }}>+24.6% <span style={{ fontSize: 12, color: "var(--emerald)", fontWeight: 500 }}>↑ this week</span></div>
                </div>
                <TrendingUp size={28} color="var(--emerald)" style={{ opacity: 0.8 }} />
              </div>
            </div>
            <div style={{ position: "absolute", top: -16, right: -16, background: "linear-gradient(135deg, #F59E0B, #F97316)", borderRadius: 12, padding: "10px 16px", boxShadow: "0 8px 24px rgba(245,158,11,0.4)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.85)", marginBottom: 1 }}>AI MATCH</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "white" }}>98%</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ background: "white", borderBottom: "1px solid var(--border)", padding: "36px 32px", boxShadow: "0 4px 20px rgba(15,23,42,0.05)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 40 }}>
          {STATS.map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 38, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 4, color: "var(--primary)" }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "var(--text-2)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── COURSES (from DB) ── */}
      <section style={{ padding: "88px 32px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: 48 }}>
          <span className="badge badge-primary" style={{ marginBottom: 12 }}>Curated Catalog</span>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: "clamp(28px, 3vw, 40px)" }}>Popular <span className="gradient-text">Courses</span></h2>
            <Link href="#" style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--primary)", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>View all <ChevronRight size={14} /></Link>
          </div>
          <p style={{ color: "var(--text-2)", marginTop: 8, maxWidth: 500 }}>The most sought-after skills, refined by AI and validated by industry leaders.</p>
        </div>

        {courses.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 0", color: "var(--text-3)" }}>
            <BookOpen size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p>No courses available yet. Add data in your Supabase dashboard.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {courses.map((course) => {
              const color = categoryColor(course.category);
              return (
                <Link key={course.id} href={`/courses/${course.slug}`} style={{ textDecoration: "none" }}>
                  <div className="glass card-hover" style={{ overflow: "hidden", cursor: "pointer" }}>
                    {/* Thumbnail — initials instead of emoji */}
                    <div style={{ height: 140, background: "var(--primary-subtle)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                      <span style={{ fontSize: 42, fontWeight: 800, color: "var(--primary)", opacity: 0.25, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {course.title.slice(0, 2).toUpperCase()}
                      </span>
                      <div style={{ position: "absolute", top: 12, right: 12, background: "white", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, color, border: `1px solid ${color}30` }}>
                        {course.level}
                      </div>
                    </div>
                    <div style={{ padding: "18px 20px 20px" }}>
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ fontSize: 11, color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{course.category}</span>
                      </div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, lineHeight: 1.3, color: "var(--text-1)" }}>{course.title}</h3>
                      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}><Star size={12} fill="#F59E0B" color="#F59E0B" /><span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{course.rating.toFixed(1)}</span></div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-2)", fontSize: 13 }}><Users size={12} />{(course.student_count / 1000).toFixed(1)}k</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-2)", fontSize: 13 }}><Clock size={12} />{course.hours}h</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--text-1)" }}>${course.price}</span>
                        <span style={{ background: `${color}15`, color, border: `1px solid ${color}25`, borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600 }}>Enroll Now</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: "88px 32px", background: "#F1F5F9", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span className="badge badge-primary" style={{ marginBottom: 16 }}><Sparkles size={10} /> Engineered for Transformation</span>
            <h2 style={{ fontSize: "clamp(28px, 3vw, 44px)", marginBottom: 16 }}>How Your Intelligent <span className="gradient-text">Curator Works</span></h2>
            <p style={{ color: "var(--text-2)", maxWidth: 500, margin: "0 auto", lineHeight: 1.7 }}>Four powerful pillars that make IntelliCourse the smartest way to learn any skill.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div key={f.title} className="glass" style={{ padding: "32px", cursor: "default" }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: ["var(--primary-subtle)","rgba(14,165,233,0.08)","rgba(245,158,11,0.08)","rgba(16,185,129,0.08)"][i], display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                  <f.icon size={24} color={["var(--primary)","var(--cyan)","var(--amber)","var(--emerald)"][i]} />
                </div>
                <h3 style={{ fontSize: 20, marginBottom: 12, color: "var(--text-1)" }}>{f.title}</h3>
                <p style={{ color: "var(--text-2)", lineHeight: 1.7, fontSize: 15 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS (from DB) ── */}
      <section style={{ padding: "88px 32px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <span className="badge badge-primary" style={{ marginBottom: 16 }}>Success Stories</span>
          <h2 style={{ fontSize: "clamp(28px, 3vw, 40px)" }}>Transformations that <span className="gradient-text">Speak</span></h2>
          <p style={{ color: "var(--text-2)", marginTop: 12, maxWidth: 420, margin: "12px auto 0" }}>Real learners, real results — powered by AI personalization.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
          {(testimonials.length > 0 ? testimonials : [
            { id: "1", name: "Sarah Kim",    role: "ML Engineer @ Google",     text: "IntelliCourse didn't just teach me ML — it understood my gaps and patched them precisely. I went from hobbyist to Google in 8 months.", avatar_initials: "SK", created_at: "" },
            { id: "2", name: "Marcus Chen",  role: "Senior Designer @ Figma",  text: "The AI knew I needed visual-first content before I even realized it. Every recommendation felt like it was made by someone who knew me.",  avatar_initials: "MC", created_at: "" },
            { id: "3", name: "Aisha Patel",  role: "Blockchain Dev @ Ethereum", text: "I'd been stuck in tutorial hell for two years. IntelliCourse's path correction broke the cycle in weeks.",                                 avatar_initials: "AP", created_at: "" },
          ] as Testimonial[]).map((t) => (
            <div key={t.id} className="glass" style={{ padding: "28px" }}>
              <div style={{ display: "flex", gap: 3, marginBottom: 16 }}>{[1,2,3,4,5].map(s => <Star key={s} size={14} fill="#F59E0B" color="#F59E0B" />)}</div>
              <p style={{ color: "var(--text-1)", lineHeight: 1.7, marginBottom: 24, fontSize: 15 }}>"{t.text}"</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, var(--primary-dark), var(--primary-light))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "white" }}>{t.avatar_initials}</div>
                <div>
                  <div style={{ fontWeight: 700, fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 14, color: "var(--text-1)" }}>{t.name}</div>
                  <div style={{ color: "var(--text-2)", fontSize: 12 }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "0 32px 88px", maxWidth: 1200, margin: "0 auto" }}>
        <div className="hero-section" style={{ borderRadius: 24, padding: "72px 64px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "relative", zIndex: 1 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 20, background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 99, padding: "5px 14px", fontSize: 12, fontWeight: 600, color: "white" }}>
              <Zap size={10} fill="currentColor" /> Limited Time Offer
            </span>
            <h2 style={{ fontSize: "clamp(28px, 3vw, 48px)", marginBottom: 18, color: "white" }}>Ready for Your Custom Path?</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 17, maxWidth: 500, margin: "0 auto 40px", lineHeight: 1.7 }}>Join 500,000+ learners who've optimized their education with IntelliCourse.</p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", alignItems: "center" }}>
              <Link href="/auth" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "white", color: "var(--primary)", borderRadius: 10, padding: "14px 30px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 16, textDecoration: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>Start Your Assessment <ArrowRight size={16} /></Link>
              <button style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.15)", color: "white", border: "1.5px solid rgba(255,255,255,0.3)", borderRadius: 10, padding: "14px 24px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>View Pricing</button>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 32, marginTop: 32 }}>
              {["No credit card", "Cancel anytime", "7-day free trial"].map((t) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.8)", fontSize: 13 }}><Check size={14} color="white" /> {t}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "48px 32px", background: "white" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, var(--primary-dark), var(--primary-light))", display: "flex", alignItems: "center", justifyContent: "center" }}><Zap size={14} color="white" fill="white" /></div>
                <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 16, color: "var(--text-1)" }}>Intelli<span style={{ color: "var(--primary)" }}>Course</span></span>
              </div>
              <p style={{ color: "var(--text-2)", fontSize: 13, lineHeight: 1.7, maxWidth: 260 }}>Redefining education through artificial intelligence. Personal, adaptive, and borderless.</p>
            </div>
            {[
              { title: "Platform", links: ["Explore Courses","Learning Paths","Certifications","Enterprise"] },
              { title: "Company",  links: ["About Us","Careers","Blog","Press"]                              },
              { title: "Legal",    links: ["Privacy Policy","Terms of Service","Cookie Policy","Help Center"] },
            ].map((col) => (
              <div key={col.title}>
                <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, marginBottom: 16, fontSize: 13, color: "var(--text-1)" }}>{col.title}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {col.links.map(l => <Link key={l} href="#" style={{ color: "var(--text-2)", fontSize: 13, textDecoration: "none" }}>{l}</Link>)}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "var(--text-3)", fontSize: 12 }}>© 2024 IntelliCourse. AI-Driven Excellence.</span>
            <div style={{ display: "flex", gap: 20 }}>{[Globe, Shield, BookOpen].map((Icon, i) => <Icon key={i} size={16} color="var(--text-3)" style={{ cursor: "pointer" }} />)}</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Thin client wrapper just for the Navbar ──────────────────────────
// (Navbar has "use client" internally; import it here avoids making the
//  whole page a client component)
import Navbar from "@/components/Navbar";
function ClientNavbar() { return <Navbar />; }
