"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  PlusCircle, ArrowRight, ArrowLeft, Check,
  BookOpen, FileText, Tag, Target, Layers,
  GraduationCap, DollarSign, Clock, BarChart2,
  CheckCircle2, AlertTriangle, Sparkles
} from "lucide-react";

const CATEGORIES = ["AI & ML", "Engineering", "Design", "Web3", "Data Science", "Mobile Dev"];
const LEVELS = ["Beginner", "Intermediate", "Advanced"];

export default function CreateCoursePage() {
  const supabase = createClient();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [instructorId, setInstructorId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [hours, setHours] = useState("");
  const [moduleCount, setModuleCount] = useState("");
  const [narrative, setNarrative] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [outcomes, setOutcomes] = useState<string[]>([""]);

  useEffect(() => {
    async function checkAccess() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      const { data: me } = await supabase.from("users").select("role").eq("id", user.id).single();
      if (me?.role !== "teacher" && me?.role !== "admin") { router.push("/dashboard"); return; }

      // Get or create instructor record
      const { data: instructor } = await supabase
        .from("instructors")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (instructor) {
        setInstructorId(instructor.id);
      } else {
        // Auto-create instructor record for this teacher
        const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Teacher";
        const { data: newInstructor, error } = await supabase
          .from("instructors")
          .insert({
            name: userName,
            title: "Instructor",
            user_id: user.id,
          })
          .select("id")
          .single();

        if (newInstructor) {
          setInstructorId(newInstructor.id);
        }
      }
    }
    checkAccess();
  }, []);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter(t => t !== tag));

  const addOutcome = () => setOutcomes([...outcomes, ""]);
  const updateOutcome = (i: number, val: string) => {
    const updated = [...outcomes];
    updated[i] = val;
    setOutcomes(updated);
  };
  const removeOutcome = (i: number) => setOutcomes(outcomes.filter((_, idx) => idx !== i));

  const canProceed = () => {
    switch (step) {
      case 0: return title.trim() && subtitle.trim();
      case 1: return category && level;
      case 2: return price && originalPrice && hours && moduleCount;
      case 3: return narrative.trim().length > 20;
      case 4: return true; // Optional
      default: return true;
    }
  };

  const handleSave = async () => {
    if (!instructorId) { setErrorMsg("Instructor not found."); return; }
    setSaving(true);
    setErrorMsg("");

    try {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

      const { data: course, error: courseError } = await supabase
        .from("courses")
        .insert({
          title: title.trim(),
          slug,
          subtitle: subtitle.trim(),
          category,
          level,
          price: parseFloat(price),
          original_price: parseFloat(originalPrice),
          hours: parseFloat(hours),
          module_count: parseInt(moduleCount),
          narrative: narrative.trim(),
          instructor_id: instructorId,
        })
        .select("id")
        .single();

      if (courseError) throw courseError;

      // Insert tags
      if (tags.length > 0 && course) {
        await supabase.from("course_tags").insert(
          tags.map(tag => ({ course_id: course.id, tag_name: tag }))
        );
      }

      // Insert outcomes
      const validOutcomes = outcomes.filter(o => o.trim());
      if (validOutcomes.length > 0 && course) {
        await supabase.from("course_outcomes").insert(
          validOutcomes.map((desc, i) => ({ course_id: course.id, description: desc.trim(), order: i + 1 }))
        );
      }

      setSuccessMsg("Course created successfully!");
      setTimeout(() => {
        router.push("/dashboard/teacher/courses");
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create course.");
    } finally {
      setSaving(false);
    }
  };

  const STEPS = [
    // Step 0: Basic Info
    () => (
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 10, color: "var(--text-1)" }}>Course Basics</h2>
          <p style={{ color: "var(--text-2)", fontSize: 15 }}>Start with the title and short description</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-1)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Course Title</label>
            <input className="inp" type="text" placeholder="e.g. Advanced React Patterns" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-1)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Subtitle</label>
            <input className="inp" type="text" placeholder="Brief description of the course" value={subtitle} onChange={e => setSubtitle(e.target.value)} />
          </div>
        </div>
      </div>
    ),
    // Step 1: Category & Level
    () => (
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 10, color: "var(--text-1)" }}>Category & Level</h2>
          <p style={{ color: "var(--text-2)", fontSize: 15 }}>Classify your course</p>
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 12, color: "var(--text-1)" }}>Category</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)} style={{
                background: category === c ? "var(--primary-subtle)" : "white",
                border: `2px solid ${category === c ? "var(--primary)" : "var(--border)"}`,
                borderRadius: 12, padding: "14px", cursor: "pointer",
                fontWeight: 600, fontSize: 13, color: category === c ? "var(--primary)" : "var(--text-1)",
                fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.2s",
              }}>{c}</button>
            ))}
          </div>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 12, color: "var(--text-1)" }}>Level</label>
          <div style={{ display: "flex", gap: 10 }}>
            {LEVELS.map(l => (
              <button key={l} onClick={() => setLevel(l)} style={{
                flex: 1, background: level === l ? "var(--primary-subtle)" : "white",
                border: `2px solid ${level === l ? "var(--primary)" : "var(--border)"}`,
                borderRadius: 12, padding: "14px", cursor: "pointer",
                fontWeight: 600, fontSize: 13, color: level === l ? "var(--primary)" : "var(--text-1)",
                fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.2s",
              }}>{l}</button>
            ))}
          </div>
        </div>
      </div>
    ),
    // Step 2: Pricing & Duration
    () => (
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 10, color: "var(--text-1)" }}>Pricing & Duration</h2>
          <p style={{ color: "var(--text-2)", fontSize: 15 }}>Set course pricing and content hours</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-1)" }}>Price ($)</label>
            <input className="inp" type="number" placeholder="29.99" value={price} onChange={e => setPrice(e.target.value)} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-1)" }}>Original Price ($)</label>
            <input className="inp" type="number" placeholder="49.99" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-1)" }}>Total Hours</label>
            <input className="inp" type="number" placeholder="24.5" value={hours} onChange={e => setHours(e.target.value)} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-1)" }}>Module Count</label>
            <input className="inp" type="number" placeholder="12" value={moduleCount} onChange={e => setModuleCount(e.target.value)} />
          </div>
        </div>
      </div>
    ),
    // Step 3: Narrative
    () => (
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 10, color: "var(--text-1)" }}>Course Description</h2>
          <p style={{ color: "var(--text-2)", fontSize: 15 }}>Write a compelling course narrative</p>
        </div>
        <textarea
          className="inp"
          placeholder="Describe what students will learn, the approach, and why this course is unique..."
          value={narrative}
          onChange={e => setNarrative(e.target.value)}
          rows={8}
          style={{ resize: "vertical", minHeight: 160 }}
        />
        <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 8 }}>{narrative.length} characters</p>
      </div>
    ),
    // Step 4: Tags & Outcomes
    () => (
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 10, color: "var(--text-1)" }}>Tags & Learning Outcomes</h2>
          <p style={{ color: "var(--text-2)", fontSize: 15 }}>Help students find and understand your course</p>
        </div>

        {/* Tags */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-1)" }}>Tags</label>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input className="inp" type="text" placeholder="Add a tag..." value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              style={{ flex: 1 }} />
            <button onClick={addTag} className="btn-secondary" style={{ padding: "8px 16px", fontSize: 13 }}>Add</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {tags.map(tag => (
              <span key={tag} style={{
                background: "var(--primary-subtle)", color: "var(--primary)",
                padding: "4px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                border: "1px solid rgba(37,99,235,0.2)", display: "inline-flex", alignItems: "center", gap: 4,
              }}>
                {tag}
                <button onClick={() => removeTag(tag)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: "var(--primary)" }}>×</button>
              </span>
            ))}
          </div>
        </div>

        {/* Outcomes */}
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-1)" }}>Learning Outcomes</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {outcomes.map((outcome, i) => (
              <div key={i} style={{ display: "flex", gap: 8 }}>
                <input className="inp" type="text" placeholder={`Outcome ${i + 1}`} value={outcome}
                  onChange={e => updateOutcome(i, e.target.value)} style={{ flex: 1 }} />
                {outcomes.length > 1 && (
                  <button onClick={() => removeOutcome(i)} style={{
                    background: "rgba(239,68,68,0.08)", color: "#EF4444",
                    border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8,
                    padding: "0 12px", cursor: "pointer", fontSize: 16,
                  }}>×</button>
                )}
              </div>
            ))}
          </div>
          <button onClick={addOutcome} style={{
            marginTop: 8, background: "transparent", border: "1.5px dashed var(--border)",
            borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600,
            color: "var(--text-2)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          }}>
            <PlusCircle size={14} /> Add Outcome
          </button>
        </div>
      </div>
    ),
  ];

  return (
    <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <GraduationCap size={14} color="#059669" />
          <span style={{ fontSize: 12, color: "#059669", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>CREATE COURSE</span>
        </div>
        <h1 style={{ fontSize: "clamp(20px, 3vw, 28px)", color: "var(--text-1)" }}>New Course</h1>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 600 }}>Step {step + 1} of {STEPS.length}</span>
          <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 600 }}>{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
        </div>
        <div style={{ height: 4, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 4,
            background: "linear-gradient(90deg, var(--primary-dark), var(--primary-light))",
            width: `${((step + 1) / STEPS.length) * 100}%`, transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          }} />
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", padding: "12px 16px", borderRadius: 10, fontSize: 13, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={16} /> {errorMsg}
        </div>
      )}
      {successMsg && (
        <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10B981", padding: "12px 16px", borderRadius: 10, fontSize: 13, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {/* Step content */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 0" }}>
        {STEPS[step]()}
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: 20, marginTop: 20 }}>
        <div>
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} style={{
              display: "flex", alignItems: "center", gap: 6, background: "transparent",
              border: "1.5px solid var(--border)", borderRadius: 10, padding: "10px 20px",
              cursor: "pointer", color: "var(--text-2)", fontWeight: 600, fontSize: 14,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
              <ArrowLeft size={16} /> Back
            </button>
          )}
        </div>
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="btn-primary"
            style={{ fontSize: 15, padding: "12px 28px", opacity: canProceed() ? 1 : 0.5 }}
          >
            Continue <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
            style={{ fontSize: 15, padding: "12px 28px", opacity: saving ? 0.5 : 1 }}
          >
            {saving ? "Publishing..." : <><Sparkles size={16} /> Publish Course</>}
          </button>
        )}
      </div>
    </div>
  );
}
