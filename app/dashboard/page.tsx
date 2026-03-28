"use client";
import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  LayoutDashboard, BookOpen, Trophy, Sparkles, Settings,
  TrendingUp, Play, ArrowRight, Zap, ChevronRight,
  Clock, Target, Flame, MessageSquare, BarChart2,
  Star, Users, CheckCircle2, Lock, Globe, Shield
} from "lucide-react";

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", active: true },
  { icon: BookOpen, label: "My Courses", href: "#", badge: 3 },
  { icon: Trophy, label: "Achievements", href: "#" },
  { icon: Sparkles, label: "Recommendations", href: "#", badge: 5 },
  { icon: Settings, label: "Settings", href: "#" },
];

const IN_PROGRESS = [
  { id: "neural-aesthetics", title: "Neural Architecture in Modern AI", category: "ADVANCED", progress: 72, remaining: "32 mins", color: "var(--primary)", emoji: "🧠", bgColor: "#EFF6FF" },
  { id: "systems-thinking", title: "Cognitive Design Principles", category: "STRATEGY", progress: 45, remaining: "15 mins", color: "var(--cyan)", emoji: "⚙️", bgColor: "#F0F9FF" },
  { id: "data-science", title: "Ethical Frameworks in Tech", category: "PHILOSOPHY", progress: 88, remaining: "8 mins", color: "var(--emerald)", emoji: "📚", bgColor: "#ECFDF5" },
];

const RECOMMENDATIONS = [
  { id: "quantum-computation", title: "Quantum Computation Foundations", desc: "Based on your Physics & Logic interest — bridges the gap between theory and engineering.", match: 98, duration: "4h 20m", level: "Intermediate", emoji: "⚛️", accent: "#0EA5E9", rating: 4.8, students: 5200 },
  { id: "blockchain", title: "Cybernetic Feedback Loops", desc: "Analyzing your recent systems design submissions — master the feedback paradigm.", match: 94, duration: "2h 45m", level: "Advanced", emoji: "🔗", accent: "#10B981", rating: 4.7, students: 3800 },
  { id: "ui-design", title: "Human-Machine Symbiosis", desc: "A deep dive into ethics and aesthetics of integrated intelligence, curated for you.", match: 89, duration: "5h 15m", level: "Beginner", emoji: "🤝", accent: "#8B5CF6", rating: 4.9, students: 8900 },
];

const SKILLS = [
  { name: "Artificial Intelligence", level: 14, max: 20, color: "var(--primary)", progress: 70 },
  { name: "Systems Thinking", level: 9, max: 20, color: "var(--cyan)", progress: 45 },
  { name: "Ethical Frameworks", level: 11, max: 20, color: "#10B981", progress: 55 },
  { name: "Data Science", level: 7, max: 20, color: "#F59E0B", progress: 35 },
];

const ACHIEVEMENTS = [
  { icon: Flame, label: "7-Day Streak", color: "#F59E0B", unlocked: true },
  { icon: Target, label: "Path Master", color: "var(--primary)", unlocked: true },
  { icon: Star, label: "Top Learner", color: "#F59E0B", unlocked: true },
  { icon: Globe, label: "Global Rank", color: "var(--cyan)", unlocked: false },
  { icon: Shield, label: "Certified Pro", color: "#10B981", unlocked: false },
];

const WEEKLY_ACTIVITY = [
  { day: "Mon", mins: 40, pct: 0.5 },
  { day: "Tue", mins: 65, pct: 0.8 },
  { day: "Wed", mins: 30, pct: 0.375 },
  { day: "Thu", mins: 80, pct: 1.0 },
  { day: "Fri", mins: 55, pct: 0.69 },
  { day: "Sat", mins: 20, pct: 0.25 },
  { day: "Sun", mins: 45, pct: 0.56 },
];

export default function DashboardPage() {
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);

  const sendToAI = (msg: string) => {
    if (!msg.trim()) return;
    setAiMessages(prev => [
      ...prev,
      { role: "user", text: msg },
      { role: "ai", text: "I'm analyzing your learning history and building a custom syllabus for that topic. Check back in a moment — I'll have a 5-step path ready." }
    ]);
    setAiInput("");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <Navbar variant="dashboard" />

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: "calc(100vh - 64px)" }}>

        {/* ── SIDEBAR ── */}
        <aside style={{
          background: "white",
          borderRight: "1px solid var(--border)",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 64,
          height: "calc(100vh - 64px)",
          overflowY: "auto",
          boxShadow: "2px 0 12px rgba(15,23,42,0.04)",
        }}>
          {SIDEBAR_ITEMS.map((item) => (
            <Link key={item.label} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px", borderRadius: 10,
              textDecoration: "none", marginBottom: 4,
              background: item.active ? "var(--primary-subtle)" : "transparent",
              border: `1px solid ${item.active ? "rgba(37,99,235,0.2)" : "transparent"}`,
              color: item.active ? "var(--primary)" : "var(--text-2)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: item.active ? 700 : 500,
              fontSize: 14,
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { if (!item.active) { (e.currentTarget as HTMLElement).style.background = "var(--bg-base)"; (e.currentTarget as HTMLElement).style.color = "var(--text-1)"; } }}
            onMouseLeave={e => { if (!item.active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-2)"; } }}>
              <item.icon size={16} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span style={{ background: "var(--primary)", color: "white", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>
                  {item.badge}
                </span>
              )}
            </Link>
          ))}

          <div style={{ marginTop: "auto" }}>
            {/* AI Active indicator */}
            <div style={{
              background: "var(--primary-subtle)",
              border: "1px solid rgba(37,99,235,0.15)",
              borderRadius: 12, padding: "16px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, var(--primary-dark), var(--primary-light))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Zap size={13} color="white" fill="white" />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--primary)" }}>AI Concierge</div>
                  <div style={{ fontSize: 10, color: "var(--emerald)" }}>● Active</div>
                </div>
              </div>
              <p style={{ fontSize: 11, color: "var(--text-2)", lineHeight: 1.5 }}>Your learning path is being dynamically updated based on recent activity.</p>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main style={{ padding: "32px", overflowY: "auto", background: "var(--bg-base)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>

            {/* Welcome + Velocity */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "start", marginBottom: 40 }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--primary)", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.06em", marginBottom: 8 }}>WELCOME BACK, ALEX 👋</div>
                <h1 style={{ fontSize: "clamp(24px, 3vw, 36px)", marginBottom: 12, color: "var(--text-1)" }}>Cultivating your<br />expertise today.</h1>
                <p style={{ color: "var(--text-2)", fontSize: 15, lineHeight: 1.6, maxWidth: 500 }}>
                  You've completed <strong style={{ color: "var(--primary)" }}>85% of your weekly goal</strong>. Two new modules are ready for review based on yesterday's research.
                </p>
              </div>

              {/* Learning velocity card */}
              <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px", minWidth: 220, boxShadow: "0 2px 8px rgba(15,23,42,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <TrendingUp size={14} color="var(--primary)" />
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--text-1)" }}>Learning Velocity</span>
                </div>
                <div style={{ color: "var(--emerald)", fontSize: 12, marginBottom: 16, fontWeight: 600 }}>+12.4% from last week</div>
                {/* Mini bar chart */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 52 }}>
                  {WEEKLY_ACTIVITY.map((d, i) => (
                    <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{
                        width: "100%",
                        height: `${d.pct * 44}px`,
                        background: i === 3 ? "var(--primary)" : i === 6 ? "var(--cyan)" : "rgba(37,99,235,0.2)",
                        borderRadius: 4,
                        transition: "height 0.3s",
                      }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 36 }}>
              {[
                { icon: Flame, label: "Day Streak", value: "7", color: "#F59E0B", bg: "#FFFBEB", sub: "Personal best!" },
                { icon: Clock, label: "Hours This Week", value: "14.5", color: "#0EA5E9", bg: "#F0F9FF", sub: "+2.3 from last week" },
                { icon: CheckCircle2, label: "Completed", value: "23", color: "#10B981", bg: "#ECFDF5", sub: "modules this month" },
                { icon: Trophy, label: "Global Rank", value: "#142", color: "var(--primary)", bg: "var(--primary-subtle)", sub: "Top 2% worldwide" },
              ].map((stat) => (
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

            {/* Continue Learning */}
            <section style={{ marginBottom: 40 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontSize: 22, color: "var(--text-1)" }}>Continue Learning</h2>
                <Link href="#" style={{ color: "var(--primary)", textDecoration: "none", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  View All History <ChevronRight size={13} />
                </Link>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                {IN_PROGRESS.map((course) => (
                  <Link key={course.id} href={`/courses/${course.id}`} style={{ textDecoration: "none" }}>
                    <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", transition: "all 0.2s", boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-3px)"; el.style.borderColor = "var(--primary)"; el.style.boxShadow = "0 8px 24px rgba(37,99,235,0.1)"; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(0)"; el.style.borderColor = "var(--border)"; el.style.boxShadow = "0 1px 4px rgba(15,23,42,0.05)"; }}>
                      <div style={{ height: 100, background: course.bgColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, position: "relative" }}>
                        {course.emoji}
                        <div style={{ position: "absolute", top: 10, left: 10 }}>
                          <span className="badge badge-primary" style={{ fontSize: 9, padding: "3px 7px" }}>{course.category}</span>
                        </div>
                        <button style={{
                          position: "absolute", bottom: -16, right: 16,
                          width: 32, height: 32, borderRadius: "50%",
                          background: course.color, border: "3px solid white",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        }}>
                          <Play size={10} fill="white" color="white" />
                        </button>
                      </div>
                      <div style={{ padding: "20px 16px 16px" }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, lineHeight: 1.3, color: "var(--text-1)" }}>{course.title}</h3>
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 11, color: "var(--text-2)" }}>{course.progress}% complete</span>
                            <span style={{ fontSize: 11, color: "var(--text-2)" }}>{course.remaining} left</span>
                          </div>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${course.progress}%`, background: course.color }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Recommendations + Skills */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24, marginBottom: 40 }}>
              {/* Recommendations */}
              <section>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <Sparkles size={16} color="var(--primary)" />
                  <span style={{ fontSize: 11, color: "var(--primary)", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.06em" }}>PERSONALIZED SELECTION</span>
                </div>
                <h2 style={{ fontSize: 22, marginBottom: 20, color: "var(--text-1)" }}>Curated for Your Path</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {RECOMMENDATIONS.map((rec) => (
                    <Link key={rec.id} href={`/courses/${rec.id}`} style={{ textDecoration: "none" }}>
                      <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: "18px", display: "grid", gridTemplateColumns: "80px 1fr auto", gap: 16, alignItems: "center", transition: "all 0.2s", boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}
                        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--primary)"; el.style.transform = "translateX(4px)"; el.style.boxShadow = "0 4px 16px rgba(37,99,235,0.08)"; }}
                        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--border)"; el.style.transform = "translateX(0)"; el.style.boxShadow = "0 1px 4px rgba(15,23,42,0.04)"; }}>
                        <div style={{ width: 80, height: 64, borderRadius: 10, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>{rec.emoji}</div>
                        <div>
                          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: "var(--text-1)" }}>{rec.title}</h3>
                          <p style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 8, lineHeight: 1.5 }}>{rec.desc}</p>
                          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 4 }}><Clock size={10} />{rec.duration}</span>
                            <span style={{ fontSize: 11, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 4 }}><BarChart2 size={10} />{rec.level}</span>
                            <span style={{ fontSize: 11, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 4 }}><Star size={10} fill="#F59E0B" color="#F59E0B" />{rec.rating}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: "center", flexShrink: 0 }}>
                          <div style={{ background: `${rec.accent}15`, border: `1px solid ${rec.accent}25`, borderRadius: 10, padding: "8px 12px", marginBottom: 8 }}>
                            <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", color: rec.accent }}>{rec.match}%</div>
                            <div style={{ fontSize: 9, color: "var(--text-3)", fontWeight: 600 }}>MATCH</div>
                          </div>
                          <ArrowRight size={14} color="var(--text-3)" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              {/* Skill Trajectory */}
              <section>
                <h2 style={{ fontSize: 22, marginBottom: 20, color: "var(--text-1)" }}>Skill Trajectory</h2>
                <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: "20px", marginBottom: 16, boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
                  {SKILLS.map((skill, i) => (
                    <div key={skill.name} style={{ marginBottom: i < SKILLS.length - 1 ? 20 : 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--text-1)" }}>{skill.name}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: skill.color }}> Lv {skill.level}</span>
                      </div>
                      <div className="progress-bar" style={{ height: 5 }}>
                        <div style={{ height: "100%", width: `${skill.progress}%`, background: skill.color, borderRadius: 99, transition: "width 1s" }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Achievements */}
                <h2 style={{ fontSize: 18, marginBottom: 14, color: "var(--text-1)" }}>Achievements</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                  {ACHIEVEMENTS.map((ach) => (
                    <div key={ach.label} title={ach.label} style={{
                      width: 48, height: 48,
                      background: ach.unlocked ? `${ach.color}12` : "var(--bg-base)",
                      border: `1.5px solid ${ach.unlocked ? `${ach.color}30` : "var(--border)"}`,
                      borderRadius: 10,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "help",
                    }}>
                      {ach.unlocked ? (
                        <ach.icon size={18} color={ach.color} />
                      ) : (
                        <Lock size={14} color="var(--text-3)" />
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* AI Concierge */}
            <section>
              <div style={{
                background: "linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 100%)",
                border: "1px solid rgba(37,99,235,0.15)",
                borderRadius: 20,
                padding: "28px 32px",
              }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, var(--primary-dark), var(--primary-light))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Zap size={16} color="white" fill="white" />
                      </div>
                      <div>
                        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 17, color: "var(--text-1)" }}>Ask the Curator</div>
                        <div style={{ fontSize: 11, color: "var(--primary)", fontWeight: 600 }}>AI · ONLINE</div>
                      </div>
                    </div>
                    <p style={{ color: "var(--text-2)", fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
                      Not sure what to learn next? Describe your goal and let the AI build your next syllabus.
                    </p>
                    {/* Quick prompts */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                      {["Suggest a path for Quantum Cryptography", "Summarize my progress this month", "What should I learn after Neural Networks?"].map(prompt => (
                        <button key={prompt} onClick={() => sendToAI(prompt)} style={{
                          background: "white", border: "1.5px solid var(--border)",
                          borderRadius: 9, padding: "9px 14px", cursor: "pointer",
                          textAlign: "left", fontSize: 13, color: "var(--text-2)",
                          fontFamily: "'Inter', sans-serif",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)"; (e.currentTarget as HTMLElement).style.color = "var(--primary)"; (e.currentTarget as HTMLElement).style.background = "var(--primary-subtle)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text-2)"; (e.currentTarget as HTMLElement).style.background = "white"; }}>
                          "{prompt}"
                        </button>
                      ))}
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                      <input
                        className="inp"
                        style={{ flex: 1 }}
                        placeholder="Ask anything about your learning..."
                        value={aiInput}
                        onChange={e => setAiInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && sendToAI(aiInput)}
                      />
                      <button onClick={() => sendToAI(aiInput)} className="btn-primary" style={{ padding: "11px 18px" }}>
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Chat output */}
                  <div style={{ background: "white", borderRadius: 14, padding: "16px", border: "1px solid var(--border)", minHeight: 220, maxHeight: 280, overflowY: "auto" }}>
                    {aiMessages.length === 0 ? (
                      <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-3)", fontSize: 13, textAlign: "center", padding: 20 }}>
                        <MessageSquare size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
                        <p>Ask me anything — I know your complete learning history and can build a personalized path in seconds.</p>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {aiMessages.map((msg, i) => (
                          <div key={i} style={{
                            padding: "10px 14px", borderRadius: 10,
                            background: msg.role === "user" ? "var(--primary-subtle)" : "var(--bg-base)",
                            border: `1px solid ${msg.role === "user" ? "rgba(37,99,235,0.2)" : "var(--border)"}`,
                            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                            maxWidth: "85%",
                            fontSize: 13, lineHeight: 1.5,
                          }}>
                            {msg.role === "ai" && <span style={{ fontSize: 10, color: "var(--primary)", fontWeight: 700, display: "block", marginBottom: 4 }}>AI CURATOR</span>}
                            {msg.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

          </div>
        </main>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "20px 32px", background: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "var(--text-3)", fontSize: 12 }}>© 2024 IntelliCourse. AI-Driven Excellence.</span>
        <div style={{ display: "flex", gap: 24 }}>
          {["Privacy Policy", "Help Center"].map(l => <Link key={l} href="#" style={{ color: "var(--text-3)", fontSize: 12, textDecoration: "none" }}>{l}</Link>)}
        </div>
      </footer>
    </div>
  );
}
