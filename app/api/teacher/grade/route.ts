import { NextRequest, NextResponse } from "next/server";
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

    const { submissionId, score, feedback } = await req.json();

    if (!submissionId || typeof score !== "number") {
      return NextResponse.json({ error: "Submission ID and score are required" }, { status: 400 });
    }

    // Update the submission
    const { data, error } = await supabase
      .from("student_submissions")
      .update({
        score: score,
        feedback: feedback || null,
        status: "graded",
        graded_by: user.id,
        graded_at: new Date().toISOString()
      })
      .eq("id", submissionId)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, submission: data });

  } catch (error: any) {
    console.error("Teacher grading error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
