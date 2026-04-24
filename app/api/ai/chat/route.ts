import { NextRequest, NextResponse } from "next/server";
import { ai, GEMINI_MODEL, SYSTEM_PROMPT_TUTOR, SYSTEM_PROMPT_COURSE, SYSTEM_PROMPT_TEACHER, SYSTEM_PROMPT_ADMIN, generateContentStreamWithFallback } from "@/lib/gemini";
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

    // Fetch user role
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const userRole = userData?.role || "student";

    // Build system prompt based on role
    let systemPrompt: string;

    if (courseTitle && courseCategory && courseNarrative) {
      // Course-specific context (any role can browse courses)
      systemPrompt = SYSTEM_PROMPT_COURSE(courseTitle, courseCategory, courseNarrative);
    } else if (userRole === "teacher") {
      systemPrompt = SYSTEM_PROMPT_TEACHER;
    } else if (userRole === "admin") {
      systemPrompt = SYSTEM_PROMPT_ADMIN;
    } else {
      systemPrompt = SYSTEM_PROMPT_TUTOR;
    }

    // Fetch contextual data based on role
    const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
    let contextStr = `\n\n--- KONTEKS USER SAAT INI ---\nNama: ${userName}\nRole: ${userRole}\n`;

    if (!isOnboarding) {
      if (userRole === "student") {
        // Student context: preferences, enrollments
        const { data: prefs } = await supabase.from("user_preferences").select("*").eq("user_id", user.id).single();

        if (prefs) {
          contextStr += `Spesialisasi diminati: ${prefs.specializations?.join(", ")}\n`;
          contextStr += `Level pengalaman: ${prefs.experience_level}\n`;
          contextStr += `Tujuan belajar: ${prefs.goals?.join(", ")}\n`;
          contextStr += `Bahasa/tools dikuasai: ${prefs.known_languages?.join(", ")}\n`;
        } else {
          contextStr += `(Data preferensi belum diisi)\n`;
        }

        // Enrolled courses
        const { data: enrollments } = await supabase
          .from("user_enrollments")
          .select("progress, status, courses(title)")
          .eq("user_id", user.id)
          .limit(5);

        if (enrollments && enrollments.length > 0) {
          contextStr += `\nKursus yang sedang diikuti:\n`;
          enrollments.forEach((e: any) => {
            contextStr += `- ${e.courses?.title || "Unknown"} (progress: ${e.progress}%, status: ${e.status})\n`;
          });
        }

        contextStr += `\nGunakan informasi ini untuk memberikan panduan yang sangat personal dan relevan.`;

      } else if (userRole === "teacher") {
        // Teacher context: their courses, student count, ratings
        const { data: instructor } = await supabase
          .from("instructors")
          .select("id, name")
          .eq("user_id", user.id)
          .single();

        if (instructor) {
          const { data: courses } = await supabase
            .from("courses")
            .select("title, category, level, student_count, rating, hours, module_count")
            .eq("instructor_id", instructor.id);

          if (courses && courses.length > 0) {
            contextStr += `\nKursus yang diajar (${courses.length} total):\n`;
            let totalStudents = 0;
            let totalRating = 0;
            courses.forEach((c: any) => {
              contextStr += `- "${c.title}" | Kategori: ${c.category} | Level: ${c.level} | ${c.student_count} siswa | Rating: ${c.rating || 0} | ${c.hours}jam, ${c.module_count} modul\n`;
              totalStudents += c.student_count || 0;
              totalRating += c.rating || 0;
            });
            const avgRating = courses.length > 0 ? (totalRating / courses.length).toFixed(1) : "N/A";
            contextStr += `\nRingkasan: ${totalStudents} total siswa, rating rata-rata ${avgRating}\n`;
          } else {
            contextStr += `Teacher ini belum memiliki kursus yang dipublikasikan.\n`;
          }
        }

        // Recent enrollments in their courses
        if (instructor) {
          const { data: recentEnrollments } = await supabase
            .from("user_enrollments")
            .select("progress, status, enrolled_at, courses!inner(title, instructor_id)")
            .eq("courses.instructor_id", instructor.id)
            .order("enrolled_at", { ascending: false })
            .limit(5);

          if (recentEnrollments && recentEnrollments.length > 0) {
            contextStr += `\nEnrollment terbaru di kursus teacher:\n`;
            recentEnrollments.forEach((e: any) => {
              contextStr += `- ${e.courses?.title}: progress ${e.progress}%, status ${e.status}\n`;
            });
          }
        }

        contextStr += `\nGunakan informasi ini untuk membantu teacher membuat konten yang lebih baik dan mengelola kursus secara efektif.`;

      } else if (userRole === "admin") {
        // Admin context: platform-wide stats
        const { count: totalUsers } = await supabase.from("users").select("*", { count: "exact", head: true });
        const { count: totalCourses } = await supabase.from("courses").select("*", { count: "exact", head: true });
        const { count: totalEnrollments } = await supabase.from("user_enrollments").select("*", { count: "exact", head: true });
        const { count: completedEnrollments } = await supabase.from("user_enrollments").select("*", { count: "exact", head: true }).eq("status", "completed");
        const { count: activeEnrollments } = await supabase.from("user_enrollments").select("*", { count: "exact", head: true }).eq("status", "active");

        // User breakdown
        const { data: allUsers } = await supabase.from("users").select("role");
        const studentCount = (allUsers || []).filter(u => u.role === "student").length;
        const teacherCount = (allUsers || []).filter(u => u.role === "teacher").length;
        const adminCount = (allUsers || []).filter(u => u.role === "admin").length;

        contextStr += `\n--- DATA PLATFORM TERKINI ---\n`;
        contextStr += `Total pengguna: ${totalUsers ?? 0} (${studentCount} siswa, ${teacherCount} guru, ${adminCount} admin)\n`;
        contextStr += `Total kursus: ${totalCourses ?? 0}\n`;
        contextStr += `Total enrollment: ${totalEnrollments ?? 0} (${activeEnrollments ?? 0} aktif, ${completedEnrollments ?? 0} selesai)\n`;
        const completionRate = (totalEnrollments ?? 0) > 0 ? Math.round(((completedEnrollments ?? 0) / (totalEnrollments ?? 1)) * 100) : 0;
        contextStr += `Tingkat penyelesaian: ${completionRate}%\n`;

        // Top courses
        const { data: topCourses } = await supabase
          .from("courses")
          .select("title, category, student_count, rating")
          .order("student_count", { ascending: false })
          .limit(5);

        if (topCourses && topCourses.length > 0) {
          contextStr += `\nTop 5 kursus (berdasarkan jumlah siswa):\n`;
          topCourses.forEach((c: any, i: number) => {
            contextStr += `${i + 1}. "${c.title}" — ${c.student_count} siswa, rating ${c.rating || 0} (${c.category})\n`;
          });
        }

        // Category breakdown
        const { data: courseData } = await supabase.from("courses").select("category");
        if (courseData) {
          const categories: Record<string, number> = {};
          courseData.forEach(c => { categories[c.category] = (categories[c.category] || 0) + 1; });
          contextStr += `\nDistribusi kursus per kategori:\n`;
          Object.entries(categories).forEach(([cat, count]) => {
            contextStr += `- ${cat}: ${count} kursus\n`;
          });
        }

        // Recent users
        const { data: recentUsers } = await supabase
          .from("users")
          .select("full_name, role, created_at")
          .order("created_at", { ascending: false })
          .limit(5);

        if (recentUsers && recentUsers.length > 0) {
          contextStr += `\nPengguna terbaru:\n`;
          recentUsers.forEach(u => {
            contextStr += `- ${u.full_name || "Unnamed"} (${u.role}) — bergabung ${new Date(u.created_at).toLocaleDateString("id-ID")}\n`;
          });
        }

        contextStr += `\nGunakan semua data ini untuk memberikan analisis dan insight yang actionable kepada admin.`;
      }

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
        maxOutputTokens: 4096,
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
          // Save messages to database
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
      .order("created_at", { ascending: true });

    if (courseId) {
      query.eq("course_id", courseId);
    } else {
      query.is("course_id", null);
    }

    const { data: history } = await query.limit(50);
    
    return NextResponse.json(history || []);
  } catch (error) {
    console.error("Failed to fetch chat history:", error);
    return NextResponse.json([], { status: 500 });
  }
}
