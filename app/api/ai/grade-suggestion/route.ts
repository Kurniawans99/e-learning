import { NextRequest, NextResponse } from "next/server";
import { generateContentWithFallback, SYSTEM_PROMPT_GRADING } from "@/lib/gemini";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Verify teacher/admin role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userData?.role !== "teacher" && userData?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { assessmentTitle, questions, answers } = await req.json();

    if (!questions || !answers) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Format the payload for the prompt
    let studentDataStr = `Assessment: ${assessmentTitle}\n\n`;
    questions.forEach((q: any, i: number) => {
      const answer = answers.find((a: any) => a.question_id === q.id);
      studentDataStr += `Pertanyaan ${i + 1}: ${q.question_text}\n`;
      if (q.question_type === "essay" || q.question_type === "interview") {
        studentDataStr += `Jawaban Siswa: ${answer?.answer_text || "(Tidak dijawab)"}\n\n`;
      } else if (q.question_type === "file_upload") {
        studentDataStr += `Jawaban Siswa (File Upload): [URL File: ${answer?.file_url || "Tidak ada file"}]\n\n`;
      } else {
        studentDataStr += `Jawaban Siswa: ${answer?.answer_text || "(Multiple choice/Lainnya)"}\n\n`;
      }
    });

    const prompt = `
Berikut adalah jawaban asesmen dari siswa yang perlu dinilai. Berikan saran skor (0-100) dan feedback.
Penting: Format balasan HANYA boleh berupa JSON valid tanpa blok markdown.

Data Asesmen:
${studentDataStr}
`;

    // Call Gemini
    const result = await generateContentWithFallback({
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT_GRADING,
        temperature: 0.2,
      }
    });

    const responseText = result.text || "{}";
    const cleanedText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    try {
      const parsed = JSON.parse(cleanedText);
      return NextResponse.json(parsed);
    } catch (parseError) {
      console.error("Failed to parse Gemini JSON output:", responseText);
      return NextResponse.json({ error: "Gagal memproses respons AI." }, { status: 500 });
    }

  } catch (error: any) {
    console.error("AI Grading Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
