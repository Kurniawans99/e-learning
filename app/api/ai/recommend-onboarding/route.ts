import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_PROMPT_RECOMMEND, generateContentWithFallback } from "@/lib/gemini";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { specializations, experience_level, goals, known_languages } = body;

    if (!specializations || !experience_level || !goals || !known_languages) {
      return NextResponse.json({ error: "All preference fields are required" }, { status: 400 });
    }

    // Fetch all courses
    const { data: courses } = await supabase
      .from("courses")
      .select("id, slug, title, subtitle, category, level, hours, rating, student_count");

    if (!courses || courses.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    // Build prompt
    const userProfile = `PROFIL USER:
- Spesialisasi: ${specializations.join(", ")}
- Level: ${experience_level}
- Tujuan: ${goals.join(", ")}
- Bahasa/Tools: ${known_languages.join(", ")}`;

    const courseList = courses.map(c =>
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
          maxOutputTokens: 4096,
          temperature: 0.4,
        },
      });

      const text = response.text || "[]";
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      recommendations = JSON.parse(cleaned);
    } catch (innerError: any) {
      const isRateLimit = innerError?.status === 429 || innerError?.message?.includes("429") || innerError?.message?.includes("Quota");
      if (isRateLimit) {
        console.warn("AI Recommend Onboarding hit rate limit, using fallback.");
      } else {
        console.warn("AI Recommend Onboarding error, using fallback.", innerError);
      }

      // Fallback: return top rated courses
      recommendations = courses
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 6)
        .map(c => ({
          course_id: c.id,
          match_score: Math.floor(70 + Math.random() * 20),
          reason: "Kursus populer dengan rating tinggi yang cocok untuk memulai perjalanan belajar Anda!",
        }));
    }

    // Attach course details to recommendations
    const enriched = recommendations.map((r: any) => {
      const course = courses.find(c => c.id === r.course_id);
      return {
        ...r,
        course: course || null,
      };
    }).filter((r: any) => r.course !== null);

    return NextResponse.json({ recommendations: enriched });
  } catch (error: any) {
    console.error("AI Recommend Onboarding error:", error);
    return NextResponse.json({ recommendations: [], error: "Recommendation error" }, { status: 500 });
  }
}
