"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import type { Course, CurriculumSection, SectionContent, Assessment } from "@/lib/types";
import {
  ArrowLeft, Play, ChevronDown, ChevronRight, Video, Image,
  FileText, File, Clock, CheckCircle2, Lock, BookOpen,
  ClipboardList, ArrowRight
} from "lucide-react";

const CONTENT_ICONS: Record<string, any> = { video: Video, image: Image, text: FileText, document: File };

export default function LearnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createClient();
  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<CurriculumSection[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [activeContentIdx, setActiveContentIdx] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: courseData } = await supabase
        .from("courses")
        .select(`*, instructor:instructors(*), sections:curriculum_sections(*, contents:section_contents(*))`)
        .eq("slug", id)
        .single();

      if (courseData) {
        courseData.sections?.sort((a: any, b: any) => a.order - b.order);
        courseData.sections?.forEach((s: any) => s.contents?.sort((a: any, b: any) => a.order - b.order));
        setCourse(courseData as any);
        setSections(courseData.sections || []);
      }

      const { data: assessData } = await supabase
        .from("assessments")
        .select("*")
        .eq("course_id", courseData?.id || "")
        .eq("is_published", true)
        .order("order");
      setAssessments(assessData || []);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--text-2)", fontWeight: 600 }}>Loading course...</p>
      </div>
    );
  }
  if (!course) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
        <Navbar />
        <div style={{ padding: "100px 32px", textAlign: "center" }}>
          <h1 style={{ fontSize: 32, marginBottom: 16 }}>Course Tidak Ditemukan</h1>
          <Link href="/" style={{ color: "var(--primary)", fontWeight: 600 }}>Kembali</Link>
        </div>
      </div>
    );
  }

  const currentSection = sections[activeSectionIdx];
  const currentContent = currentSection?.contents?.[activeContentIdx];

  const goNext = () => {
    if (!currentSection?.contents) return;
    if (activeContentIdx < currentSection.contents.length - 1) {
      setActiveContentIdx(activeContentIdx + 1);
    } else if (activeSectionIdx < sections.length - 1) {
      setActiveSectionIdx(activeSectionIdx + 1);
      setActiveContentIdx(0);
    }
  };

  const goPrev = () => {
    if (activeContentIdx > 0) {
      setActiveContentIdx(activeContentIdx - 1);
    } else if (activeSectionIdx > 0) {
      setActiveSectionIdx(activeSectionIdx - 1);
      const prevSection = sections[activeSectionIdx - 1];
      setActiveContentIdx((prevSection?.contents?.length || 1) - 1);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      {/* Top bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)",
        padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href={`/courses/${id}`} style={{ color: "var(--text-3)", display: "flex" }}><ArrowLeft size={18} /></Link>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{course.title}</div>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>{course.category} • {course.level}</div>
          </div>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
          background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: 8,
          padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "var(--text-2)",
        }}>
          {sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: sidebarOpen ? "1fr 320px" : "1fr", minHeight: "calc(100vh - 56px)" }}>
        {/* Main content */}
        <div style={{ padding: "32px", overflowY: "auto" }}>
          {currentContent ? (
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
              {/* Video player */}
              {currentContent.content_type === "video" && currentContent.content_url && (
                <div style={{ marginBottom: 24 }}>
                  {currentContent.content_url.includes("youtube.com") || currentContent.content_url.includes("youtu.be") ? (
                    <iframe
                      src={currentContent.content_url
                        .replace("watch?v=", "embed/")
                        .replace("youtu.be/", "youtube.com/embed/")}
                      style={{
                        width: "100%", height: 450, borderRadius: 16, border: "none",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                      }}
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  ) : (
                    <video src={currentContent.content_url} controls style={{
                      width: "100%", borderRadius: 16, background: "#000",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                    }} />
                  )}
                </div>
              )}
              {/* Image */}
              {currentContent.content_type === "image" && currentContent.content_url && (
                <div style={{ marginBottom: 24 }}>
                  <img src={currentContent.content_url} alt={currentContent.title} style={{
                    width: "100%", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  }} />
                </div>
              )}
              {/* Document */}
              {currentContent.content_type === "document" && currentContent.content_url && (
                <div style={{ marginBottom: 24, background: "white", border: "1px solid var(--border)", borderRadius: 16, padding: 24, textAlign: "center" }}>
                  <File size={40} color="var(--primary)" style={{ marginBottom: 12 }} />
                  <a href={currentContent.content_url} target="_blank" rel="noreferrer" className="btn-primary" style={{ textDecoration: "none" }}>
                    Download Document
                  </a>
                </div>
              )}
              {/* Title & Description */}
              <h2 style={{ fontSize: 24, marginBottom: 8 }}>{currentContent.title}</h2>
              {currentContent.description && (
                <p style={{ color: "var(--text-2)", fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>{currentContent.description}</p>
              )}
              {currentContent.duration && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-3)", marginBottom: 20 }}>
                  <Clock size={12} /> {currentContent.duration}
                </div>
              )}
              {/* Text content */}
              {currentContent.content_type === "text" && currentContent.content_text && (
                <div style={{
                  background: "white", border: "1px solid var(--border)", borderRadius: 16,
                  padding: 28, lineHeight: 1.8, fontSize: 15, color: "var(--text-2)",
                }}>
                  {currentContent.content_text.split("\n\n").map((p, i) => (
                    <p key={i} style={{ marginBottom: 16 }}>{p}</p>
                  ))}
                </div>
              )}

              {/* Navigation */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
                <button onClick={goPrev} disabled={activeSectionIdx === 0 && activeContentIdx === 0}
                  className="btn-secondary" style={{ opacity: activeSectionIdx === 0 && activeContentIdx === 0 ? 0.4 : 1 }}>
                  <ArrowLeft size={14} /> Sebelumnya
                </button>
                <button onClick={goNext} className="btn-primary">
                  Selanjutnya <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "80px 32px" }}>
              <BookOpen size={48} color="var(--text-3)" style={{ marginBottom: 16 }} />
              <h2 style={{ fontSize: 22, marginBottom: 8 }}>Belum Ada Konten</h2>
              <p style={{ color: "var(--text-3)", fontSize: 14 }}>Section ini belum memiliki konten.</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <aside style={{
            background: "white", borderLeft: "1px solid var(--border)",
            overflowY: "auto", height: "calc(100vh - 56px)", position: "sticky", top: 56,
          }}>
            <div style={{ padding: "20px 16px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Course Content
              </div>
              {sections.map((section, sIdx) => {
                // Find assessments linked to this section
                const sectionAssessments = assessments.filter(a => a.section_id === section.id);
                return (
                  <div key={section.id} style={{ marginBottom: 8 }}>
                    <button onClick={() => { setActiveSectionIdx(sIdx); setActiveContentIdx(0); }} style={{
                      width: "100%", background: activeSectionIdx === sIdx ? "var(--primary-subtle)" : "transparent",
                      border: `1px solid ${activeSectionIdx === sIdx ? "rgba(37,99,235,0.15)" : "transparent"}`,
                      borderRadius: 10, padding: "10px 12px", cursor: "pointer", textAlign: "left",
                      display: "flex", alignItems: "center", gap: 10,
                    }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: 6, fontSize: 10, fontWeight: 700,
                        background: activeSectionIdx === sIdx ? "var(--primary)" : "var(--bg-base)",
                        color: activeSectionIdx === sIdx ? "white" : "var(--text-3)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>{sIdx + 1}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: activeSectionIdx === sIdx ? "var(--primary)" : "var(--text-1)" }}>
                          {section.title}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-3)" }}>{section.contents?.length || 0} konten</div>
                      </div>
                    </button>
                    {/* Content items */}
                    {activeSectionIdx === sIdx && section.contents && (
                      <div style={{ paddingLeft: 20, marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                        {section.contents.map((c, cIdx) => {
                          const CIcon = CONTENT_ICONS[c.content_type] || File;
                          const isActive = activeContentIdx === cIdx;
                          return (
                            <button key={c.id} onClick={() => setActiveContentIdx(cIdx)} style={{
                              width: "100%", background: isActive ? "rgba(37,99,235,0.08)" : "transparent",
                              border: "none", borderRadius: 8, padding: "8px 10px", cursor: "pointer",
                              textAlign: "left", display: "flex", alignItems: "center", gap: 8,
                            }}>
                              <CIcon size={13} color={isActive ? "var(--primary)" : "var(--text-3)"} />
                              <span style={{
                                fontSize: 12, color: isActive ? "var(--primary)" : "var(--text-2)",
                                fontWeight: isActive ? 600 : 400,
                                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                              }}>{c.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {/* Section-linked assessments */}
                    {sectionAssessments.length > 0 && (
                      <div style={{ paddingLeft: 20, marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                        {sectionAssessments.map(a => (
                          <Link key={a.id} href={`/courses/${id}/assessment/${a.id}`} style={{
                            display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
                            borderRadius: 8, textDecoration: "none",
                            background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.1)",
                          }}>
                            <ClipboardList size={13} color="#F59E0B" />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.title}</div>
                              <div style={{ fontSize: 10, color: "#F59E0B" }}>📝 {a.assessment_type === "quiz" ? "Quiz" : a.assessment_type === "essay" ? "Essay" : a.assessment_type}</div>
                            </div>
                            <ArrowRight size={12} color="var(--text-3)" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Unlinked assessments at the end */}
              {assessments.filter(a => !a.section_id).length > 0 && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-3)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    📋 Final Assessments
                  </div>
                  {assessments.filter(a => !a.section_id).map(a => (
                    <Link key={a.id} href={`/courses/${id}/assessment/${a.id}`} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                      borderRadius: 10, textDecoration: "none", marginBottom: 4,
                      background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.12)",
                    }}>
                      <ClipboardList size={14} color="#F59E0B" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{a.title}</div>
                        <div style={{ fontSize: 11, color: "var(--text-3)" }}>{a.assessment_type}</div>
                      </div>
                      <ArrowRight size={12} color="var(--text-3)" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
