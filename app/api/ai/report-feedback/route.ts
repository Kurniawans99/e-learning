import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_PROMPT_REPORT, generateContentStreamWithFallback } from "@/lib/gemini";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify student role
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "student") {
      return NextResponse.json({ error: "Only students can access reports" }, { status: 403 });
    }

    const body = await req.json();
    const { reportData } = body;

    if (!reportData) {
      return NextResponse.json({ error: "Report data is required" }, { status: 400 });
    }

    // Build context for AI
    const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Student";

    // Fetch user preferences for additional context
    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("specializations, experience_level, goals")
      .eq("user_id", user.id)
      .single();

    let contextStr = `\n--- KONTEKS STUDENT ---\nNama: ${userName}\n`;
    if (prefs) {
      contextStr += `Spesialisasi: ${prefs.specializations?.join(", ")}\n`;
      contextStr += `Level: ${prefs.experience_level}\n`;
      contextStr += `Tujuan: ${prefs.goals?.join(", ")}\n`;
    }

    const systemPrompt = SYSTEM_PROMPT_REPORT + contextStr;

    const prompt = `Berikut data hasil assessment saya di platform IntelliCourse:

${reportData}

Tolong analisis performa saya secara keseluruhan dan berikan saran perbaikan yang spesifik dan actionable. Fokus pada area yang perlu saya tingkatkan dan berikan learning path yang jelas.`;

    const contents = [{ role: "user", parts: [{ text: prompt }] }];

    const responseStream = await generateContentStreamWithFallback({
      contents,
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 4096,
        temperature: 0.7,
      },
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (error) {
          console.error("Error streaming AI report feedback:", error);
          controller.enqueue(encoder.encode("\n\n[Pesan terputus akibat gangguan koneksi]"));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (error: any) {
    const isRateLimit = error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("Quota");

    if (isRateLimit) {
      console.warn("AI Report hit rate limit (429).");
      return NextResponse.json(
        { error: "Quota exceeded", reply: "Maaf, batas penggunaan AI saat ini telah habis. Coba beberapa saat lagi ya! ⏳" },
        { status: 429 }
      );
    }

    console.error("AI Report error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada AI", reply: "Maaf, saya sedang mengalami gangguan. Coba lagi nanti ya! 🙏" },
      { status: 500 }
    );
  }
}
