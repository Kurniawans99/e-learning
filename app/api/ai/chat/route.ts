import { NextRequest, NextResponse } from "next/server";
import { ai, GEMINI_MODEL, SYSTEM_PROMPT_TUTOR, SYSTEM_PROMPT_COURSE, generateContentStreamWithFallback } from "@/lib/gemini";
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

    // Fetch user preferences to give AI memory of the user
    if (!isOnboarding) {
      const { data: prefs } = await supabase.from("user_preferences").select("*").eq("user_id", user.id).single();
      const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
      
      let contextStr = `\n\n--- KONTEKS USER SAAT INI ---\nNama: ${userName}\n`;
      if (prefs) {
        contextStr += `Spesialisasi diminati: ${prefs.specializations?.join(", ")}\n`;
        contextStr += `Level pengalaman: ${prefs.experience_level}\n`;
        contextStr += `Tujuan belajar: ${prefs.goals?.join(", ")}\n`;
        contextStr += `Bahasa/tools dikuasai: ${prefs.known_languages?.join(", ")}\n`;
      } else {
        contextStr += `(Data preferensi belum diisi)\n`;
      }
      contextStr += `Gunakan informasi ini untuk memberikan panduan yang sangat personal dan relevan untuk user. Anda harus mengingat ini di setiap percakapan.`;
      
      systemPrompt += contextStr;
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

    // Call Gemini with Fallback (STREAM)
    const responseStream = await generateContentStreamWithFallback({
      contents,
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 4096, // Ditingkatkan agar jawaban AI tidak terpotong (sebelumnya 1024)
        temperature: 0.7,
      },
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullReply = "";
        try {
          for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
              fullReply += text;
              controller.enqueue(encoder.encode(text));
            }
          }
          // Save messages to database (skip for onboarding to keep it lightweight)
          if (!isOnboarding && fullReply) {
            await supabase.from("ai_chat_messages").insert([
              { user_id: user.id, course_id: courseId || null, role: "user", content: message },
              { user_id: user.id, course_id: courseId || null, role: "assistant", content: fullReply },
            ]);
          }
        } catch (error) {
          console.error("Gagal membaca chunk stream AI:", error);
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

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json([], { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    const query = supabase
      .from("ai_chat_messages")
      .select("id, role, content, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }); // Order ascending for UI display

    if (courseId) {
      query.eq("course_id", courseId);
    } else {
      query.is("course_id", null);
    }

    // Limit to last 50 messages to prevent heavy payloads
    const { data: history } = await query.limit(50);
    
    return NextResponse.json(history || []);
  } catch (error) {
    console.error("Failed to fetch chat history:", error);
    return NextResponse.json([], { status: 500 });
  }
}
