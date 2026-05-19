"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  Search, Star, Users, Clock, BarChart2,
  BookOpen, Filter, X, Sparkles, ChevronRight
} from "lucide-react";

const CATEGORIES = ["All", "AI & ML", "Engineering", "Design", "Web3", "Data Science", "Mobile Dev"];
const LEVELS = ["All", "Beginner", "Intermediate", "Advanced"];

function categoryColor(category: string): string {
  const map: Record<string, string> = {
    "AI & ML": "#2563EB",
    "Engineering": "#0EA5E9",
    "Design": "#F59E0B",
    "Web3": "#10B981",
    "Data Science": "#EC4899",
    "Mobile Dev": "#8B5CF6",
  };
  return map[category] ?? "#2563EB";
}

export default function ExplorCoursesPage() {
  const supabase = createClient();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");

  useEffect(() => {
    async function fetchCourses() {
      setLoading(true);
      const { data } = await supabase
        .from("courses")
        .select("id, slug, title, subtitle, category, level, price, original_price, rating, review_count, student_count, hours, module_count, instructor:instructors(name)")
        .order("student_count", { ascending: false });
      setCourses(data || []);
      setLoading(false);
    }
    fetchCourses();
  }, []);

  const filtered = courses.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || c.category === selectedCategory;
    const matchesLevel = selectedLevel === "All" || c.level === selectedLevel;
    return matchesSearch && matchesCategory && matchesLevel;
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <Navbar />

      {/* Hero header */}
      <div className="hero-section" style={{ padding: "60px 32px 50px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          <div style={{ marginBottom: 16 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 99, padding: "5px 14px", fontSize: 12, fontWeight: 600,
              color: "white", backdropFilter: "blur(8px)",
            }}>
              <Sparkles size={11} /> Explore Our Catalog
            </span>
          </div>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, color: "white", marginBottom: 14 }}>
            Discover Courses
          </h1>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 16, maxWidth: 500, margin: "0 auto 32px", lineHeight: 1.6 }}>
            Temukan course yang sesuai dengan kebutuhanmu. Belajar dari instruktur terbaik.
          </p>

          {/* Search bar */}
          <div style={{
            maxWidth: 560, margin: "0 auto",
            display: "flex", alignItems: "center", gap: 10,
            background: "white", borderRadius: 14, padding: "10px 18px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          }}>
            <Search size={18} color="var(--text-3)" />
            <input
              type="text"
              placeholder="Cari course berdasarkan judul, kategori..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                border: "none", outline: "none", background: "transparent",
                fontSize: 15, color: "var(--text-1)", fontFamily: "'Inter', sans-serif",
                width: "100%", padding: "4px 0",
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} style={{
                background: "transparent", border: "none", cursor: "pointer",
                padding: 4, display: "flex",
              }}>
                <X size={16} color="var(--text-3)" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 32px 80px" }}>
        {/* Filters */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 32, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 8 }}>
            <Filter size={14} color="var(--text-3)" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>Filter:</span>
          </div>

          {/* Category filters */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  background: selectedCategory === cat ? "var(--primary)" : "white",
                  color: selectedCategory === cat ? "white" : "var(--text-2)",
                  border: `1.5px solid ${selectedCategory === cat ? "var(--primary)" : "var(--border)"}`,
                  borderRadius: 99, padding: "6px 14px", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
                  transition: "all 0.2s",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ width: 1, height: 24, background: "var(--border)", margin: "0 4px" }} />

          {/* Level filters */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {LEVELS.map(lvl => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                style={{
                  background: selectedLevel === lvl ? "var(--primary)" : "white",
                  color: selectedLevel === lvl ? "white" : "var(--text-2)",
                  border: `1.5px solid ${selectedLevel === lvl ? "var(--primary)" : "var(--border)"}`,
                  borderRadius: 99, padding: "6px 14px", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
                  transition: "all 0.2s",
                }}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div style={{ marginBottom: 20, fontSize: 13, color: "var(--text-3)", fontWeight: 500 }}>
          {loading ? "Loading..." : `${filtered.length} course${filtered.length !== 1 ? "s" : ""} ditemukan`}
        </div>

        {/* Course grid */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{
                height: 300, borderRadius: 16,
                animation: "shimmer 1.5s infinite",
                backgroundImage: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
                backgroundSize: "200% 100%",
              }} />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="mobile-col-1 mobile-flex-col mobile-auto-h" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {filtered.map(course => {
              const color = categoryColor(course.category);
              const instructorName = course.instructor?.name || "Instructor";
              return (
                <Link key={course.id} href={`/courses/${course.slug}`} style={{ textDecoration: "none" }}>
                  <div className="glass card-hover" style={{ overflow: "hidden", height: "100%" }}>
                    {/* Thumbnail */}
                    <div style={{
                      height: 140, background: `${color}08`,
                      display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
                      borderBottom: `2px solid ${color}15`,
                    }}>
                      <span style={{
                        fontSize: 42, fontWeight: 800, color, opacity: 0.15,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}>
                        {course.title.slice(0, 2).toUpperCase()}
                      </span>
                      <div style={{
                        position: "absolute", top: 12, right: 12,
                        background: "white", borderRadius: 8, padding: "4px 10px",
                        fontSize: 11, fontWeight: 700, color, border: `1px solid ${color}30`,
                      }}>
                        {course.level}
                      </div>
                    </div>

                    <div style={{ padding: "18px 20px 20px" }}>
                      <div style={{ marginBottom: 6 }}>
                        <span style={{
                          fontSize: 11, color, fontWeight: 700,
                          textTransform: "uppercase", letterSpacing: "0.05em",
                        }}>
                          {course.category}
                        </span>
                      </div>
                      <h3 style={{
                        fontSize: 16, fontWeight: 700, marginBottom: 6,
                        lineHeight: 1.3, color: "var(--text-1)",
                      }}>
                        {course.title}
                      </h3>
                      <p style={{
                        fontSize: 12, color: "var(--text-3)", marginBottom: 12,
                        lineHeight: 1.5, display: "-webkit-box",
                        WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                      }}>
                        {course.subtitle}
                      </p>

                      <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 12 }}>
                        oleh <span style={{ fontWeight: 600, color: "var(--text-2)" }}>{instructorName}</span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Star size={12} fill="#F59E0B" color="#F59E0B" />
                          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>
                            {(course.rating || 0).toFixed(1)}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-3)", fontSize: 12 }}>
                          <Users size={11} /> {course.student_count || 0}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-3)", fontSize: 12 }}>
                          <Clock size={11} /> {course.hours}h
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                          <span style={{
                            fontSize: 20, fontWeight: 800,
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            color: "var(--text-1)",
                          }}>
                            ${course.price}
                          </span>
                          {course.original_price > course.price && (
                            <span style={{
                              fontSize: 13, color: "var(--text-3)",
                              textDecoration: "line-through",
                            }}>
                              ${course.original_price}
                            </span>
                          )}
                        </div>
                        <span style={{
                          background: `${color}12`, color, border: `1px solid ${color}25`,
                          borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600,
                        }}>
                          Lihat Detail
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div style={{
            textAlign: "center", padding: "80px 32px",
            background: "white", border: "1px dashed var(--border)", borderRadius: 16,
          }}>
            <BookOpen size={48} color="var(--text-3)" style={{ marginBottom: 16, opacity: 0.4 }} />
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "var(--text-1)" }}>
              Tidak ada course ditemukan
            </h3>
            <p style={{ color: "var(--text-3)", fontSize: 14, marginBottom: 20 }}>
              Coba ubah filter atau kata kunci pencarian.
            </p>
            <button
              onClick={() => { setSearchQuery(""); setSelectedCategory("All"); setSelectedLevel("All"); }}
              style={{
                background: "var(--primary)", color: "white", border: "none",
                borderRadius: 10, padding: "10px 24px", fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
