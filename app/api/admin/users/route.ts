import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

// Helper to verify admin role
async function verifyAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userData?.role !== "admin") return null;
  return user;
}

// POST — Create new user in public.users
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const admin = await verifyAdmin(supabase);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { full_name, headline, role } = await req.json();

    if (!full_name || !role) {
      return NextResponse.json({ error: "full_name and role are required" }, { status: 400 });
    }

    if (!["student", "teacher", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Create a new entry in public.users with a generated UUID
    // Note: This creates a "managed" user without an auth account
    const { data, error } = await supabase
      .from("users")
      .insert({
        id: crypto.randomUUID(),
        full_name,
        headline: headline || null,
        role,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create user:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ user: data }, { status: 201 });
  } catch (error: any) {
    console.error("Admin create user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT — Update user data
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const admin = await verifyAdmin(supabase);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id, full_name, headline, role } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "User id is required" }, { status: 400 });
    }

    if (role && !["student", "teacher", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (headline !== undefined) updateData.headline = headline;
    if (role !== undefined) updateData.role = role;

    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update user:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ user: data });
  } catch (error: any) {
    console.error("Admin update user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — Delete user from public.users
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const admin = await verifyAdmin(supabase);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json({ error: "User id is required" }, { status: 400 });
    }

    // Prevent deleting self
    if (userId === admin.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    // Delete related data first (cascade should handle most, but be explicit)
    // Delete enrollments
    await supabase.from("user_enrollments").delete().eq("user_id", userId);
    // Delete achievements
    await supabase.from("user_achievements").delete().eq("user_id", userId);
    // Delete submissions
    await supabase.from("student_submissions").delete().eq("student_id", userId);
    // Delete preferences
    await supabase.from("user_preferences").delete().eq("user_id", userId);
    // Delete chat messages
    await supabase.from("ai_chat_messages").delete().eq("user_id", userId);

    // Finally delete the user record
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", userId);

    if (error) {
      console.error("Failed to delete user:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin delete user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
