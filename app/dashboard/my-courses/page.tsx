"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import {
  BookOpen, Clock, BarChart2, Play, RotateCcw, Pause,
  CheckCircle2, Search, Filter, ArrowRight, Sparkles
} from "lucide-react";

type Enrollment = {
  id: string;
  course_id: string;
  progress: number;
  status: string;
  enrolled_at: string;
  last_accessed_at: string;
  courses: {
    id: string;
    slug: string;
    title: string;
    subtitle: string;
    category: string;
    level: string;
    hours: number;
    rating: number;
  };
};

const STATUS_TABS = [
  { key: "all", label: "All Courses" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "paused", label: "Paused" },
];

function statusIcon(status: string) {
  switch (status) {
    case "active": return <Play size={12} color="#0EA5E9" />;
    case "completed": return <CheckCircle2 size={12} color="#10B981" />;
    case "paused": return <Pause size={12} color="#F59E0B" />;
    default: return null;
  }
}

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

export default function MyCoursesPage() {
  const supabase = createClient();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchEnrollments() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_enrollments")
        .select("*, courses(*)")
        .eq("user_id", user.id)
        .order("last_accessed_at", { ascending: false });

      if (!error && data) {
        setEnrollments(data as unknown as Enrollment[]);
      }
      setLoading(false);
    }
    fetchEnrollments();
  }, []);

  const filtered = enrollments.filter((e) => {
    const matchesTab = activeTab === "all" || e.status === activeTab;
    const matchesSearch = e.courses?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const counts = {
    all: enrollments.length,
    active: enrollments.filter(e => e.status === "active").length,
    completed: enrollments.filter(e => e.status === "completed").length,
    paused: enrollments.filter(e => e.status === "paused").length,
  };

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 12, color: "var(--primary)", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.06em", marginBottom: 8, textTransform: "uppercase" }}>MY LEARNING</div>
        <h1 style={{ fontSize: "clamp(24px, 3vw, 36px)", marginBottom: 12, color: "var(--text-1)" }}>My Courses</h1>
        <p style={{ color: "var(--text-2)", fontSize: 15, lineHeight: 1.6, maxWidth: 500 }}>
          Track your progress and continue where you left off.
        </p>
      </div>

      {/* Search + Tabs */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 24, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "white", borderRadius: 10, padding: "8px 14px", border: "1.5px solid var(--border)", flex: "1 1 200px", maxWidth: 320 }}>
          <Search size={14} color="var(--text-3)" />
          <input
            type="text"
            placeholder="Search your courses..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, color: "var(--text-1)", fontFamily: "'Inter', sans-serif", width: "100%" }}
          />
        </div>
        <div style={{ display: "flex", gap: 4, background: "var(--bg-base)", borderRadius: 12, padding: 4, border: "1.5px solid var(--border)" }}>
          {STATUS_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: activeTab === tab.key ? "white" : "transparent",
                border: activeTab === tab.key ? "1px solid var(--border)" : "1px solid transparent",
                borderRadius: 9, padding: "7px 14px",
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 12,
                cursor: "pointer",
                color: activeTab === tab.key ? "var(--primary)" : "var(--text-2)",
                boxShadow: activeTab === tab.key ? "0 1px 4px rgba(15,23,42,0.06)" : "none",
                transition: "all 0.15s",
              }}
            >
              {tab.label} {counts[tab.key as keyof typeof counts] > 0 && <span style={{ marginLeft: 4, opacity: 0.7 }}>({counts[tab.key as keyof typeof counts]})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: 20, height: 100, animation: "shimmer 1.5s infinite", backgroundImage: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)", backgroundSize: "200% 100%" }} />
          ))}
        </div>
      )}

      {/* Course list */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map((enrollment) => {
            const course = enrollment.courses;
            const sc = statusColor(enrollment.status);
            const pc = progressColor(enrollment.progress);
            const lastAccessed = new Date(enrollment.last_accessed_at);
            const timeAgo = getTimeAgo(lastAccessed);
            return (
              <Link key={enrollment.id} href={`/courses/${course.slug}`} style={{ textDecoration: "none" }}>
                <div className="card-hover" style={{
                  background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: 20,
                  display: "grid", gridTemplateColumns: "70px 1fr auto", gap: 20, alignItems: "center",
                  boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
                }}>
                  {/* Course icon */}
                  <div style={{
                    width: 70, height: 56, borderRadius: 10, background: "var(--primary-subtle)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 24, fontWeight: 800, color: "var(--primary)", opacity: 0.5,
                  }}>
                    {course.title.slice(0, 2).toUpperCase()}
                  </div>

                  {/* Course info */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>{course.title}</h3>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 600,
                        background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                      }}>
                        {statusIcon(enrollment.status)}
                        {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 10 }}>{course.subtitle}</p>
                    <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 11, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4 }}><Clock size={10} />{course.hours}h total</span>
                      <span style={{ fontSize: 11, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4 }}><BarChart2 size={10} />{course.level}</span>
                      <span style={{ fontSize: 11, color: "var(--text-3)" }}>Last: {timeAgo}</span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="progress-bar" style={{ flex: 1, height: 6 }}>
                        <div className="progress-fill" style={{ width: `${enrollment.progress}%`, background: pc }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: pc, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{enrollment.progress}%</span>
                    </div>
                  </div>

                  {/* Action */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: enrollment.status === "completed" ? "#ECFDF5" : "var(--primary-subtle)",
                      border: `1px solid ${enrollment.status === "completed" ? "rgba(16,185,129,0.2)" : "rgba(37,99,235,0.2)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {enrollment.status === "completed"
                        ? <RotateCcw size={16} color="#10B981" />
                        : <Play size={16} color="var(--primary)" />}
                    </div>
                    <span style={{ fontSize: 10, color: "var(--text-3)", fontWeight: 600 }}>
                      {enrollment.status === "completed" ? "Review" : "Continue"}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div style={{
          textAlign: "center", padding: "64px 32px",
          background: "white", border: "1px dashed var(--border)", borderRadius: 16,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, margin: "0 auto 20px",
            background: "var(--primary-subtle)", border: "1px solid rgba(37,99,235,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <BookOpen size={28} color="var(--primary)" />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "var(--text-1)" }}>
            {searchQuery ? "No courses found" : "No courses yet"}
          </h3>
          <p style={{ color: "var(--text-2)", fontSize: 14, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
            {searchQuery
              ? "Try a different search term or change the filter."
              : "Start your learning journey by exploring our curated catalog of courses."}
          </p>
          {!searchQuery && (
            <Link href="/" className="btn-primary" style={{ fontSize: 14, padding: "12px 24px", textDecoration: "none" }}>
              <Sparkles size={15} /> Explore Courses
            </Link>
          )}
        </div>
      )}
    </>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
