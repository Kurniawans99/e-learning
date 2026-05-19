"use client";

import { useState, useEffect, use, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import FileUploader from "@/components/teacher/FileUploader";
import type { Assessment, AssessmentQuestion } from "@/lib/types";
import {
  ArrowLeft, Clock, CheckCircle2, AlertTriangle, Send,
  ClipboardList, Timer, Award, Loader2
} from "lucide-react";

export default function AssessmentPage({ params }: { params: Promise<{ id: string; assessmentId: string }> }) {
  const { id, assessmentId } = use(params);
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [answers, setAnswers] = useState<Record<string, { optionId?: string; text?: string; fileUrl?: string }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      setUserId(user.id);

      const { data } = await supabase
        .from("assessments")
        .select(`*, questions:assessment_questions(*, options:question_options(*))`)
        .eq("id", assessmentId)
        .single();

      if (!data) { router.push(`/courses/${id}`); return; }
      data.questions?.sort((a: any, b: any) => a.order - b.order);
      data.questions?.forEach((q: any) => q.options?.sort((a: any, b: any) => a.order - b.order));
      setAssessment(data);

      if (data.time_limit_minutes) setTimeLeft(data.time_limit_minutes * 60);

      // Check existing submission
      const { data: existing } = await supabase
        .from("student_submissions")
        .select("*, answers:submission_answers(*)")
        .eq("assessment_id", assessmentId)
        .eq("student_id", user.id)
        .single();

      if (existing && existing.status !== "in_progress") {
        setSubmitted(true);
        setScore(existing.score);
      }
      setLoading(false);
    }
    load();
  }, [assessmentId]);

  // Timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitted) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev !== null && prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSubmit = useCallback(async () => {
    if (!assessment || !userId || submitting) return;
    setSubmitting(true);
    setMsg(null);

    try {
      // Calculate score for multiple choice
      let totalPoints = 0;
      let earnedPoints = 0;
      const answerRows: any[] = [];

      for (const q of (assessment.questions || [])) {
        totalPoints += q.points;
        const ans = answers[q.id];

        if (q.question_type === "multiple_choice" && ans?.optionId) {
          const correctOption = q.options?.find(o => o.is_correct);
          const isCorrect = correctOption?.id === ans.optionId;
          if (isCorrect) earnedPoints += q.points;
          answerRows.push({
            question_id: q.id,
            selected_option_id: ans.optionId,
            is_correct: isCorrect,
            points_earned: isCorrect ? q.points : 0,
          });
        } else if (q.question_type === "essay" && ans?.text) {
          answerRows.push({
            question_id: q.id,
            answer_text: ans.text,
            is_correct: null,
            points_earned: 0,
          });
        } else if (q.question_type === "file_upload" && ans?.fileUrl) {
          answerRows.push({
            question_id: q.id,
            file_url: ans.fileUrl,
            is_correct: null,
            points_earned: 0,
          });
        }
      }

      const calcScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
      const hasManualGrading = assessment.questions?.some(q => q.question_type !== "multiple_choice");
      const finalStatus = hasManualGrading ? "submitted" : "graded";

      // Create submission
      const { data: submission, error: subErr } = await supabase
        .from("student_submissions")
        .insert({
          assessment_id: assessmentId,
          student_id: userId,
          status: finalStatus,
          score: hasManualGrading ? null : calcScore,
          submitted_at: new Date().toISOString(),
          graded_at: hasManualGrading ? null : new Date().toISOString(),
        })
        .select("id")
        .single();

      if (subErr) throw subErr;

      // Insert answers
      if (answerRows.length > 0 && submission) {
        const { error: ansErr } = await supabase
          .from("submission_answers")
          .insert(answerRows.map(a => ({ ...a, submission_id: submission.id })));
        if (ansErr) throw ansErr;
      }

      setSubmitted(true);
      setScore(hasManualGrading ? null : calcScore);
      setMsg({
        type: "success",
        text: hasManualGrading
          ? "Jawaban terkirim! Menunggu penilaian dari teacher."
          : `Selesai! Skor Anda: ${calcScore}%`,
      });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Gagal mengirim jawaban." });
    } finally {
      setSubmitting(false);
    }
  }, [assessment, answers, userId, assessmentId, submitting]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={28} color="var(--primary)" style={{ animation: "spin-slow 1s linear infinite" }} />
      </div>
    );
  }

  if (!assessment) return null;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <Navbar />
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px" }}>
        {/* Header */}
        <Link href={`/courses/${id}/learn`} style={{
          display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13,
          color: "var(--text-3)", textDecoration: "none", marginBottom: 20,
        }}>
          <ArrowLeft size={14} /> Kembali ke Course
        </Link>

        <div style={{
          background: "white", border: "1px solid var(--border)", borderRadius: 20,
          padding: "28px", marginBottom: 24, boxShadow: "0 2px 12px rgba(15,23,42,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: "#EFF6FF",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ClipboardList size={22} color="#2563EB" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, marginBottom: 2 }}>{assessment.title}</h1>
              {assessment.description && (
                <p style={{ fontSize: 13, color: "var(--text-3)" }}>{assessment.description}</p>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4 }}>
              <ClipboardList size={12} /> {assessment.questions?.length || 0} pertanyaan
            </span>
            {assessment.time_limit_minutes && (
              <span style={{ fontSize: 12, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={12} /> {assessment.time_limit_minutes} menit
              </span>
            )}
            <span style={{ fontSize: 12, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4 }}>
              <Award size={12} /> Passing: {assessment.passing_score}%
            </span>
          </div>
        </div>

        {/* Timer */}
        {timeLeft !== null && !submitted && (
          <div style={{
            position: "sticky", top: 72, zIndex: 10, background: timeLeft < 60 ? "rgba(239,68,68,0.1)" : "rgba(37,99,235,0.08)",
            border: `1px solid ${timeLeft < 60 ? "rgba(239,68,68,0.25)" : "rgba(37,99,235,0.15)"}`,
            borderRadius: 12, padding: "10px 20px", marginBottom: 20,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <Timer size={16} color={timeLeft < 60 ? "#EF4444" : "var(--primary)"} />
            <span style={{
              fontSize: 18, fontWeight: 800, fontFamily: "'IBM Plex Mono', monospace",
              color: timeLeft < 60 ? "#EF4444" : "var(--primary)",
            }}>
              {formatTime(timeLeft)}
            </span>
          </div>
        )}

        {/* Messages */}
        {msg && (
          <div style={{
            background: msg.type === "success" ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
            border: `1px solid ${msg.type === "success" ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
            borderRadius: 12, padding: "14px 20px", marginBottom: 20,
            display: "flex", alignItems: "center", gap: 10, fontSize: 14,
            color: msg.type === "success" ? "#059669" : "#EF4444",
          }}>
            {msg.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />} {msg.text}
          </div>
        )}

        {/* Score card */}
        {submitted && score !== null && (
          <div style={{
            background: score >= assessment.passing_score
              ? "linear-gradient(135deg, #ECFDF5, #D1FAE5)" : "linear-gradient(135deg, #FEF2F2, #FEE2E2)",
            border: `1px solid ${score >= assessment.passing_score ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
            borderRadius: 20, padding: "32px", textAlign: "center", marginBottom: 24,
          }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: score >= assessment.passing_score ? "#059669" : "#EF4444" }}>
              {score}%
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4, color: score >= assessment.passing_score ? "#059669" : "#EF4444" }}>
              {score >= assessment.passing_score ? "🎉 Lulus!" : "Belum Lulus"}
            </div>
          </div>
        )}

        {/* Questions */}
        {!submitted && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {(assessment.questions || []).map((q, qIdx) => (
              <div key={q.id} style={{
                background: "white", border: "1px solid var(--border)",
                borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: 8, background: "var(--primary-subtle)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, color: "var(--primary)",
                  }}>{qIdx + 1}</span>
                  <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600 }}>{q.points} poin</span>
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: "var(--text-1)", lineHeight: 1.6 }}>
                  {q.question_text}
                </p>

                {q.question_type === "multiple_choice" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {(q.options || []).map((o, oIdx) => {
                      const selected = answers[q.id]?.optionId === o.id;
                      return (
                        <button key={o.id} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: { optionId: o.id } }))}
                          style={{
                            display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                            borderRadius: 12, border: `2px solid ${selected ? "var(--primary)" : "var(--border)"}`,
                            background: selected ? "var(--primary-subtle)" : "white",
                            cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                          }}>
                          <span style={{
                            width: 24, height: 24, borderRadius: "50%",
                            border: `2px solid ${selected ? "var(--primary)" : "var(--border)"}`,
                            background: selected ? "var(--primary)" : "white",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                          }}>
                            {selected && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "white" }} />}
                          </span>
                          <span style={{ fontSize: 14, color: selected ? "var(--primary)" : "var(--text-1)" }}>
                            {o.option_text}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {q.question_type === "essay" && (
                  <textarea className="inp" placeholder="Tulis jawaban Anda di sini..."
                    value={answers[q.id]?.text || ""}
                    onChange={e => setAnswers(prev => ({ ...prev, [q.id]: { text: e.target.value } }))}
                    rows={5} style={{ resize: "vertical", minHeight: 120, fontSize: 14, lineHeight: 1.7 }} />
                )}

                {q.question_type === "file_upload" && (
                  <FileUploader
                    accept="*/*" maxSizeMB={50}
                    bucket="student-submissions"
                    folder={userId || ""}
                    label="Upload jawaban Anda"
                    onUploadComplete={(result) => setAnswers(prev => ({ ...prev, [q.id]: { fileUrl: result.url } }))}
                  />
                )}
              </div>
            ))}

            {/* Submit */}
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary"
              style={{ alignSelf: "center", fontSize: 16, padding: "14px 40px", marginTop: 12 }}>
              {submitting ? <><Loader2 size={16} style={{ animation: "spin-slow 1s linear infinite" }} /> Mengirim...</>
                : <><Send size={16} /> Kirim Jawaban</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
