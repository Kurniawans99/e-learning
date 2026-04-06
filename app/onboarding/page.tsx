"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  Zap, ArrowRight, ArrowLeft, Check, Sparkles,
  Globe, Gamepad2, BarChart2, Brain, Settings2, Palette,
  Rocket, GraduationCap, Lightbulb, Briefcase,
  Code2, Database, Terminal, PenTool, Layers
} from "lucide-react";
import ReactMarkdown from "react-markdown";

const SPECIALIZATIONS = [
  { id: "web-development", label: "Web Development", icon: Globe, color: "#2563EB", bg: "#EFF6FF", desc: "React, Next.js, CSS, Full-Stack" },
  { id: "game-development", label: "Game Development", icon: Gamepad2, color: "#DC2626", bg: "#FEF2F2", desc: "Unity, Unreal Engine, C#, C++" },
  { id: "data-science", label: "Data Science", icon: BarChart2, color: "#059669", bg: "#ECFDF5", desc: "Python, Pandas, Visualisasi" },
  { id: "ai-ml", label: "AI & Machine Learning", icon: Brain, color: "#7C3AED", bg: "#F5F3FF", desc: "Deep Learning, NLP, PyTorch" },
  { id: "engineering", label: "Engineering & DevOps", icon: Settings2, color: "#0EA5E9", bg: "#F0F9FF", desc: "Cloud, Docker, CI/CD" },
  { id: "design", label: "UI/UX Design", icon: Palette, color: "#F59E0B", bg: "#FFFBEB", desc: "Figma, UX Research, Design Systems" },
];

const GOALS = [
  { id: "career-switch", label: "Pindah Karir", icon: Rocket, desc: "Ingin beralih ke bidang tech" },
  { id: "skill-upgrade", label: "Upgrade Skill", icon: GraduationCap, desc: "Tingkatkan kemampuan yang ada" },
  { id: "curiosity", label: "Rasa Ingin Tahu", icon: Lightbulb, desc: "Belajar hal baru yang menarik" },
  { id: "academic", label: "Keperluan Akademik", icon: Briefcase, desc: "Tugas kuliah atau riset" },
];

const LANGUAGES = [
  { id: "javascript", label: "JavaScript" }, { id: "typescript", label: "TypeScript" },
  { id: "python", label: "Python" }, { id: "java", label: "Java" },
  { id: "csharp", label: "C#" }, { id: "cpp", label: "C++" },
  { id: "go", label: "Go" }, { id: "rust", label: "Rust" },
  { id: "php", label: "PHP" }, { id: "swift", label: "Swift" },
  { id: "sql", label: "SQL" }, { id: "html-css", label: "HTML/CSS" },
  { id: "r", label: "R" }, { id: "none", label: "Belum ada" },
];

const LEVELS = [
  { id: "beginner", label: "Pemula", desc: "Baru mulai belajar programming", emoji: "🌱" },
  { id: "intermediate", label: "Menengah", desc: "Sudah paham dasar-dasar, ingin lebih dalam", emoji: "🌿" },
  { id: "advanced", label: "Mahir", desc: "Berpengalaman, ingin spesialisasi", emoji: "🌳" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Form state
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>("beginner");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [userName, setUserName] = useState("");

  // Fetch user name on mount
  useState(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.full_name?.split(" ")[0] || user.email?.split("@")[0] || "Learner");
      }
    })();
  });

  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  };

  const canProceed = () => {
    switch (step) {
      case 0: return true;
      case 1: return selectedSpecs.length > 0;
      case 2: return !!selectedLevel;
      case 3: return selectedGoals.length > 0;
      case 4: return selectedLangs.length > 0;
      case 5: return true;
      default: return true;
    }
  };

  const handleNext = async () => {
    if (step < 5) {
      setStep(step + 1);
      if (step === 4) {
        // Generate AI summary when entering final step
        generateSummary();
      }
    } else {
      // Save and redirect
      await savePreferences();
    }
  };

  const generateSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Saya adalah user baru di platform IntelliCourse. Berikut profil saya:
- Spesialisasi yang diminati: ${selectedSpecs.join(", ")}
- Level pengalaman: ${selectedLevel}
- Tujuan belajar: ${selectedGoals.join(", ")}
- Bahasa/tools yang dikuasai: ${selectedLangs.join(", ")}

Buatkan ringkasan learning path yang dipersonalisasi. Awali dengan 1 atau 2 paragraf pengantar singkat yang friendly dan menyemangati, lalu berikan poin-poin utama apa saja yang harus saya pelajari atau fokuskan menggunakan format Markdown list standar (bullet/numbers). Gunakan gaya bahasa yang profesional namun rileks.`,
          isOnboarding: true,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to generate summary");
      }

      setLoadingSummary(false); // Stop loading indicator, start streaming
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader available");
      
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunkStr = decoder.decode(value, { stream: true });
          setAiSummary(prev => prev + chunkStr);
        }
      }
    } catch (error) {
      console.error(error);
      setAiSummary("Maaf, gagal memuat profil. Silakan mulai kelas pilihan Anda!");
      setLoadingSummary(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("user_preferences").upsert({
      user_id: user.id,
      specializations: selectedSpecs,
      experience_level: selectedLevel,
      goals: selectedGoals,
      known_languages: selectedLangs,
      onboarding_completed: true,
      ai_summary: aiSummary,
    }, { onConflict: "user_id" });

    if (error) {
      console.error("Failed to save preferences:", error);
      alert("Gagal menyimpan preferensi: " + error.message);
      setSaving(false);
      return;
    }

    router.refresh(); // Panggil refresh sebelum push agar cache server diperbarui
    router.push("/dashboard");
  };

  const STEPS = [
    // Step 0: Welcome
    () => (
      <div style={{ textAlign: "center", maxWidth: 520, margin: "0 auto" }}>
        <div style={{
          width: 80, height: 80, borderRadius: 24, margin: "0 auto 32px",
          background: "linear-gradient(135deg, var(--primary-dark), var(--primary-light))",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 12px 40px rgba(37,99,235,0.35)",
        }}>
          <Sparkles size={36} color="white" />
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16, color: "var(--text-1)" }}>
          Halo, {userName}! 👋
        </h1>
        <p style={{ color: "var(--text-2)", fontSize: 17, lineHeight: 1.7, marginBottom: 12 }}>
          Selamat datang di <strong style={{ color: "var(--primary)" }}>IntelliCourse</strong>. Kami akan mempersonalisasi pengalaman belajar Anda menggunakan AI.
        </p>
        <p style={{ color: "var(--text-3)", fontSize: 14 }}>
          Proses ini hanya memerlukan 1-2 menit ⏱️
        </p>
      </div>
    ),

    // Step 1: Specializations
    () => (
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 10, color: "var(--text-1)" }}>Apa yang ingin Anda pelajari?</h2>
          <p style={{ color: "var(--text-2)", fontSize: 15 }}>Pilih 1-3 bidang yang menarik perhatian Anda</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
          {SPECIALIZATIONS.map(spec => {
            const isSelected = selectedSpecs.includes(spec.id);
            return (
              <button key={spec.id} onClick={() => toggleItem(selectedSpecs, setSelectedSpecs, spec.id)}
                style={{
                  background: isSelected ? spec.bg : "white",
                  border: `2px solid ${isSelected ? spec.color : "var(--border)"}`,
                  borderRadius: 16, padding: "20px", cursor: "pointer",
                  display: "flex", alignItems: "flex-start", gap: 14, textAlign: "left",
                  transition: "all 0.2s", boxShadow: isSelected ? `0 4px 16px ${spec.color}20` : "0 1px 4px rgba(0,0,0,0.04)",
                }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: isSelected ? `${spec.color}18` : "var(--bg-base)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <spec.icon size={22} color={isSelected ? spec.color : "var(--text-3)"} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: isSelected ? spec.color : "var(--text-1)", marginBottom: 4, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{spec.label}</div>
                  <div style={{ fontSize: 12, color: "var(--text-3)" }}>{spec.desc}</div>
                </div>
                {isSelected && (
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: spec.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Check size={14} color="white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    ),

    // Step 2: Experience Level
    () => (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 10, color: "var(--text-1)" }}>Level pengalaman Anda?</h2>
          <p style={{ color: "var(--text-2)", fontSize: 15 }}>Supaya kami bisa menyesuaikan tingkat kesulitan</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {LEVELS.map(level => {
            const isSelected = selectedLevel === level.id;
            return (
              <button key={level.id} onClick={() => setSelectedLevel(level.id)}
                style={{
                  background: isSelected ? "var(--primary-subtle)" : "white",
                  border: `2px solid ${isSelected ? "var(--primary)" : "var(--border)"}`,
                  borderRadius: 14, padding: "20px 24px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 16,
                  transition: "all 0.2s", boxShadow: isSelected ? "0 4px 16px rgba(37,99,235,0.15)" : "0 1px 4px rgba(0,0,0,0.04)",
                }}>
                <span style={{ fontSize: 28 }}>{level.emoji}</span>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: isSelected ? "var(--primary)" : "var(--text-1)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{level.label}</div>
                  <div style={{ fontSize: 13, color: "var(--text-2)" }}>{level.desc}</div>
                </div>
                {isSelected && (
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Check size={14} color="white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    ),

    // Step 3: Goals
    () => (
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 10, color: "var(--text-1)" }}>Apa tujuan belajar Anda?</h2>
          <p style={{ color: "var(--text-2)", fontSize: 15 }}>Pilih satu atau lebih yang sesuai</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          {GOALS.map(goal => {
            const isSelected = selectedGoals.includes(goal.id);
            return (
              <button key={goal.id} onClick={() => toggleItem(selectedGoals, setSelectedGoals, goal.id)}
                style={{
                  background: isSelected ? "var(--primary-subtle)" : "white",
                  border: `2px solid ${isSelected ? "var(--primary)" : "var(--border)"}`,
                  borderRadius: 14, padding: "20px", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center",
                  transition: "all 0.2s", boxShadow: isSelected ? "0 4px 16px rgba(37,99,235,0.15)" : "0 1px 4px rgba(0,0,0,0.04)",
                }}>
                <goal.icon size={28} color={isSelected ? "var(--primary)" : "var(--text-3)"} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: isSelected ? "var(--primary)" : "var(--text-1)", fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 4 }}>{goal.label}</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)" }}>{goal.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    ),

    // Step 4: Languages/Tools
    () => (
      <div style={{ maxWidth: 540, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 10, color: "var(--text-1)" }}>Bahasa & tools yang dikuasai?</h2>
          <p style={{ color: "var(--text-2)", fontSize: 15 }}>Pilih semua yang sudah Anda gunakan</p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
          {LANGUAGES.map(lang => {
            const isSelected = selectedLangs.includes(lang.id);
            return (
              <button key={lang.id} onClick={() => toggleItem(selectedLangs, setSelectedLangs, lang.id)}
                style={{
                  background: isSelected ? "var(--primary)" : "white",
                  border: `1.5px solid ${isSelected ? "var(--primary)" : "var(--border)"}`,
                  borderRadius: 99, padding: "8px 18px", cursor: "pointer",
                  color: isSelected ? "white" : "var(--text-1)",
                  fontWeight: 600, fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif",
                  transition: "all 0.15s", boxShadow: isSelected ? "0 2px 8px rgba(37,99,235,0.3)" : "none",
                }}>
                {lang.label}
              </button>
            );
          })}
        </div>
      </div>
    ),

    // Step 5: AI Summary
    () => (
      <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18, margin: "0 auto 24px",
          background: "linear-gradient(135deg, #7C3AED, #2563EB)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 32px rgba(124,58,237,0.3)",
        }}>
          <Brain size={30} color="white" />
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 10, color: "var(--text-1)" }}>Learning Path Anda Siap! 🎉</h2>
        <p style={{ color: "var(--text-2)", fontSize: 15, marginBottom: 28 }}>AI kami telah menganalisis profil Anda dan menyiapkan rekomendasi personal.</p>

        <div style={{
          background: "white", border: "1px solid var(--border)", borderRadius: 16, padding: 28,
          textAlign: "left", boxShadow: "0 2px 12px rgba(15,23,42,0.06)", marginBottom: 24,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Sparkles size={16} color="var(--primary)" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>AI LEARNING PATH</span>
          </div>
          {loadingSummary ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text-3)", padding: 20 }}>
              <div className="typing-indicator" style={{ display: "flex", gap: 4 }}>
                <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary)", animation: "typing-bounce 1.4s infinite", animationDelay: "0s" }} />
                <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary)", animation: "typing-bounce 1.4s infinite", animationDelay: "0.2s" }} />
                <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary)", animation: "typing-bounce 1.4s infinite", animationDelay: "0.4s" }} />
              </div>
              AI sedang menganalisis profil Anda...
            </div>
          ) : (
            <div style={{ color: "var(--text-2)", fontSize: 14, lineHeight: 1.8 }}>
              <ReactMarkdown
                components={{
                  p: ({node, ...props}) => <p style={{ marginBottom: "12px" }} {...props} />,
                  ul: ({node, ...props}) => <ul style={{ paddingLeft: "24px", marginBottom: "16px", listStyleType: "disc" }} {...props} />,
                  ol: ({node, ...props}) => <ol style={{ paddingLeft: "24px", marginBottom: "16px", listStyleType: "decimal" }} {...props} />,
                  li: ({node, ...props}) => <li style={{ marginBottom: "8px" }} {...props} />,
                  strong: ({node, ...props}) => <strong style={{ color: "var(--text-1)", fontWeight: 700 }} {...props} />,
                }}
              >
                {aiSummary}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Summary pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          {selectedSpecs.map(s => {
            const spec = SPECIALIZATIONS.find(sp => sp.id === s);
            return spec ? (
              <span key={s} style={{ background: spec.bg, color: spec.color, padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600, border: `1px solid ${spec.color}30` }}>
                {spec.label}
              </span>
            ) : null;
          })}
          <span style={{ background: "var(--bg-base)", color: "var(--text-2)", padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600, border: "1px solid var(--border)" }}>
            {LEVELS.find(l => l.id === selectedLevel)?.emoji} {LEVELS.find(l => l.id === selectedLevel)?.label}
          </span>
        </div>
      </div>
    ),
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: "linear-gradient(135deg, var(--primary-dark), var(--primary-light))",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
          }}>
            <Zap size={16} color="white" fill="white" />
          </div>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 17, color: "var(--text-1)" }}>
            Intelli<span style={{ color: "var(--primary)" }}>Course</span>
          </span>
        </div>
        {step > 0 && (
          <div style={{ fontSize: 13, color: "var(--text-3)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}>
            {step} / 5
          </div>
        )}
      </div>

      {/* Progress bar */}
      {step > 0 && (
        <div style={{ padding: "0 32px", marginBottom: 8 }}>
          <div style={{ height: 4, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 4,
              background: "linear-gradient(90deg, var(--primary-dark), var(--primary-light))",
              width: `${(step / 5) * 100}%`, transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            }} />
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 32px" }}>
        {STEPS[step]()}
      </div>

      {/* Bottom nav */}
      <div style={{ padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", background: "white" }}>
        <div>
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} style={{
              display: "flex", alignItems: "center", gap: 6, background: "transparent",
              border: "1.5px solid var(--border)", borderRadius: 10, padding: "10px 20px",
              cursor: "pointer", color: "var(--text-2)", fontWeight: 600, fontSize: 14,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
              <ArrowLeft size={16} /> Kembali
            </button>
          )}
        </div>
        <button
          onClick={handleNext}
          disabled={!canProceed() || saving}
          className="btn-primary"
          style={{
            fontSize: 15, padding: "12px 28px", opacity: canProceed() && !saving ? 1 : 0.5,
          }}>
          {saving ? "Menyimpan..." : step === 5 ? (
            <><Sparkles size={16} /> Mulai Belajar</>
          ) : step === 0 ? (
            <><Rocket size={16} /> Mulai Personalisasi</>
          ) : (
            <>Lanjutkan <ArrowRight size={16} /></>
          )}
        </button>
      </div>

      <style>{`
        @keyframes typing-bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
