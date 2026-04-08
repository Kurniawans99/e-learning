import { NextRequest, NextResponse } from "next/server";
import { ai, GEMINI_MODEL, SYSTEM_PROMPT_RECOMMEND, generateContentWithFallback } from "@/lib/gemini";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user preferences
    const { data: preferences } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Fetch all courses
    const { data: courses } = await supabase
      .from("courses")
      .select("id, slug, title, subtitle, category, level, hours, rating, student_count");

    // Fetch enrolled courses to exclude
    const { data: enrollments } = await supabase
      .from("user_enrollments")
      .select("course_id")
      .eq("user_id", user.id);

    const enrolledIds = new Set(enrollments?.map(e => e.course_id) ?? []);
    const availableCourses = courses?.filter(c => !enrolledIds.has(c.id)) ?? [];

    if (!availableCourses.length) {
      return NextResponse.json({ recommendations: [] });
    }

    // If user has no preferences yet, return courses sorted by rating
    if (!preferences) {
      const fallback = availableCourses
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 6)
        .map(c => ({
          course_id: c.id,
          match_score: Math.floor(70 + Math.random() * 20),
          reason: "Kursus populer dengan rating tinggi. Cocok untuk memulai perjalanan belajar Anda!",
        }));
      return NextResponse.json({ recommendations: fallback });
    }

    // Build prompt for Gemini
    const userProfile = `PROFIL USER:
- Spesialisasi: ${preferences.specializations.join(", ")}
- Level: ${preferences.experience_level}
- Tujuan: ${preferences.goals.join(", ")}
- Bahasa/Tools: ${preferences.known_languages.join(", ")}`;

    const courseList = availableCourses.map(c =>
      `{ "id": "${c.id}", "title": "${c.title}", "category": "${c.category}", "level": "${c.level}", "hours": ${c.hours}, "rating": ${c.rating} }`
    ).join(",\n");

    const prompt = `${userProfile}

DAFTAR COURSE TERSEDIA:
[${courseList}]

Analisis profil user dan berikan rekomendasi course yang paling cocok. Output JSON array saja, tanpa markdown code block.`;

    let recommendations = [];
    try {
      const response = await generateContentWithFallback({
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_PROMPT_RECOMMEND,
          maxOutputTokens: 4096, // Ditingkatkan agar jawaban AI tidak terpotong
          temperature: 0.4,
        },
      });

      // Try to parse JSON from response
      const text = response.text || "[]";
      // Remove potential markdown code blocks
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      recommendations = JSON.parse(cleaned);
    } catch (innerError: any) {
      const isRateLimit = innerError?.status === 429 || innerError?.message?.includes("429") || innerError?.message?.includes("Quota exceeded") || innerError?.status === "RESOURCE_EXHAUSTED";
      if (isRateLimit) {
        console.warn("AI Recommend hit rate limit (429), using fallback.");
      } else {
        console.warn("AI Recommend parsing or generation error, using fallback.", innerError);
      }

      // Fallback: return rated courses
      recommendations = availableCourses
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 6)
        .map(c => ({
          course_id: c.id,
          match_score: Math.floor(70 + Math.random() * 20),
          reason: "Kursus ini memiliki rating tinggi dan relevan dengan profil Anda.",
        }));
    }

    return NextResponse.json({ recommendations });
  } catch (error: any) {
    console.error("AI Recommend outer error:", error);
    return NextResponse.json({ recommendations: [], error: "General recommendation error" }, { status: 500 });
  }
}
