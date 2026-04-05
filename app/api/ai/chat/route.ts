import { NextRequest, NextResponse } from "next/server";
import { ai, GEMINI_MODEL, SYSTEM_PROMPT_TUTOR, SYSTEM_PROMPT_COURSE } from "@/lib/gemini";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { message, courseId, courseTitle, courseCategory, courseNarrative, isOnboarding } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Build system prompt
    let systemPrompt = SYSTEM_PROMPT_TUTOR;
    if (courseTitle && courseCategory && courseNarrative) {
      systemPrompt = SYSTEM_PROMPT_COURSE(courseTitle, courseCategory, courseNarrative);
    }

    // Fetch recent chat history for context (last 10 messages)
    let historyMessages: { role: string; content: string }[] = [];
    if (!isOnboarding) {
      const query = supabase
        .from("ai_chat_messages")
        .select("role, content")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (courseId) {
        query.eq("course_id", courseId);
      } else {
        query.is("course_id", null);
      }

      const { data: history } = await query;
      if (history) {
        historyMessages = history.reverse();
      }
    }

    // Build conversation contents for Gemini
    const contents: { role: string; parts: { text: string }[] }[] = [];

    // Add history
    for (const msg of historyMessages) {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }

    // Add current message
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    // Call Gemini
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 1024,
        temperature: 0.7,
      },
    });

    const reply = response.text || "Maaf, saya tidak bisa menjawab saat ini. Coba lagi nanti ya!";

    // Save messages to database (skip for onboarding to keep it lightweight)
    if (!isOnboarding) {
      await supabase.from("ai_chat_messages").insert([
        { user_id: user.id, course_id: courseId || null, role: "user", content: message },
        { user_id: user.id, course_id: courseId || null, role: "assistant", content: reply },
      ]);
    }

    return NextResponse.json({ reply });
  } catch (error: any) {
    const isRateLimit = error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("Quota exceeded") || error?.status === "RESOURCE_EXHAUSTED";
    
    if (isRateLimit) {
      console.warn("AI Chat hit rate limit (429): Quota exceeded.");
      return NextResponse.json(
        { error: "Quota exceeded", reply: "Maaf, batas penggunaan AI saat ini telah habis karena terlalu banyak antrean. Coba beberapa saat lagi ya! ⏳" },
        { status: 429 }
      );
    }

    console.error("AI Chat error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada AI", reply: "Maaf, saya sedang mengalami gangguan. Coba lagi nanti ya! 🙏" },
      { status: 500 }
    );
  }
}
