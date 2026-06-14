"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import ReactMarkdown from "react-markdown";
import {
  FileText, BarChart2, CheckCircle2, XCircle, Clock,
  Search, Sparkles, Brain, TrendingUp, Award, Target,
  ChevronDown, ChevronRight, Loader2, ArrowRight,
  BookOpen, Star, AlertTriangle, Filter, Download
} from "lucide-react";
import { exportToExcel, formatDateForExport } from "@/lib/export-utils";

type SubmissionWithDetails = {
  id: string;
  assessment_id: string;
  status: "in_progress" | "submitted" | "graded";
  score: number | null;
  feedback: string | null;
  started_at: string;
  submitted_at: string | null;
  graded_at: string | null;
  assessments: {
    id: string;
    title: string;
    description: string | null;
    assessment_type: string;
    passing_score: number;
    course_id: string;
    courses: {
      id: string;
      title: string;
      slug: string;
      category: string;
    };
  };
};

function scoreColor(score: number, passingScore: number) {
  if (score >= passingScore) return { text: "#10B981", bg: "#ECFDF5", border: "rgba(16,185,129,0.2)", label: "Lulus" };
  return { text: "#EF4444", bg: "#FEF2F2", border: "rgba(239,68,68,0.2)", label: "Belum Lulus" };
}

function typeLabel(type: string) {
  switch (type) {
    case "quiz": return { label: "Quiz", color: "#2563EB", bg: "#EFF6FF" };
    case "essay": return { label: "Essay", color: "#7C3AED", bg: "#F5F3FF" };
    case "file_upload": return { label: "File Upload", color: "#059669", bg: "#ECFDF5" };
    case "interview": return { label: "Interview", color: "#F59E0B", bg: "#FFFBEB" };
    default: return { label: type, color: "var(--text-2)", bg: "var(--bg-base)" };
  }
}

const FILTER_TABS = [
  { key: "all", label: "Semua" },
  { key: "graded", label: "Sudah Dinilai" },
  { key: "submitted", label: "Menunggu Nilai" },
  { key: "in_progress", label: "Sedang Dikerjakan" },
];

export default function ReportsPage() {
  const supabase = createClient();
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // AI Feedback state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState("");
  const [aiRequested, setAiRequested] = useState(false);

  useEffect(() => {
    async function fetchSubmissions() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("student_submissions")
        .select(`
          id, assessment_id, status, score, feedback,
          started_at, submitted_at, graded_at,
          assessments (
            id, title, description, assessment_type, passing_score, course_id,
            courses (id, title, slug, category)
          )
        `)
        .eq("student_id", user.id)
        .order("submitted_at", { ascending: false });

      if (!error && data) {
        setSubmissions(data as unknown as SubmissionWithDetails[]);
      }
      setLoading(false);
    }
    fetchSubmissions();
  }, []);

  // Stats
  const graded = submissions.filter(s => s.status === "graded");
  const totalGraded = graded.length;
  const avgScore = totalGraded > 0
    ? Math.round(graded.reduce((sum, s) => sum + (s.score ?? 0), 0) / totalGraded)
    : 0;
  const passedCount = graded.filter(s => (s.score ?? 0) >= (s.assessments?.passing_score ?? 60)).length;
  const failedCount = totalGraded - passedCount;

  // Filtered
  const filtered = submissions.filter(s => {
    const matchesTab = activeTab === "all" || s.status === activeTab;
    const matchesSearch = (s.assessments?.title || "").toLowerCase().includes(searchQuery.toLowerCase())
      || (s.assessments?.courses?.title || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Request AI feedback
  const requestAIFeedback = async () => {
    if (graded.length === 0) return;
    setAiLoading(true);
    setAiFeedback("");
    setAiRequested(true);

    // Build report data string
    const reportLines = graded.map(s => {
      const pass = (s.score ?? 0) >= (s.assessments?.passing_score ?? 60);
      return `- "${s.assessments?.title}" (${s.assessments?.assessment_type}) dari course "${s.assessments?.courses?.title}" | Skor: ${s.score ?? 0}/${s.assessments?.passing_score ?? 60} (min. lulus) | Status: ${pass ? "Lulus" : "Belum Lulus"} | Feedback guru: ${s.feedback || "Tidak ada"}`;
    }).join("\n");

    const reportData = `Jumlah assessment yang telah dinilai: ${totalGraded}
Rata-rata skor: ${avgScore}
Lulus: ${passedCount} | Belum Lulus: ${failedCount}

Detail per assessment:
${reportLines}`;

    try {
      const res = await fetch("/api/ai/report-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportData }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setAiFeedback(errData.reply || "Gagal memuat analisis AI.");
        setAiLoading(false);
        return;
      }

      setAiLoading(false);
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          setAiFeedback(prev => prev + decoder.decode(value, { stream: true }));
        }
      }
    } catch (err) {
      console.error(err);
      setAiFeedback("Maaf, gagal memuat analisis AI. Silakan coba lagi.");
      setAiLoading(false);
    }
  };

  const handleExportReport = () => {
    const data = submissions.map(s => {
      const assessment = s.assessments;
      const course = assessment?.courses;
      const isGraded = s.status === "graded";
      const isPassed = isGraded && (s.score ?? 0) >= (assessment?.passing_score ?? 60);
      return {
        "Assessment": assessment?.title || "—",
        "Type": assessment?.assessment_type || "—",
        "Course": course?.title || "—",
        "Category": course?.category || "—",
        "Status": s.status === "graded" ? "Graded" : s.status === "submitted" ? "Pending" : "In Progress",
        "Score": s.score ?? "—",
        "Passing Score": assessment?.passing_score ?? 60,
        "Result": isGraded ? (isPassed ? "Passed" : "Failed") : "—",
        "Feedback": s.feedback || "—",
        "Started At": formatDateForExport(s.started_at),
        "Submitted At": formatDateForExport(s.submitted_at),
        "Graded At": formatDateForExport(s.graded_at),
      };
    });

    const summaryData = [{
      "Total Assessments": submissions.length,
      "Graded": totalGraded,
      "Average Score": `${avgScore}%`,
      "Passed": passedCount,
      "Failed": failedCount,
      "Pass Rate": totalGraded > 0 ? `${Math.round((passedCount / totalGraded) * 100)}%` : "—",
    }];

    exportToExcel([
      { name: "Summary", data: summaryData },
      { name: "Assessment Details", data },
    ], "My_Assessment_Report");
  };

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <FileText size={16} color="var(--primary)" />
            <span style={{ fontSize: 12, color: "var(--primary)", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>LAPORAN BELAJAR</span>
          </div>
          <h1 style={{ fontSize: "clamp(24px, 3vw, 36px)", marginBottom: 12, color: "var(--text-1)" }}>Reports</h1>
          <p style={{ color: "var(--text-2)", fontSize: 15, lineHeight: 1.6, maxWidth: 560 }}>
            Lihat hasil assessment Anda dan dapatkan saran AI untuk meningkatkan performa belajar.
          </p>
        </div>
        <button onClick={handleExportReport} disabled={submissions.length === 0} style={{
          display: "flex", alignItems: "center", gap: 8, padding: "10px 18px",
          background: "white", border: "1.5px solid var(--border)", borderRadius: 12,
          fontSize: 13, fontWeight: 700, color: "var(--text-1)", cursor: submissions.length === 0 ? "not-allowed" : "pointer",
          fontFamily: "'Plus Jakarta Sans', sans-serif", boxShadow: "0 1px 4px rgba(15,23,42,0.06)",
          opacity: submissions.length === 0 ? 0.5 : 1,
        }}>
          <Download size={15} /> Export Report
        </button>
      </div>

      {/* Stats cards */}
      <div className="mobile-col-2" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { icon: BarChart2, label: "Total Assessment", value: String(totalGraded), color: "#2563EB", bg: "#EFF6FF", sub: `dari ${submissions.length} dikerjakan` },
          { icon: Target, label: "Rata-rata Skor", value: `${avgScore}%`, color: avgScore >= 60 ? "#10B981" : "#F59E0B", bg: avgScore >= 60 ? "#ECFDF5" : "#FFFBEB", sub: "skor keseluruhan" },
          { icon: CheckCircle2, label: "Lulus", value: String(passedCount), color: "#10B981", bg: "#ECFDF5", sub: "assessment lulus" },
          { icon: XCircle, label: "Belum Lulus", value: String(failedCount), color: "#EF4444", bg: "#FEF2F2", sub: "perlu perbaikan" },
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

      {/* AI Insight Section */}
      <div style={{
        background: "linear-gradient(135deg, #1E40AF, #7C3AED)",
        borderRadius: 16, padding: "24px 28px", marginBottom: 28,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: "-30%", right: "-5%", width: 200, height: 200,
          borderRadius: "50%", background: "rgba(255,255,255,0.08)", pointerEvents: "none",
        }} />
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Brain size={22} color="white" />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "white", marginBottom: 4 }}>AI Performance Insight</h3>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
              AI akan menganalisis semua hasil assessment Anda dan memberikan saran personalisasi untuk improvement.
            </p>
          </div>
          {!aiRequested && (
            <button
              onClick={requestAIFeedback}
              disabled={totalGraded === 0}
              style={{
                background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)",
                borderRadius: 12, padding: "12px 24px", cursor: totalGraded === 0 ? "not-allowed" : "pointer",
                color: "white", fontWeight: 700, fontSize: 14,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                display: "flex", alignItems: "center", gap: 8,
                opacity: totalGraded === 0 ? 0.5 : 1,
                transition: "all 0.2s", backdropFilter: "blur(8px)",
              }}
            >
              <Sparkles size={16} /> Minta Saran AI
            </button>
          )}
        </div>

        {/* AI Response */}
        {aiRequested && (
          <div style={{
            marginTop: 20, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 14, padding: "20px 24px", backdropFilter: "blur(10px)",
          }}>
            {aiLoading ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12, color: "rgba(255,255,255,0.8)" }}>
                <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: 14 }}>AI sedang menganalisis performa Anda...</span>
              </div>
            ) : (
              <div style={{ color: "rgba(255,255,255,0.95)", fontSize: 14, lineHeight: 1.8 }}>
                <ReactMarkdown
                  components={{
                    p: ({ node, ...props }) => <p style={{ marginBottom: "12px" }} {...props} />,
                    ul: ({ node, ...props }) => <ul style={{ paddingLeft: "20px", marginBottom: "12px", listStyleType: "disc" }} {...props} />,
                    ol: ({ node, ...props }) => <ol style={{ paddingLeft: "20px", marginBottom: "12px", listStyleType: "decimal" }} {...props} />,
                    li: ({ node, ...props }) => <li style={{ marginBottom: "6px" }} {...props} />,
                    strong: ({ node, ...props }) => <strong style={{ color: "white", fontWeight: 700 }} {...props} />,
                    h2: ({ node, ...props }) => <h2 style={{ fontSize: 18, fontWeight: 800, marginTop: 16, marginBottom: 8, color: "white" }} {...props} />,
                    h3: ({ node, ...props }) => <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 14, marginBottom: 6, color: "white" }} {...props} />,
                  }}
                >
                  {aiFeedback}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search + Filter Tabs */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 24, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "white", borderRadius: 10, padding: "8px 14px", border: "1.5px solid var(--border)", flex: "1 1 200px", maxWidth: 320 }}>
          <Search size={14} color="var(--text-3)" />
          <input
            type="text"
            placeholder="Cari assessment atau course..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, color: "var(--text-1)", fontFamily: "'Inter', sans-serif", width: "100%" }}
          />
        </div>
        <div style={{ display: "flex", gap: 4, background: "var(--bg-base)", borderRadius: 12, padding: 4, border: "1.5px solid var(--border)" }}>
          {FILTER_TABS.map(tab => (
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
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ height: 88, borderRadius: 14, animation: "shimmer 1.5s infinite", backgroundImage: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)", backgroundSize: "200% 100%" }} />
          ))}
        </div>
      )}

      {/* Submission list */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(sub => {
            const assessment = sub.assessments;
            const course = assessment?.courses;
            const isGraded = sub.status === "graded";
            const isPassed = isGraded && (sub.score ?? 0) >= (assessment?.passing_score ?? 60);
            const sc = isGraded ? scoreColor(sub.score ?? 0, assessment?.passing_score ?? 60) : null;
            const tl = typeLabel(assessment?.assessment_type || "quiz");
            const isExpanded = expandedId === sub.id;

            return (
              <div key={sub.id} style={{
                background: "white", border: `1px solid ${isExpanded ? "rgba(37,99,235,0.2)" : "var(--border)"}`,
                borderRadius: 14, overflow: "hidden",
                boxShadow: isExpanded ? "0 4px 16px rgba(37,99,235,0.08)" : "0 1px 4px rgba(15,23,42,0.04)",
                transition: "all 0.25s",
              }}>
                {/* Main row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                  style={{
                    width: "100%", background: "transparent", border: "none", cursor: "pointer",
                    display: "grid", gridTemplateColumns: "48px 1fr auto auto 28px", gap: 16, alignItems: "center",
                    padding: "18px 20px", textAlign: "left",
                  }}
                >
                  {/* Type icon */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, background: tl.bg,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    {assessment?.assessment_type === "quiz" && <BarChart2 size={20} color={tl.color} />}
                    {assessment?.assessment_type === "essay" && <FileText size={20} color={tl.color} />}
                    {assessment?.assessment_type === "file_upload" && <BookOpen size={20} color={tl.color} />}
                    {assessment?.assessment_type === "interview" && <Star size={20} color={tl.color} />}
                  </div>

                  {/* Info */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {assessment?.title || "Assessment"}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 10, fontWeight: 600, color: tl.color, background: tl.bg,
                        padding: "2px 8px", borderRadius: 99, border: `1px solid ${tl.color}25`,
                      }}>{tl.label}</span>
                      <span style={{ fontSize: 12, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4 }}>
                        <BookOpen size={10} /> {course?.title || "Course"}
                      </span>
                    </div>
                  </div>

                  {/* Score */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    {isGraded && sc ? (
                      <>
                        <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", color: sc.text }}>{sub.score}%</div>
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: sc.text, background: sc.bg,
                          border: `1px solid ${sc.border}`, borderRadius: 99, padding: "2px 8px",
                          display: "inline-flex", alignItems: "center", gap: 3,
                        }}>
                          {isPassed ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
                          {sc.label}
                        </span>
                      </>
                    ) : (
                      <span style={{
                        fontSize: 10, fontWeight: 600, color: sub.status === "submitted" ? "#F59E0B" : "#0EA5E9",
                        background: sub.status === "submitted" ? "#FFFBEB" : "#F0F9FF",
                        padding: "4px 10px", borderRadius: 99,
                        border: `1px solid ${sub.status === "submitted" ? "rgba(245,158,11,0.2)" : "rgba(14,165,233,0.2)"}`,
                        display: "inline-flex", alignItems: "center", gap: 4,
                      }}>
                        <Clock size={9} />
                        {sub.status === "submitted" ? "Menunggu Nilai" : "Sedang Dikerjakan"}
                      </span>
                    )}
                  </div>

                  {/* Date */}
                  <div style={{ fontSize: 11, color: "var(--text-3)", textAlign: "right", minWidth: 80 }}>
                    {sub.graded_at
                      ? new Date(sub.graded_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                      : sub.submitted_at
                      ? new Date(sub.submitted_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </div>

                  {/* Chevron */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {isExpanded
                      ? <ChevronDown size={16} color="var(--primary)" />
                      : <ChevronRight size={16} color="var(--text-3)" />}
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{
                    borderTop: "1px solid var(--border)", padding: "20px 24px",
                    background: "var(--bg-base)", animation: "slide-up 0.25s ease-out",
                  }}>
                    <div className="mobile-col-1 mobile-flex-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                      {/* Left - Details */}
                      <div>
                        <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", marginBottom: 12, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Detail Assessment</h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                            <span style={{ color: "var(--text-3)" }}>Course</span>
                            <span style={{ color: "var(--text-1)", fontWeight: 600 }}>{course?.title}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                            <span style={{ color: "var(--text-3)" }}>Tipe</span>
                            <span style={{ color: tl.color, fontWeight: 600 }}>{tl.label}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                            <span style={{ color: "var(--text-3)" }}>Skor Minimum Lulus</span>
                            <span style={{ color: "var(--text-1)", fontWeight: 600 }}>{assessment?.passing_score ?? 60}%</span>
                          </div>
                          {isGraded && (
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                              <span style={{ color: "var(--text-3)" }}>Skor Anda</span>
                              <span style={{ color: sc?.text, fontWeight: 700 }}>{sub.score}%</span>
                            </div>
                          )}
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                            <span style={{ color: "var(--text-3)" }}>Mulai</span>
                            <span style={{ color: "var(--text-1)" }}>{new Date(sub.started_at).toLocaleString("id-ID")}</span>
                          </div>
                          {sub.submitted_at && (
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                              <span style={{ color: "var(--text-3)" }}>Submit</span>
                              <span style={{ color: "var(--text-1)" }}>{new Date(sub.submitted_at).toLocaleString("id-ID")}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right - Feedback */}
                      <div>
                        <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", marginBottom: 12, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Feedback Pengajar</h4>
                        {sub.feedback ? (
                          <div style={{
                            background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: 16,
                            fontSize: 13, color: "var(--text-2)", lineHeight: 1.7,
                          }}>
                            {sub.feedback}
                          </div>
                        ) : (
                          <div style={{
                            background: "white", border: "1px dashed var(--border)", borderRadius: 12, padding: 20,
                            textAlign: "center", color: "var(--text-3)", fontSize: 13,
                          }}>
                            {isGraded ? "Tidak ada feedback tertulis dari pengajar." : "Feedback akan muncul setelah dinilai."}
                          </div>
                        )}

                        {/* Score bar visual */}
                        {isGraded && (
                          <div style={{ marginTop: 16 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                              <span style={{ fontSize: 11, color: "var(--text-3)" }}>Skor</span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: sc?.text }}>{sub.score}%</span>
                            </div>
                            <div className="progress-bar" style={{ height: 8 }}>
                              <div className="progress-fill" style={{
                                width: `${sub.score ?? 0}%`,
                                background: isPassed
                                  ? "linear-gradient(90deg, #10B981, #34D399)"
                                  : "linear-gradient(90deg, #EF4444, #F87171)",
                              }} />
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                              <span style={{ fontSize: 10, color: "var(--text-3)" }}>0%</span>
                              <span style={{ fontSize: 10, color: "var(--text-3)", borderLeft: "1px dashed var(--border)", paddingLeft: 4 }}>Min. lulus: {assessment?.passing_score}%</span>
                              <span style={{ fontSize: 10, color: "var(--text-3)" }}>100%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
            <FileText size={28} color="var(--primary)" />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "var(--text-1)" }}>
            {searchQuery ? "Tidak ditemukan" : "Belum ada assessment"}
          </h3>
          <p style={{ color: "var(--text-2)", fontSize: 14, maxWidth: 400, margin: "0 auto" }}>
            {searchQuery
              ? "Coba kata kunci lain atau ubah filter."
              : "Anda belum mengerjakan assessment apapun. Mulai mengerjakan quiz dan tugas di course Anda!"}
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
