import { GoogleGenAI } from "@google/genai";

// Server-side only — never import this on the client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite-preview",
  "gemini-2.0-flash",
  "gemini-flash-latest"
];

export const GEMINI_MODEL = FALLBACK_MODELS[0];

export async function generateContentWithFallback(request: any) {
  let lastError: any = null;
  let rateLimitError: any = null;
  for (const model of FALLBACK_MODELS) {
    try {
      console.log(`[AI] Mencoba generate dengan model: ${model}`);
      const updatedRequest = { ...request, model };
      const response = await ai.models.generateContent(updatedRequest);
      return response;
    } catch (error: any) {
      console.warn(`[AI] Model ${model} gagal:`, error?.message || "Unknown error");
      lastError = error;
      if (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("Quota")) {
        rateLimitError = error;
      }
    }
  }
  throw rateLimitError || lastError;
}

export async function generateContentStreamWithFallback(request: any) {
  let lastError: any = null;
  let rateLimitError: any = null;
  for (const model of FALLBACK_MODELS) {
    try {
      console.log(`[AI Stream] Mencoba generate stream dengan model: ${model}`);
      const updatedRequest = { ...request, model };
      const responseStream = await ai.models.generateContentStream(updatedRequest);

      // Test the stream by fetching the first chunk. 
      // This catches 429 (Rate Limit) and 404 (Not Found) errors that might delay throwing.
      const iterator = responseStream[Symbol.asyncIterator]();
      const firstChunk = await iterator.next();

      // If we reach here, the model is valid and not rate-limited.
      async function* wrappedStream() {
        if (!firstChunk.done) {
          yield firstChunk.value;
        }
        yield* iterator;
      }
      return wrappedStream();
    } catch (error: any) {
      console.warn(`[AI Stream] Model ${model} gagal:`, error?.message || "Unknown error");
      lastError = error;
      if (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("Quota")) {
        rateLimitError = error;
      }
    }
  }
  throw rateLimitError || lastError;
}

export const SYSTEM_PROMPT_TUTOR = `Kamu adalah IntelliCourse AI, asisten belajar cerdas di platform e-learning IntelliCourse.

ATURAN:
- Selalu jawab dalam Bahasa Indonesia
- Bersikap ramah, supportive, dan encouraging
- Jika ditanya tentang topik di luar konteks pendidikan/teknologi, arahkan kembali ke topik belajar
- Gunakan emoji secukupnya untuk membuat conversation lebih friendly
- Berikan jawaban yang ringkas tapi informatif (maks 3 paragraf kecuali diminta lebih detail)
- Jika user bertanya tentang kode, berikan contoh kode yang jelas dengan penjelasan
- Jangan pernah membuat informasi palsu — jika tidak tahu, katakan dengan jujur`;

export const SYSTEM_PROMPT_COURSE = (courseTitle: string, courseCategory: string, courseNarrative: string) => `Kamu adalah IntelliCourse AI, asisten belajar untuk course "${courseTitle}" di kategori ${courseCategory}.

KONTEKS COURSE:
${courseNarrative}

ATURAN:
- Selalu jawab dalam Bahasa Indonesia
- Fokuskan jawaban pada topik yang relevan dengan course ini
- Berikan contoh praktis dan analogi yang mudah dipahami
- Jika user bertanya di luar topik course, jawab singkat lalu arahkan kembali
- Gunakan emoji secukupnya
- Berikan jawaban ringkas tapi informatif`;

export const SYSTEM_PROMPT_RECOMMEND = `Kamu adalah mesin rekomendasi AI di platform IntelliCourse. Tugasmu adalah menganalisis preferensi user dan mencocokkan dengan daftar course yang tersedia.

ATURAN:
- Output HARUS berupa JSON array yang valid
- Setiap item berisi: { "course_id": string, "match_score": number (0-100), "reason": string (dalam Bahasa Indonesia, 1-2 kalimat) }
- Urutkan dari match_score tertinggi ke terendah
- match_score harus realistis berdasarkan kecocokan preferensi user dengan course
- Pertimbangkan: spesialisasi user, level pengalaman, tujuan belajar, tools/bahasa yang dikuasai
- Max 6 rekomendasi`;

export { ai };
