"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ContentBuilder from "@/components/teacher/ContentBuilder";
import AssessmentBuilder from "@/components/teacher/AssessmentBuilder";
import type { CurriculumSection, Assessment } from "@/lib/types";
import {
  GraduationCap, ArrowLeft, Layers, ClipboardList, Settings,
  Users, BookOpen, Save, Loader2, CheckCircle2, AlertTriangle, Eye
} from "lucide-react";

const TABS = [
  { id: "content", label: "Content", icon: Layers },
  { id: "assessments", label: "Assessments", icon: ClipboardList },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function CourseEditorPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("content");
  const [course, setCourse] = useState<any>(null);
  const [sections, setSections] = useState<CurriculumSection[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  // Settings form
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [narrative, setNarrative] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      const { data: me } = await supabase.from("users").select("role").eq("id", user.id).single();
      if (me?.role !== "teacher" && me?.role !== "admin") { router.push("/dashboard"); return; }

      // Fetch course with sections, contents, assessments
      const { data: courseData } = await supabase
        .from("courses")
        .select(`
          *,
          sections:curriculum_sections(
            *,
            contents:section_contents(*),
            lessons(*)
          )
        `)
        .eq("id", courseId)
        .single();

      if (!courseData) { router.push("/dashboard/teacher/courses"); return; }

      // Sort
      courseData.sections?.sort((a: any, b: any) => a.order - b.order);
      courseData.sections?.forEach((s: any) => {
        s.contents?.sort((a: any, b: any) => a.order - b.order);
        s.lessons?.sort((a: any, b: any) => a.order - b.order);
      });

      setCourse(courseData);
      setSections(courseData.sections || []);
      setTitle(courseData.title);
      setSubtitle(courseData.subtitle);
      setNarrative(courseData.narrative || "");

      // Fetch assessments
      const { data: assessData } = await supabase
        .from("assessments")
        .select(`
          *,
          questions:assessment_questions(
            *,
            options:question_options(*)
          )
        `)
        .eq("course_id", courseId)
        .order("order");

      if (assessData) {
        assessData.forEach((a: any) => {
          a.questions?.sort((x: any, y: any) => x.order - y.order);
          a.questions?.forEach((q: any) => q.options?.sort((x: any, y: any) => x.order - y.order));
        });
        setAssessments(assessData);
      }

      setLoading(false);
    }
    fetchData();
  }, [courseId]);

  const saveSettings = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const { error } = await supabase.from("courses").update({
        title: title.trim(), subtitle: subtitle.trim(), narrative: narrative.trim(),
      }).eq("id", courseId);
      if (error) throw error;
      setMsg({ type: "success", text: "Settings tersimpan!" });
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: 120, borderRadius: 14, animation: "shimmer 1.5s infinite", backgroundImage: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)", backgroundSize: "200% 100%" }} />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <Link href="/dashboard/teacher/courses" style={{
          display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13,
          color: "var(--text-3)", textDecoration: "none", marginBottom: 12,
          fontWeight: 500,
        }}>
          <ArrowLeft size={14} /> Kembali ke My Courses
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <GraduationCap size={14} color="#059669" />
          <span style={{ fontSize: 12, color: "#059669", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>COURSE EDITOR</span>
        </div>
        <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: "clamp(20px, 3vw, 28px)", color: "var(--text-1)", marginBottom: 4 }}>{course?.title}</h1>
            <p style={{ fontSize: 13, color: "var(--text-3)" }}>{course?.category} • {course?.level}</p>
          </div>
          <Link href={`/courses/${course?.slug}`} target="_blank" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "var(--primary-subtle)", color: "var(--primary)",
            border: "1px solid rgba(37,99,235,0.2)", borderRadius: 10,
            padding: "8px 16px", fontSize: 13, fontWeight: 600, textDecoration: "none",
          }}>
            <Eye size={14} /> Preview
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 4, marginBottom: 28, background: "white",
        border: "1px solid var(--border)", borderRadius: 12, padding: 4,
        boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
      }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "12px 16px", borderRadius: 10, border: "none", cursor: "pointer",
            background: activeTab === tab.id ? "var(--primary)" : "transparent",
            color: activeTab === tab.id ? "white" : "var(--text-2)",
            fontSize: 14, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif",
            transition: "all 0.2s",
          }}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "content" && (
        <ContentBuilder courseId={courseId} sections={sections} onSectionsChange={setSections} />
      )}

      {activeTab === "assessments" && (
        <AssessmentBuilder courseId={courseId} assessments={assessments} onAssessmentsChange={setAssessments} sections={sections} />
      )}

      {activeTab === "settings" && (
        <div style={{ maxWidth: 600 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>
            <Settings size={20} style={{ display: "inline", marginRight: 8, verticalAlign: "middle" }} />
            Course Settings
          </h2>
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
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-1)" }}>Judul Course</label>
              <input className="inp" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-1)" }}>Subtitle</label>
              <input className="inp" value={subtitle} onChange={e => setSubtitle(e.target.value)} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-1)" }}>Narrative / Deskripsi</label>
              <textarea className="inp" value={narrative} onChange={e => setNarrative(e.target.value)}
                rows={6} style={{ resize: "vertical", minHeight: 140 }} />
            </div>
            <button onClick={saveSettings} disabled={saving} className="btn-primary"
              style={{ alignSelf: "flex-start", fontSize: 14, padding: "10px 24px" }}>
              {saving ? <><Loader2 size={15} style={{ animation: "spin-slow 1s linear infinite" }} /> Menyimpan...</>
                : <><Save size={15} /> Simpan Settings</>}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
