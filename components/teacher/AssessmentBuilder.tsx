"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import type { Assessment, AssessmentQuestion, QuestionOption, CurriculumSection } from "@/lib/types";
import {
  PlusCircle, Trash2, Save, Loader2, CheckCircle2, AlertTriangle,
  ClipboardList, FileQuestion, Upload, Video, ChevronDown, ChevronUp,
  Edit3, X, GripVertical, Check
} from "lucide-react";

const ASSESSMENT_TYPES = [
  { value: "quiz", label: "Quiz (Pilihan Ganda)", icon: ClipboardList, color: "#2563EB", bg: "#EFF6FF" },
  { value: "essay", label: "Essay", icon: FileQuestion, color: "#10B981", bg: "#ECFDF5" },
  { value: "file_upload", label: "Upload File", icon: Upload, color: "#F59E0B", bg: "#FFFBEB" },
  { value: "interview", label: "Wawancara", icon: Video, color: "#0EA5E9", bg: "#F0F9FF" },
] as const;

interface AssessmentBuilderProps {
  courseId: string;
  assessments: Assessment[];
  onAssessmentsChange: (assessments: Assessment[]) => void;
  sections?: CurriculumSection[];
}

export default function AssessmentBuilder({ courseId, assessments, onAssessmentsChange, sections = [] }: AssessmentBuilderProps) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 0: true });
  const [showNewForm, setShowNewForm] = useState(false);

  const toggle = (i: number) => setExpanded(p => ({ ...p, [i]: !p[i] }));

  // Add new assessment
  const addAssessment = (type: string) => {
    const a: Assessment = {
      id: `temp_${Date.now()}`,
      course_id: courseId,
      section_id: null,
      title: "",
      description: null,
      assessment_type: type as any,
      time_limit_minutes: type === "quiz" ? 30 : null,
      passing_score: 60,
      max_attempts: type === "quiz" ? 3 : 1,
      is_published: false,
      order: assessments.length + 1,
      created_at: new Date().toISOString(),
      questions: [],
    };
    onAssessmentsChange([...assessments, a]);
    setExpanded(p => ({ ...p, [assessments.length]: true }));
    setShowNewForm(false);
  };

  const updateAssessment = (idx: number, field: string, value: any) => {
    const u = [...assessments];
    (u[idx] as any)[field] = value;
    onAssessmentsChange(u);
  };

  const removeAssessment = async (idx: number) => {
    if (!confirm("Hapus assessment ini?")) return;
    const a = assessments[idx];
    if (!a.id.startsWith("temp_")) {
      await supabase.from("question_options").delete().in("question_id",
        (a.questions || []).map(q => q.id));
      await supabase.from("assessment_questions").delete().eq("assessment_id", a.id);
      await supabase.from("assessments").delete().eq("id", a.id);
    }
    onAssessmentsChange(assessments.filter((_, i) => i !== idx));
  };

  // Questions
  const addQuestion = (aIdx: number, type: string) => {
    const q: AssessmentQuestion = {
      id: `temp_${Date.now()}`,
      assessment_id: assessments[aIdx].id,
      question_text: "",
      question_type: type as any,
      points: 1,
      order: (assessments[aIdx].questions?.length || 0) + 1,
      created_at: new Date().toISOString(),
      options: type === "multiple_choice" ? [
        { id: `temp_o1_${Date.now()}`, question_id: "", option_text: "", is_correct: true, order: 1 },
        { id: `temp_o2_${Date.now()}`, question_id: "", option_text: "", is_correct: false, order: 2 },
        { id: `temp_o3_${Date.now()}`, question_id: "", option_text: "", is_correct: false, order: 3 },
        { id: `temp_o4_${Date.now()}`, question_id: "", option_text: "", is_correct: false, order: 4 },
      ] : [],
    };
    const u = [...assessments];
    if (!u[aIdx].questions) u[aIdx].questions = [];
    u[aIdx].questions!.push(q);
    onAssessmentsChange(u);
  };

  const updateQuestion = (aIdx: number, qIdx: number, field: string, value: any) => {
    const u = [...assessments];
    (u[aIdx].questions![qIdx] as any)[field] = value;
    onAssessmentsChange(u);
  };

  const removeQuestion = (aIdx: number, qIdx: number) => {
    const u = [...assessments];
    u[aIdx].questions = u[aIdx].questions!.filter((_, i) => i !== qIdx);
    onAssessmentsChange(u);
  };

  // Options
  const updateOption = (aIdx: number, qIdx: number, oIdx: number, field: string, value: any) => {
    const u = [...assessments];
    (u[aIdx].questions![qIdx].options![oIdx] as any)[field] = value;
    if (field === "is_correct" && value === true) {
      u[aIdx].questions![qIdx].options!.forEach((o, i) => { if (i !== oIdx) o.is_correct = false; });
    }
    onAssessmentsChange(u);
  };

  const addOption = (aIdx: number, qIdx: number) => {
    const u = [...assessments];
    const opts = u[aIdx].questions![qIdx].options || [];
    opts.push({
      id: `temp_${Date.now()}`, question_id: "", option_text: "",
      is_correct: false, order: opts.length + 1,
    });
    u[aIdx].questions![qIdx].options = opts;
    onAssessmentsChange(u);
  };

  const removeOption = (aIdx: number, qIdx: number, oIdx: number) => {
    const u = [...assessments];
    u[aIdx].questions![qIdx].options = u[aIdx].questions![qIdx].options!.filter((_, i) => i !== oIdx);
    onAssessmentsChange(u);
  };

  // Save
  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      for (const a of assessments) {
        if (!a.title.trim()) throw new Error("Semua assessment harus punya judul.");
        const aData = {
          course_id: courseId, title: a.title.trim(), description: a.description,
          assessment_type: a.assessment_type, time_limit_minutes: a.time_limit_minutes,
          passing_score: a.passing_score, max_attempts: a.max_attempts,
          is_published: a.is_published, order: a.order, section_id: a.section_id,
        };
        if (a.id.startsWith("temp_")) {
          const { data, error } = await supabase.from("assessments").insert(aData).select("id").single();
          if (error) throw error;
          a.id = data.id;
        } else {
          const { error } = await supabase.from("assessments").update(aData).eq("id", a.id);
          if (error) throw error;
        }
        // Save questions
        for (const q of (a.questions || [])) {
          if (!q.question_text.trim()) continue;
          const qData = {
            assessment_id: a.id, question_text: q.question_text.trim(),
            question_type: q.question_type, points: q.points, order: q.order,
          };
          if (q.id.startsWith("temp_")) {
            const { data, error } = await supabase.from("assessment_questions").insert(qData).select("id").single();
            if (error) throw error;
            q.id = data.id;
          } else {
            const { error } = await supabase.from("assessment_questions").update(qData).eq("id", q.id);
            if (error) throw error;
          }
          // Save options
          for (const o of (q.options || [])) {
            if (!o.option_text.trim()) continue;
            const oData = {
              question_id: q.id, option_text: o.option_text.trim(),
              is_correct: o.is_correct, order: o.order,
            };
            if (o.id.startsWith("temp_")) {
              const { data, error } = await supabase.from("question_options").insert(oData).select("id").single();
              if (error) throw error;
              o.id = data.id;
            } else {
              const { error } = await supabase.from("question_options").update(oData).eq("id", o.id);
              if (error) throw error;
            }
          }
        }
      }
      setMsg({ type: "success", text: "Assessment berhasil disimpan!" });
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Gagal menyimpan." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-1)", marginBottom: 4 }}>
            <ClipboardList size={20} style={{ display: "inline", marginRight: 8, verticalAlign: "middle" }} />
            Assessments
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-3)" }}>Buat quiz, esai, upload tugas, dan wawancara</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary"
          style={{ fontSize: 14, padding: "10px 22px", opacity: saving ? 0.6 : 1 }}>
          {saving ? <><Loader2 size={15} style={{ animation: "spin-slow 1s linear infinite" }} /> Menyimpan...</>
            : <><Save size={15} /> Simpan</>}
        </button>
      </div>

      {msg && (
        <div style={{
          background: msg.type === "success" ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
          border: `1px solid ${msg.type === "success" ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
          borderRadius: 10, padding: "12px 16px", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 8, fontSize: 13,
          color: msg.type === "success" ? "#059669" : "#EF4444",
        }}>
          {msg.type === "success" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />} {msg.text}
        </div>
      )}

      {/* Assessment list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {assessments.map((a, aIdx) => {
          const typeInfo = ASSESSMENT_TYPES.find(t => t.value === a.assessment_type) || ASSESSMENT_TYPES[0];
          const TypeIcon = typeInfo.icon;
          return (
            <div key={a.id} style={{
              background: "white", border: "1px solid var(--border)",
              borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(15,23,42,0.05)",
            }}>
              {/* Header */}
              <div style={{
                display: "flex", alignItems: "center", gap: 12, padding: "16px 20px",
                background: expanded[aIdx] ? typeInfo.bg : "transparent",
                borderBottom: expanded[aIdx] ? `1px solid ${typeInfo.color}20` : "none",
                cursor: "pointer",
              }} onClick={() => toggle(aIdx)}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: `${typeInfo.color}15`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <TypeIcon size={18} color={typeInfo.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>
                    {a.title || "Assessment Baru"}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", display: "flex", gap: 12, marginTop: 2 }}>
                    <span>{typeInfo.label}</span>
                    <span>{a.questions?.length || 0} pertanyaan</span>
                    {a.is_published && <span style={{ color: "#10B981" }}>● Published</span>}
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); removeAssessment(aIdx); }}
                  style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}>
                  <Trash2 size={14} color="#EF4444" />
                </button>
                <ChevronDown size={16} color="var(--text-2)"
                  style={{ transform: expanded[aIdx] ? "rotate(180deg)" : "none", transition: "0.2s" }} />
              </div>

              {/* Body */}
              {expanded[aIdx] && (
                <div style={{ padding: "20px" }}>
                  {/* Settings */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--text-1)" }}>Judul Assessment</label>
                      <input className="inp" value={a.title} placeholder="Contoh: Quiz Bab 1"
                        onChange={e => updateAssessment(aIdx, "title", e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--text-1)" }}>Deskripsi</label>
                      <input className="inp" value={a.description || ""} placeholder="Deskripsi singkat..."
                        onChange={e => updateAssessment(aIdx, "description", e.target.value)} />
                    </div>

                    {/* Section picker */}
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--text-1)" }}>
                        📍 Tampilkan Setelah Section
                      </label>
                      <select
                        className="inp"
                        value={a.section_id || ""}
                        onChange={e => updateAssessment(aIdx, "section_id", e.target.value || null)}
                        style={{ fontSize: 13, cursor: "pointer" }}
                      >
                        <option value="">Akhir Course (tidak terkait section)</option>
                        {sections.map((s, sIdx) => (
                          <option key={s.id} value={s.id}>Setelah Section {sIdx + 1}: {s.title}</option>
                        ))}
                      </select>
                      <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>
                        Assessment akan muncul di halaman belajar setelah siswa menyelesaikan section yang dipilih.
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--text-1)" }}>Batas Waktu (menit)</label>
                      <input className="inp" type="number" value={a.time_limit_minutes || ""} placeholder="Kosongkan = unlimited"
                        onChange={e => updateAssessment(aIdx, "time_limit_minutes", e.target.value ? parseInt(e.target.value) : null)} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--text-1)" }}>Passing Score (%)</label>
                      <input className="inp" type="number" min={0} max={100} value={a.passing_score}
                        onChange={e => updateAssessment(aIdx, "passing_score", parseInt(e.target.value) || 0)} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--text-1)" }}>Max Attempts</label>
                      <input className="inp" type="number" min={1} value={a.max_attempts}
                        onChange={e => updateAssessment(aIdx, "max_attempts", parseInt(e.target.value) || 1)} />
                    </div>
                    <div style={{ display: "flex", alignItems: "end" }}>
                      <label style={{
                        display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                        fontSize: 13, fontWeight: 600, color: a.is_published ? "#10B981" : "var(--text-2)",
                        padding: "10px 0",
                      }}>
                        <input type="checkbox" checked={a.is_published}
                          onChange={e => updateAssessment(aIdx, "is_published", e.target.checked)}
                          style={{ accentColor: "#10B981", width: 16, height: 16 }} />
                        {a.is_published ? "Published" : "Draft"}
                      </label>
                    </div>
                  </div>

                  {/* Questions */}
                  {(a.assessment_type === "quiz" || a.assessment_type === "essay" || a.assessment_type === "file_upload") && (
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "var(--text-1)" }}>Pertanyaan</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {(a.questions || []).map((q, qIdx) => (
                          <div key={q.id} style={{
                            background: "var(--bg-base)", border: "1px solid var(--border)",
                            borderRadius: 12, padding: 16,
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                              <span style={{
                                width: 24, height: 24, borderRadius: 6, background: `${typeInfo.color}15`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 11, fontWeight: 700, color: typeInfo.color,
                              }}>{qIdx + 1}</span>
                              <span style={{ flex: 1, fontSize: 11, color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase" }}>
                                {q.question_type === "multiple_choice" ? "Pilihan Ganda" : q.question_type === "essay" ? "Essay" : "Upload File"}
                              </span>
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <span style={{ fontSize: 11, color: "var(--text-3)" }}>Poin:</span>
                                <input className="inp" type="number" min={1} value={q.points} style={{ width: 50, padding: "4px 8px", fontSize: 12 }}
                                  onChange={e => updateQuestion(aIdx, qIdx, "points", parseInt(e.target.value) || 1)} />
                              </div>
                              <button onClick={() => removeQuestion(aIdx, qIdx)}
                                style={{ background: "transparent", border: "none", cursor: "pointer", padding: 2 }}>
                                <X size={14} color="#EF4444" />
                              </button>
                            </div>

                            <textarea className="inp" value={q.question_text} placeholder="Tulis pertanyaan di sini..."
                              onChange={e => updateQuestion(aIdx, qIdx, "question_text", e.target.value)}
                              rows={2} style={{ resize: "vertical", marginBottom: 10, fontSize: 13 }} />

                            {/* Multiple choice options */}
                            {q.question_type === "multiple_choice" && (
                              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {(q.options || []).map((o, oIdx) => (
                                  <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <button onClick={() => updateOption(aIdx, qIdx, oIdx, "is_correct", true)}
                                      style={{
                                        width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                                        border: `2px solid ${o.is_correct ? "#10B981" : "var(--border)"}`,
                                        background: o.is_correct ? "#10B981" : "white",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        cursor: "pointer", transition: "all 0.2s",
                                      }}>
                                      {o.is_correct && <Check size={12} color="white" />}
                                    </button>
                                    <input className="inp" value={o.option_text} placeholder={`Opsi ${String.fromCharCode(65 + oIdx)}`}
                                      onChange={e => updateOption(aIdx, qIdx, oIdx, "option_text", e.target.value)}
                                      style={{ flex: 1, fontSize: 13, padding: "8px 12px" }} />
                                    {(q.options?.length || 0) > 2 && (
                                      <button onClick={() => removeOption(aIdx, qIdx, oIdx)}
                                        style={{ background: "transparent", border: "none", cursor: "pointer", padding: 2 }}>
                                        <X size={12} color="var(--text-3)" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                                <button onClick={() => addOption(aIdx, qIdx)} style={{
                                  background: "transparent", border: "1px dashed var(--border)",
                                  borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 600,
                                  color: "var(--text-3)", cursor: "pointer", display: "flex",
                                  alignItems: "center", gap: 4, width: "fit-content",
                                }}>
                                  <PlusCircle size={12} /> Tambah Opsi
                                </button>
                              </div>
                            )}

                            {q.question_type === "essay" && (
                              <div style={{ fontSize: 12, color: "var(--text-3)", fontStyle: "italic", padding: "8px 0" }}>
                                Siswa akan menulis jawaban esai. Teacher akan menilai secara manual.
                              </div>
                            )}
                            {q.question_type === "file_upload" && (
                              <div style={{ fontSize: 12, color: "var(--text-3)", fontStyle: "italic", padding: "8px 0" }}>
                                Siswa akan mengupload file sebagai jawaban. Teacher akan menilai secara manual.
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Add question buttons */}
                      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                        {a.assessment_type === "quiz" && (
                          <button onClick={() => addQuestion(aIdx, "multiple_choice")} style={{
                            background: "transparent", border: "1.5px dashed var(--border)",
                            borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600,
                            color: "var(--text-2)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                          }}><PlusCircle size={14} /> Pilihan Ganda</button>
                        )}
                        {(a.assessment_type === "essay" || a.assessment_type === "quiz") && (
                          <button onClick={() => addQuestion(aIdx, "essay")} style={{
                            background: "transparent", border: "1.5px dashed var(--border)",
                            borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600,
                            color: "var(--text-2)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                          }}><PlusCircle size={14} /> Essay</button>
                        )}
                        {a.assessment_type === "file_upload" && (
                          <button onClick={() => addQuestion(aIdx, "file_upload")} style={{
                            background: "transparent", border: "1.5px dashed var(--border)",
                            borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600,
                            color: "var(--text-2)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                          }}><PlusCircle size={14} /> Upload File</button>
                        )}
                      </div>
                    </div>
                  )}

                  {a.assessment_type === "interview" && (
                    <div style={{
                      background: "var(--bg-base)", border: "1px solid var(--border)",
                      borderRadius: 12, padding: 20, textAlign: "center",
                    }}>
                      <Video size={28} color="var(--primary)" style={{ marginBottom: 8 }} />
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: "var(--text-1)" }}>
                        Assessment Wawancara
                      </div>
                      <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.6 }}>
                        Siswa yang mendaftar akan dijadwalkan untuk sesi wawancara. 
                        Anda bisa mengatur jadwal dan link meeting setelah siswa submit.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add assessment */}
      {showNewForm ? (
        <div style={{
          marginTop: 16, border: "1.5px dashed var(--primary)", borderRadius: 14,
          padding: 20, background: "var(--primary-subtle)",
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: "var(--text-1)" }}>Pilih tipe assessment:</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {ASSESSMENT_TYPES.map(t => (
              <button key={t.value} onClick={() => addAssessment(t.value)} style={{
                background: "white", border: `1.5px solid ${t.color}30`, borderRadius: 12,
                padding: "16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { (e.currentTarget).style.borderColor = t.color; (e.currentTarget).style.background = t.bg; }}
              onMouseLeave={e => { (e.currentTarget).style.borderColor = `${t.color}30`; (e.currentTarget).style.background = "white"; }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: t.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <t.icon size={20} color={t.color} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{t.label}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setShowNewForm(false)} style={{ marginTop: 10, background: "transparent", border: "none", fontSize: 12, color: "var(--text-3)", cursor: "pointer" }}>Batal</button>
        </div>
      ) : (
        <button onClick={() => setShowNewForm(true)} style={{
          width: "100%", marginTop: 16, background: "white", border: "2px dashed var(--border)",
          borderRadius: 14, padding: 18, cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 10, fontSize: 14, fontWeight: 700, color: "var(--text-2)",
          fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.2s",
        }}
        onMouseEnter={e => { (e.currentTarget).style.borderColor = "var(--primary)"; (e.currentTarget).style.color = "var(--primary)"; }}
        onMouseLeave={e => { (e.currentTarget).style.borderColor = "var(--border)"; (e.currentTarget).style.color = "var(--text-2)"; }}>
          <PlusCircle size={18} /> Tambah Assessment Baru
        </button>
      )}
    </div>
  );
}
