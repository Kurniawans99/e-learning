"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  FileText, Search, User, Clock, CheckCircle2, X,
  Bot, Loader2, BookOpen, MessageSquare, AlertCircle
} from "lucide-react";

type SubmissionRecord = {
  id: string;
  status: string;
  score: number | null;
  submitted_at: string;
  student: { full_name: string; id: string };
  assessment: { 
    id: string;
    title: string; 
    passing_score: number;
    course: { title: string } 
  };
};

export default function TeacherSubmissionsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("needs_grading");

  // Drawer state
  const [detailSub, setDetailSub] = useState<SubmissionRecord | null>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Form state
  const [score, setScore] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);

  // Messages
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 4000); };
  const showError = (msg: string) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(""), 5000); };

  useEffect(() => {
    async function fetchSubmissions() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      const { data: me } = await supabase.from("users").select("role").eq("id", user.id).single();
      if (me?.role !== "teacher" && me?.role !== "admin") { router.push("/dashboard"); return; }

      // Get teacher's instructor record
      const { data: instructors } = await supabase.from("instructors").select("id").eq("user_id", user.id).limit(1);
      
      if (instructors && instructors.length > 0) {
        // Get courses
        const { data: courses } = await supabase.from("courses").select("id, title").eq("instructor_id", instructors[0].id);
        const courseIds = courses?.map(c => c.id) || [];
        const courseMap = new Map((courses || []).map(c => [c.id, c.title]));

        if (courseIds.length > 0) {
          // Get assessments
          const { data: assessments } = await supabase.from("assessments").select("id").in("course_id", courseIds);
          const assessmentIds = assessments?.map(a => a.id) || [];

          if (assessmentIds.length > 0) {
            // Get submissions
            const { data: subsData, error } = await supabase
              .from("student_submissions")
              .select("id, status, score, submitted_at, student_id, assessment_id")
              .in("assessment_id", assessmentIds)
              .not("status", "eq", "in_progress")
              .order("submitted_at", { ascending: false });

            if (!error && subsData) {
              // Need to manually join users and assessments
              const uIds = [...new Set(subsData.map(s => s.student_id))];
              const aIds = [...new Set(subsData.map(s => s.assessment_id))];

              const { data: usersData } = await supabase.from("users").select("id, full_name").in("id", uIds);
              const { data: assessmentsData } = await supabase
                .from("assessments")
                .select("id, title, passing_score, course_id")
                .in("id", aIds);

              const userMap = new Map((usersData || []).map(u => [u.id, u]));
              const assessmentMap = new Map((assessmentsData || []).map(a => [a.id, a]));

              const formatted = subsData.map(s => {
                const assessment = assessmentMap.get(s.assessment_id);
                return {
                  id: s.id,
                  status: s.status,
                  score: s.score,
                  submitted_at: s.submitted_at || new Date().toISOString(),
                  student: userMap.get(s.student_id) || { full_name: "Unknown", id: s.student_id },
                  assessment: {
                    id: s.assessment_id,
                    title: assessment?.title || "Unknown",
                    passing_score: assessment?.passing_score || 60,
                    course: { title: courseMap.get(assessment?.course_id) || "Unknown Course" }
                  }
                };
              });
              setSubmissions(formatted as SubmissionRecord[]);
            }
          }
        }
      }
      setLoading(false);
    }
    fetchSubmissions();
  }, []);

  const openDrawer = async (sub: SubmissionRecord) => {
    setDetailSub(sub);
    setDrawerLoading(true);
    setScore(sub.score !== null ? sub.score.toString() : "");
    setFeedback(""); // We don't fetch existing feedback in the list query to save bandwidth, but could if needed.

    // Fetch answers and questions
    const { data: ansData } = await supabase.from("submission_answers").select("*").eq("submission_id", sub.id);
    if (ansData && ansData.length > 0) {
      setAnswers(ansData);
      const qIds = [...new Set(ansData.map(a => a.question_id))];
      const { data: qData } = await supabase.from("assessment_questions").select("*").in("id", qIds);
      setQuestions(qData || []);
    } else {
      setAnswers([]);
      setQuestions([]);
    }

    setDrawerLoading(false);
  };

  const handleAIGrade = async () => {
    if (!detailSub || questions.length === 0) return;
    setIsAILoading(true);
    try {
      const res = await fetch("/api/ai/grade-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentTitle: detailSub.assessment.title,
          questions: questions,
          answers: answers
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setScore(data.suggested_score.toString());
      setFeedback(data.suggested_feedback);
      showSuccess("AI berhasil memberikan saran nilai.");
    } catch (err: any) {
      showError(err.message || "Gagal mendapatkan saran AI.");
    } finally {
      setIsAILoading(false);
    }
  };

  const handleSubmitGrade = async () => {
    if (!detailSub) return;
    const numScore = parseInt(score);
    if (isNaN(numScore) || numScore < 0 || numScore > 100) {
      showError("Skor harus berupa angka antara 0-100.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/teacher/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: detailSub.id,
          score: numScore,
          feedback: feedback
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Update local state
      setSubmissions(prev => prev.map(s => s.id === detailSub.id ? { ...s, status: "graded", score: numScore } : s));
      showSuccess("Penilaian berhasil disimpan!");
      setDetailSub(null);
    } catch (err: any) {
      showError(err.message || "Gagal menyimpan penilaian.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = submissions.filter(s => {
    const matchesTab = activeTab === "all" 
      ? true 
      : activeTab === "needs_grading" 
        ? s.status === "submitted" 
        : s.status === "graded";
    const matchesSearch = s.student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.assessment.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const counts = {
    needs_grading: submissions.filter(s => s.status === "submitted").length,
    graded: submissions.filter(s => s.status === "graded").length,
    all: submissions.length
  };

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <FileText size={14} color="#059669" />
          <span style={{ fontSize: 12, color: "#059669", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>SUBMISSIONS</span>
        </div>
        <h1 style={{ fontSize: "clamp(24px, 3vw, 36px)", marginBottom: 12, color: "var(--text-1)" }}>Student Submissions</h1>
        <p style={{ color: "var(--text-2)", fontSize: 15, lineHeight: 1.6, maxWidth: 500 }}>
          Review dan berikan nilai untuk tugas, essay, atau wawancara siswa Anda.
        </p>
      </div>

      {/* Messages */}
      {successMsg && (
        <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10B981", padding: "12px 16px", borderRadius: 10, fontSize: 13, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", padding: "12px 16px", borderRadius: 10, fontSize: 13, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={16} /> {errorMsg}
        </div>
      )}

      {/* Search + Tabs */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 24, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 4, background: "var(--bg-base)", borderRadius: 12, padding: 4, border: "1.5px solid var(--border)" }}>
          {[
            { key: "needs_grading", label: "Needs Grading", count: counts.needs_grading },
            { key: "graded", label: "Graded", count: counts.graded },
            { key: "all", label: "All", count: counts.all },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              background: activeTab === tab.key ? "white" : "transparent",
              border: activeTab === tab.key ? "1px solid var(--border)" : "1px solid transparent",
              borderRadius: 9, padding: "7px 14px",
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 12,
              cursor: "pointer", color: activeTab === tab.key ? "var(--primary)" : "var(--text-2)",
              boxShadow: activeTab === tab.key ? "0 1px 4px rgba(15,23,42,0.06)" : "none",
              transition: "all 0.15s",
            }}>
              {tab.label} {tab.count > 0 && <span style={{ marginLeft: 6, opacity: 0.7, background: activeTab === tab.key ? "var(--primary-subtle)" : "rgba(0,0,0,0.05)", padding: "2px 6px", borderRadius: 99, fontSize: 10 }}>{tab.count}</span>}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "white", borderRadius: 10, padding: "8px 14px", border: "1.5px solid var(--border)", width: 260 }}>
          <Search size={14} color="var(--text-3)" />
          <input
            type="text" placeholder="Cari siswa atau tugas..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, color: "var(--text-1)", fontFamily: "'Inter', sans-serif", width: "100%" }}
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 72, borderRadius: 12, animation: "shimmer 1.5s infinite", backgroundImage: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)", backgroundSize: "200% 100%" }} />
          ))}
        </div>
      )}

      {/* Submissions List */}
      {!loading && (
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1.5fr 120px 100px", gap: 16,
            padding: "12px 20px", background: "var(--bg-base)", borderBottom: "1px solid var(--border)",
            fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            <span>Student</span>
            <span>Assessment</span>
            <span>Date</span>
            <span>Status</span>
          </div>

          {filtered.length > 0 ? filtered.map((s, i) => (
            <button key={s.id} onClick={() => openDrawer(s)} style={{
              display: "grid", gridTemplateColumns: "1fr 1.5fr 120px 100px", gap: 16,
              padding: "14px 20px", alignItems: "center", width: "100%", textAlign: "left",
              background: "transparent", border: "none", borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
              cursor: "pointer", transition: "background 0.15s",
            }} className="hover-bg">
              {/* Student info */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: "linear-gradient(135deg, var(--primary-dark), var(--primary-light))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: "white", flexShrink: 0,
                }}>
                  {(s.student.full_name || "S").charAt(0).toUpperCase()}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{s.student.full_name}</div>
              </div>

              {/* Assessment */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{s.assessment.title}</div>
                <div style={{ fontSize: 11, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4 }}>
                  <BookOpen size={10} /> {s.assessment.course.title}
                </div>
              </div>

              {/* Date */}
              <div style={{ fontSize: 12, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 6 }}>
                <Clock size={12} />
                {new Date(s.submitted_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
              </div>

              {/* Status */}
              <div>
                {s.status === "graded" ? (
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#10B981", background: "#ECFDF5", border: "1px solid rgba(16,185,129,0.2)", padding: "4px 10px", borderRadius: 99 }}>
                    Skor: {s.score}
                  </span>
                ) : (
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#F59E0B", background: "#FFFBEB", border: "1px solid rgba(245,158,11,0.2)", padding: "4px 10px", borderRadius: 99, textTransform: "uppercase" }}>
                    Review
                  </span>
                )}
              </div>
            </button>
          )) : (
            <div style={{ padding: 48, textAlign: "center" }}>
              <CheckCircle2 size={32} color="var(--emerald)" style={{ marginBottom: 12, opacity: 0.5 }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", marginBottom: 4 }}>
                {searchQuery ? "Tidak ada yang cocok" : "Semua tugas sudah dinilai!"}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                Kerja bagus! Tidak ada submission yang butuh review.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── GRADING DRAWER ── */}
      {detailSub && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          zIndex: 1000, display: "flex", justifyContent: "flex-end",
        }}>
          <div
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)" }}
            onClick={() => setDetailSub(null)}
          />
          <div style={{
            position: "relative", width: "100%", maxWidth: 600, height: "100%",
            background: "white", boxShadow: "-8px 0 32px rgba(15,23,42,0.15)",
            animation: "slideIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards",
            display: "flex", flexDirection: "column",
          }}>
            <style>{`@keyframes slideIn { from{transform:translateX(100%)} to{transform:translateX(0)} }`}</style>

            {/* Header */}
            <div style={{ padding: "20px 28px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-1)", marginBottom: 4 }}>Review Submission</h3>
                <div style={{ fontSize: 12, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 6 }}>
                  <User size={12} /> {detailSub.student.full_name}
                </div>
              </div>
              <button onClick={() => setDetailSub(null)} style={{ background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={16} color="var(--text-2)" />
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: "auto", padding: "24px 28px" }}>
              <div style={{ background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px", marginBottom: 24 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>{detailSub.assessment.title}</h4>
                <div style={{ fontSize: 12, color: "var(--text-2)", display: "flex", gap: 16 }}>
                  <span>Course: {detailSub.assessment.course.title}</span>
                  <span>|</span>
                  <span>Passing Score: {detailSub.assessment.passing_score}</span>
                </div>
              </div>

              {drawerLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Loader2 size={24} className="spin" color="var(--primary)" /></div>
              ) : questions.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 32 }}>
                  {questions.map((q, idx) => {
                    const ans = answers.find(a => a.question_id === q.id);
                    return (
                      <div key={q.id}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", marginBottom: 10, lineHeight: 1.5 }}>
                          <span style={{ color: "var(--primary)" }}>Q{idx + 1}.</span> {q.question_text}
                        </div>
                        <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 16, fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                          {q.question_type === "file_upload" ? (
                            ans?.file_url ? (
                              <a href={ans.file_url} target="_blank" rel="noreferrer" style={{ color: "var(--primary)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}><FileText size={14}/> Lihat File Upload</a>
                            ) : "Tidak ada file."
                          ) : (
                            ans?.answer_text || <span style={{ fontStyle: "italic", color: "var(--text-3)" }}>Tidak dijawab.</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: "center", color: "var(--text-3)", fontSize: 13, padding: 20 }}>Tidak ada data pertanyaan/jawaban.</div>
              )}

              {/* Grading Form */}
              <div style={{ borderTop: "2px dashed var(--border)", paddingTop: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h4 style={{ fontSize: 15, fontWeight: 800, color: "var(--text-1)" }}>Penilaian & Feedback</h4>
                  <button 
                    onClick={handleAIGrade} 
                    disabled={isAILoading || questions.length === 0}
                    style={{
                      background: "linear-gradient(135deg, #8B5CF6, #3B82F6)", color: "white", border: "none",
                      padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                      display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
                      opacity: isAILoading ? 0.7 : 1, boxShadow: "0 4px 12px rgba(139,92,246,0.3)"
                    }}
                  >
                    {isAILoading ? <Loader2 size={14} className="spin" /> : <Bot size={14} />}
                    Minta Saran AI
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", display: "block", marginBottom: 6 }}>Skor Akhir (0-100)</label>
                    <input
                      type="number" min="0" max="100"
                      value={score} onChange={e => setScore(e.target.value)}
                      placeholder="Misal: 85"
                      className="inp" style={{ width: 120, fontSize: 16, fontWeight: 700 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                      <MessageSquare size={12} /> Feedback untuk Siswa
                    </label>
                    <textarea
                      value={feedback} onChange={e => setFeedback(e.target.value)}
                      placeholder="Tuliskan catatan, saran perbaikan, atau pujian di sini..."
                      className="inp" style={{ minHeight: 120, resize: "vertical", lineHeight: 1.5 }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "16px 28px", borderTop: "1px solid var(--border)", display: "flex", gap: 12, background: "var(--bg-base)" }}>
              <button onClick={() => setDetailSub(null)} className="btn-secondary" style={{ flex: 1, justifyContent: "center" }}>Batal</button>
              <button 
                onClick={handleSubmitGrade} 
                disabled={isSubmitting || !score}
                className="btn-primary" style={{ flex: 2, justifyContent: "center", opacity: isSubmitting || !score ? 0.6 : 1 }}
              >
                {isSubmitting ? <Loader2 size={16} className="spin" /> : <CheckCircle2 size={16} />}
                {detailSub.status === "graded" ? "Update Penilaian" : "Simpan Penilaian"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .hover-bg:hover { background: #F8FAFC !important; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
