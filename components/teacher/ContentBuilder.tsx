"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import FileUploader from "./FileUploader";
import type { CurriculumSection, SectionContent } from "@/lib/types";
import {
  PlusCircle, Trash2, GripVertical, ChevronDown, ChevronUp,
  Video, Image, FileText, File, Save, Loader2, CheckCircle2,
  Edit3, X, Layers, AlertTriangle
} from "lucide-react";

const CONTENT_TYPES = [
  { value: "video", label: "Video", icon: Video, color: "#2563EB", bg: "#EFF6FF", accept: "video/*", maxMB: 50 },
  { value: "image", label: "Image", icon: Image, color: "#F59E0B", bg: "#FFFBEB", accept: "image/*", maxMB: 5 },
  { value: "text", label: "Text / Article", icon: FileText, color: "#10B981", bg: "#ECFDF5", accept: "", maxMB: 0 },
  { value: "document", label: "Document", icon: File, color: "#0EA5E9", bg: "#F0F9FF", accept: ".pdf,.doc,.docx", maxMB: 10 },
] as const;

interface ContentBuilderProps {
  courseId: string;
  sections: CurriculumSection[];
  onSectionsChange: (sections: CurriculumSection[]) => void;
}

export default function ContentBuilder({ courseId, sections, onSectionsChange }: ContentBuilderProps) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({ 0: true });
  const [addingContent, setAddingContent] = useState<{ sectionIdx: number; type: string } | null>(null);
  const [editingSectionIdx, setEditingSectionIdx] = useState<number | null>(null);

  const toggleSection = (idx: number) => {
    setExpandedSections(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // ── Section CRUD ──
  const addSection = () => {
    const newSection: CurriculumSection = {
      id: `temp_${Date.now()}`,
      title: "",
      description: "",
      order: sections.length + 1,
      contents: [],
      lessons: [],
    };
    onSectionsChange([...sections, newSection]);
    setExpandedSections(prev => ({ ...prev, [sections.length]: true }));
    setEditingSectionIdx(sections.length);
  };

  const updateSection = (idx: number, field: string, value: string) => {
    const updated = [...sections];
    (updated[idx] as any)[field] = value;
    onSectionsChange(updated);
  };

  const removeSection = async (idx: number) => {
    if (!confirm("Hapus section ini beserta semua kontennya?")) return;
    const section = sections[idx];

    if (!section.id.startsWith("temp_")) {
      await supabase.from("section_contents").delete().eq("section_id", section.id);
      await supabase.from("curriculum_sections").delete().eq("id", section.id);
    }

    const updated = sections.filter((_, i) => i !== idx);
    updated.forEach((s, i) => s.order = i + 1);
    onSectionsChange(updated);
  };

  const moveSection = (idx: number, direction: "up" | "down") => {
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= sections.length) return;
    const updated = [...sections];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    updated.forEach((s, i) => s.order = i + 1);
    onSectionsChange(updated);
  };

  // ── Content CRUD ──
  const addContent = (sectionIdx: number, type: string) => {
    const newContent: SectionContent = {
      id: `temp_${Date.now()}`,
      section_id: sections[sectionIdx].id,
      content_type: type as any,
      title: "",
      description: null,
      content_url: null,
      content_text: null,
      duration: null,
      file_size: 0,
      order: (sections[sectionIdx].contents?.length || 0) + 1,
      created_at: new Date().toISOString(),
    };
    const updated = [...sections];
    if (!updated[sectionIdx].contents) updated[sectionIdx].contents = [];
    updated[sectionIdx].contents!.push(newContent);
    onSectionsChange(updated);
    setAddingContent(null);
  };

  const updateContent = (sectionIdx: number, contentIdx: number, field: string, value: any) => {
    const updated = [...sections];
    (updated[sectionIdx].contents![contentIdx] as any)[field] = value;
    onSectionsChange(updated);
  };

  const removeContent = async (sectionIdx: number, contentIdx: number) => {
    const content = sections[sectionIdx].contents![contentIdx];
    if (!content.id.startsWith("temp_")) {
      await supabase.from("section_contents").delete().eq("id", content.id);
    }
    const updated = [...sections];
    updated[sectionIdx].contents = updated[sectionIdx].contents!.filter((_, i) => i !== contentIdx);
    updated[sectionIdx].contents!.forEach((c, i) => c.order = i + 1);
    onSectionsChange(updated);
  };

  // ── Save All ──
  const handleSaveAll = async () => {
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      for (const section of sections) {
        // Validate section title
        if (!section.title.trim()) {
          throw new Error("Semua section harus memiliki judul.");
        }

        if (section.id.startsWith("temp_")) {
          // Insert new section
          const { data: newSection, error } = await supabase
            .from("curriculum_sections")
            .insert({
              course_id: courseId,
              title: section.title.trim(),
              description: section.description || null,
              order: section.order,
            })
            .select("id")
            .single();

          if (error) throw error;
          section.id = newSection.id;

          // Update section_id for contents
          if (section.contents) {
            section.contents.forEach(c => c.section_id = newSection.id);
          }
        } else {
          // Update existing section
          const { error } = await supabase
            .from("curriculum_sections")
            .update({
              title: section.title.trim(),
              description: section.description || null,
              order: section.order,
            })
            .eq("id", section.id);
          if (error) throw error;
        }

        // Save contents
        if (section.contents) {
          for (const content of section.contents) {
            if (!content.title.trim()) continue;

            const contentData = {
              section_id: section.id,
              content_type: content.content_type,
              title: content.title.trim(),
              description: content.description || null,
              content_url: content.content_url || null,
              content_text: content.content_text || null,
              duration: content.duration || null,
              file_size: content.file_size || 0,
              order: content.order,
            };

            if (content.id.startsWith("temp_")) {
              const { data: newContent, error } = await supabase
                .from("section_contents")
                .insert(contentData)
                .select("id")
                .single();
              if (error) throw error;
              content.id = newContent.id;
            } else {
              const { error } = await supabase
                .from("section_contents")
                .update(contentData)
                .eq("id", content.id);
              if (error) throw error;
            }
          }
        }
      }

      setSuccessMsg("Konten berhasil disimpan!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan konten.");
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
            <Layers size={20} style={{ display: "inline", marginRight: 8, verticalAlign: "middle" }} />
            Course Content
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-3)" }}>
            Tambahkan section dan konten (video, image, teks, dokumen)
          </p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="btn-primary"
          style={{ fontSize: 14, padding: "10px 22px", opacity: saving ? 0.6 : 1 }}
        >
          {saving ? <><Loader2 size={15} style={{ animation: "spin-slow 1s linear infinite" }} /> Menyimpan...</>
            : <><Save size={15} /> Simpan Konten</>}
        </button>
      </div>

      {/* Messages */}
      {successMsg && (
        <div style={{
          background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)",
          borderRadius: 10, padding: "12px 16px", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#059669",
        }}>
          <CheckCircle2 size={15} /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
          borderRadius: 10, padding: "12px 16px", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#EF4444",
        }}>
          <AlertTriangle size={15} /> {errorMsg}
        </div>
      )}

      {/* Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {sections.map((section, sIdx) => (
          <div key={section.id} style={{
            background: "white", border: "1px solid var(--border)",
            borderRadius: 16, overflow: "hidden",
            boxShadow: "0 1px 4px rgba(15,23,42,0.05)",
          }}>
            {/* Section header */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12, padding: "16px 20px",
              background: expandedSections[sIdx] ? "var(--primary-subtle)" : "transparent",
              borderBottom: expandedSections[sIdx] ? "1px solid rgba(37,99,235,0.12)" : "none",
              transition: "all 0.2s",
            }}>
              <GripVertical size={16} color="var(--text-3)" style={{ cursor: "grab", flexShrink: 0 }} />

              <span style={{
                width: 28, height: 28, borderRadius: 8,
                background: expandedSections[sIdx] ? "var(--primary)" : "var(--bg-base)",
                color: expandedSections[sIdx] ? "white" : "var(--text-3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, flexShrink: 0,
              }}>
                {String(sIdx + 1).padStart(2, "0")}
              </span>

              {editingSectionIdx === sIdx ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <input
                    className="inp"
                    type="text"
                    placeholder="Judul Section"
                    value={section.title}
                    onChange={e => updateSection(sIdx, "title", e.target.value)}
                    style={{ fontSize: 14, fontWeight: 600, padding: "8px 12px" }}
                    autoFocus
                  />
                  <input
                    className="inp"
                    type="text"
                    placeholder="Deskripsi section (opsional)"
                    value={section.description || ""}
                    onChange={e => updateSection(sIdx, "description", e.target.value)}
                    style={{ fontSize: 12, padding: "6px 12px" }}
                  />
                  <button onClick={() => setEditingSectionIdx(null)} style={{
                    alignSelf: "flex-start", background: "var(--primary)", color: "white",
                    border: "none", borderRadius: 6, padding: "4px 12px", fontSize: 11,
                    fontWeight: 600, cursor: "pointer",
                  }}>Selesai</button>
                </div>
              ) : (
                <div style={{ flex: 1, cursor: "pointer" }} onClick={() => toggleSection(sIdx)}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>
                    {section.title || "Section Baru (klik edit)"}
                  </div>
                  {section.description && (
                    <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{section.description}</div>
                  )}
                </div>
              )}

              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                <button onClick={() => moveSection(sIdx, "up")} disabled={sIdx === 0}
                  style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, opacity: sIdx === 0 ? 0.3 : 1 }}>
                  <ChevronUp size={14} color="var(--text-3)" />
                </button>
                <button onClick={() => moveSection(sIdx, "down")} disabled={sIdx === sections.length - 1}
                  style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, opacity: sIdx === sections.length - 1 ? 0.3 : 1 }}>
                  <ChevronDown size={14} color="var(--text-3)" />
                </button>
                <button onClick={() => setEditingSectionIdx(editingSectionIdx === sIdx ? null : sIdx)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}>
                  <Edit3 size={13} color="var(--primary)" />
                </button>
                <button onClick={() => removeSection(sIdx)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}>
                  <Trash2 size={13} color="#EF4444" />
                </button>
                <button onClick={() => toggleSection(sIdx)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}>
                  <ChevronDown size={16} color="var(--text-2)"
                    style={{ transform: expandedSections[sIdx] ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
                </button>
              </div>
            </div>

            {/* Section content (expanded) */}
            {expandedSections[sIdx] && (
              <div style={{ padding: "16px 20px" }}>
                {/* Existing contents */}
                {section.contents && section.contents.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                    {section.contents.map((content, cIdx) => {
                      const typeInfo = CONTENT_TYPES.find(t => t.value === content.content_type) || CONTENT_TYPES[0];
                      const TypeIcon = typeInfo.icon;

                      return (
                        <div key={content.id} style={{
                          background: "var(--bg-base)", border: "1px solid var(--border)",
                          borderRadius: 12, padding: "16px",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: 9,
                              background: typeInfo.bg, display: "flex", alignItems: "center",
                              justifyContent: "center", flexShrink: 0,
                            }}>
                              <TypeIcon size={18} color={typeInfo.color} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <span style={{
                                fontSize: 10, fontWeight: 700, color: typeInfo.color,
                                textTransform: "uppercase", letterSpacing: "0.05em",
                              }}>{typeInfo.label}</span>
                            </div>
                            <button onClick={() => removeContent(sIdx, cIdx)}
                              style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}>
                              <X size={14} color="#EF4444" />
                            </button>
                          </div>

                          {/* Title */}
                          <input
                            className="inp"
                            type="text"
                            placeholder={`Judul ${typeInfo.label}`}
                            value={content.title}
                            onChange={e => updateContent(sIdx, cIdx, "title", e.target.value)}
                            style={{ marginBottom: 8, fontSize: 13 }}
                          />

                          {/* Description */}
                          <input
                            className="inp"
                            type="text"
                            placeholder="Deskripsi (opsional)"
                            value={content.description || ""}
                            onChange={e => updateContent(sIdx, cIdx, "description", e.target.value)}
                            style={{ marginBottom: 10, fontSize: 12 }}
                          />

                          {/* Type-specific content */}
                          {content.content_type === "text" ? (
                            <textarea
                              className="inp"
                              placeholder="Tulis konten teks di sini... (mendukung paragraf)"
                              value={content.content_text || ""}
                              onChange={e => updateContent(sIdx, cIdx, "content_text", e.target.value)}
                              rows={6}
                              style={{ resize: "vertical", minHeight: 120, fontSize: 13, lineHeight: 1.7 }}
                            />
                          ) : content.content_type === "video" ? (
                            <div>
                              {/* Video source toggle */}
                              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                                <button
                                  onClick={() => updateContent(sIdx, cIdx, "_videoMode", "upload")}
                                  style={{
                                    flex: 1, padding: "8px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                                    cursor: "pointer", transition: "all 0.2s",
                                    border: `1.5px solid ${(!content._videoMode || content._videoMode === "upload") ? "var(--primary)" : "var(--border)"}`,
                                    background: (!content._videoMode || content._videoMode === "upload") ? "var(--primary-subtle)" : "white",
                                    color: (!content._videoMode || content._videoMode === "upload") ? "var(--primary)" : "var(--text-2)",
                                  }}
                                >
                                  📁 Upload Video
                                </button>
                                <button
                                  onClick={() => updateContent(sIdx, cIdx, "_videoMode", "url")}
                                  style={{
                                    flex: 1, padding: "8px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                                    cursor: "pointer", transition: "all 0.2s",
                                    border: `1.5px solid ${content._videoMode === "url" ? "var(--primary)" : "var(--border)"}`,
                                    background: content._videoMode === "url" ? "var(--primary-subtle)" : "white",
                                    color: content._videoMode === "url" ? "var(--primary)" : "var(--text-2)",
                                  }}
                                >
                                  🔗 Link URL
                                </button>
                              </div>

                              {content._videoMode === "url" ? (
                                <div>
                                  <input
                                    className="inp"
                                    type="url"
                                    placeholder="Paste URL video (YouTube, Vimeo, atau direct link)"
                                    value={content.content_url || ""}
                                    onChange={e => updateContent(sIdx, cIdx, "content_url", e.target.value)}
                                    style={{ fontSize: 13, marginBottom: 8 }}
                                  />
                                  {content.content_url && (
                                    <div style={{
                                      marginTop: 6, padding: "10px 14px", borderRadius: 10,
                                      background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)",
                                      fontSize: 12, color: "#059669", display: "flex", alignItems: "center", gap: 6,
                                    }}>
                                      <CheckCircle2 size={13} /> URL tersimpan
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <FileUploader
                                  accept={typeInfo.accept}
                                  maxSizeMB={typeInfo.maxMB}
                                  folder={`courses/${courseId}/sections/${section.id}`}
                                  label=""
                                  currentFile={content.content_url}
                                  onUploadComplete={(result) => {
                                    updateContent(sIdx, cIdx, "content_url", result.url);
                                    updateContent(sIdx, cIdx, "file_size", result.size);
                                  }}
                                />
                              )}

                              <input
                                className="inp"
                                type="text"
                                placeholder="Durasi video (contoh: 12:30)"
                                value={content.duration || ""}
                                onChange={e => updateContent(sIdx, cIdx, "duration", e.target.value)}
                                style={{ marginTop: 8, fontSize: 12 }}
                              />

                              {/* Video preview */}
                              {content.content_url && (
                                <div style={{ marginTop: 10 }}>
                                  {content.content_url.includes("youtube.com") || content.content_url.includes("youtu.be") ? (
                                    <iframe
                                      src={content.content_url
                                        .replace("watch?v=", "embed/")
                                        .replace("youtu.be/", "youtube.com/embed/")}
                                      style={{ width: "100%", height: 240, borderRadius: 10, border: "1px solid var(--border)" }}
                                      allowFullScreen
                                    />
                                  ) : (
                                    <video
                                      src={content.content_url}
                                      controls
                                      style={{ maxWidth: "100%", maxHeight: 240, borderRadius: 10, border: "1px solid var(--border)" }}
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <FileUploader
                                accept={typeInfo.accept}
                                maxSizeMB={typeInfo.maxMB}
                                folder={`courses/${courseId}/sections/${section.id}`}
                                label=""
                                currentFile={content.content_url}
                                onUploadComplete={(result) => {
                                  updateContent(sIdx, cIdx, "content_url", result.url);
                                  updateContent(sIdx, cIdx, "file_size", result.size);
                                }}
                              />
                              {/* Preview for uploaded content */}
                              {content.content_url && content.content_type === "image" && (
                                <div style={{ marginTop: 10 }}>
                                  <img
                                    src={content.content_url}
                                    alt={content.title}
                                    style={{
                                      maxWidth: "100%", maxHeight: 200, borderRadius: 10,
                                      border: "1px solid var(--border)", objectFit: "cover",
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add content buttons */}
                {addingContent?.sectionIdx === sIdx ? (
                  <div style={{
                    border: "1.5px dashed var(--primary)", borderRadius: 12, padding: 16,
                    background: "var(--primary-subtle)",
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", marginBottom: 12 }}>
                      Pilih tipe konten:
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                      {CONTENT_TYPES.map(ct => (
                        <button
                          key={ct.value}
                          onClick={() => addContent(sIdx, ct.value)}
                          style={{
                            background: "white", border: `1.5px solid ${ct.color}20`,
                            borderRadius: 10, padding: "14px 10px", cursor: "pointer",
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.borderColor = ct.color;
                            (e.currentTarget as HTMLElement).style.background = ct.bg;
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.borderColor = `${ct.color}20`;
                            (e.currentTarget as HTMLElement).style.background = "white";
                          }}
                        >
                          <ct.icon size={22} color={ct.color} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: ct.color }}>{ct.label}</span>
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setAddingContent(null)} style={{
                      marginTop: 10, background: "transparent", border: "none",
                      fontSize: 12, color: "var(--text-3)", cursor: "pointer",
                    }}>
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingContent({ sectionIdx: sIdx, type: "" })}
                    style={{
                      width: "100%", background: "transparent",
                      border: "1.5px dashed var(--border)", borderRadius: 10,
                      padding: "12px", cursor: "pointer", display: "flex",
                      alignItems: "center", justifyContent: "center", gap: 8,
                      fontSize: 13, fontWeight: 600, color: "var(--text-2)",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)";
                      (e.currentTarget as HTMLElement).style.color = "var(--primary)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                      (e.currentTarget as HTMLElement).style.color = "var(--text-2)";
                    }}
                  >
                    <PlusCircle size={15} /> Tambah Konten
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Section button */}
      <button
        onClick={addSection}
        style={{
          width: "100%", marginTop: 16, background: "white",
          border: "2px dashed var(--border)", borderRadius: 14,
          padding: "18px", cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "center", gap: 10,
          fontSize: 14, fontWeight: 700, color: "var(--text-2)",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          transition: "all 0.2s",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)";
          (e.currentTarget as HTMLElement).style.color = "var(--primary)";
          (e.currentTarget as HTMLElement).style.background = "var(--primary-subtle)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
          (e.currentTarget as HTMLElement).style.color = "var(--text-2)";
          (e.currentTarget as HTMLElement).style.background = "white";
        }}
      >
        <PlusCircle size={18} /> Tambah Section Baru
      </button>
    </div>
  );
}
