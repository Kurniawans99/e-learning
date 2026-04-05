"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  User, Mail, Edit3, Save, X, LogOut,
  BookOpen, Trophy, Calendar, Shield, Camera,
  CheckCircle2, AlertTriangle, Briefcase
} from "lucide-react";

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Editable fields
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");

  // Stats
  const [enrollmentCount, setEnrollmentCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [achievementCount, setAchievementCount] = useState(0);

  useEffect(() => {
    async function fetchUserData() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }
      setUser(user);

      // Fetch profile from users table
      const { data: profileData } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setFullName(profileData.full_name || user.user_metadata?.full_name || "");
        setHeadline(profileData.headline || "");
      } else {
        setFullName(user.user_metadata?.full_name || "");
        setHeadline("");
      }

      // Fetch stats
      const { count: eCount } = await supabase
        .from("user_enrollments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setEnrollmentCount(eCount ?? 0);

      const { count: cCount } = await supabase
        .from("user_enrollments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed");
      setCompletedCount(cCount ?? 0);

      const { count: aCount } = await supabase
        .from("user_achievements")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setAchievementCount(aCount ?? 0);

      setLoading(false);
    }
    fetchUserData();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // Upsert into users table
      const { error: profileError } = await supabase
        .from("users")
        .upsert({
          id: user.id,
          full_name: fullName.trim(),
          headline: headline.trim(),
        }, { onConflict: "id" });

      if (profileError) throw profileError;

      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim() },
      });

      if (authError) throw authError;

      setSuccessMsg("Profile updated successfully!");
      setEditing(false);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error: any) {
      setErrorMsg(error.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  };

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "—";

  const displayName = fullName || user?.email?.split("@")[0] || "User";
  const initial = displayName.charAt(0).toUpperCase();

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ height: 120, borderRadius: 14, animation: "shimmer 1.5s infinite", backgroundImage: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)", backgroundSize: "200% 100%" }} />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 12, color: "var(--primary)", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.06em", marginBottom: 8, textTransform: "uppercase" }}>ACCOUNT</div>
        <h1 style={{ fontSize: "clamp(24px, 3vw, 36px)", marginBottom: 12, color: "var(--text-1)" }}>Profile</h1>
        <p style={{ color: "var(--text-2)", fontSize: 15, lineHeight: 1.6, maxWidth: 500 }}>
          Manage your personal information and account settings.
        </p>
      </div>

      {/* Messages */}
      {successMsg && (
        <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10B981", padding: "12px 16px", borderRadius: 10, fontSize: 13, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", padding: "12px 16px", borderRadius: 10, fontSize: 13, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={16} /> {errorMsg}
        </div>
      )}

      <div className="mobile-col-1 mobile-flex-col" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>

        {/* Main profile card */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Avatar + Name */}
          <div style={{
            background: "white", border: "1px solid var(--border)", borderRadius: 16, padding: 28,
            boxShadow: "0 1px 4px rgba(15,23,42,0.05)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24 }}>
              <div style={{ position: "relative" }}>
                <div style={{
                  width: 80, height: 80, borderRadius: 20,
                  background: "linear-gradient(135deg, var(--primary-dark), var(--primary-light))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 32, fontWeight: 800, color: "white",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  boxShadow: "0 8px 24px rgba(37,99,235,0.3)",
                }}>
                  {initial}
                </div>
                <div style={{
                  position: "absolute", bottom: -2, right: -2,
                  width: 24, height: 24, borderRadius: 8,
                  background: "white", border: "1.5px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                }}>
                  <Camera size={12} color="var(--text-2)" />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>{displayName}</h2>
                <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 4 }}>
                  {headline || "No headline set"}
                </p>
                <p style={{ fontSize: 12, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4 }}>
                  <Mail size={11} /> {user?.email}
                </p>
              </div>
              {!editing ? (
                <button onClick={() => setEditing(true)} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "var(--primary-subtle)", color: "var(--primary)",
                  border: "1px solid rgba(37,99,235,0.2)", borderRadius: 10,
                  padding: "8px 16px", fontSize: 13, fontWeight: 600,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  cursor: "pointer", transition: "all 0.15s",
                }}>
                  <Edit3 size={14} /> Edit
                </button>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={handleSave} disabled={saving} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "linear-gradient(135deg, var(--primary-dark), var(--primary))",
                    color: "white", border: "none", borderRadius: 10,
                    padding: "8px 16px", fontSize: 13, fontWeight: 600,
                    cursor: "pointer", opacity: saving ? 0.7 : 1,
                  }}>
                    <Save size={14} /> {saving ? "Saving..." : "Save"}
                  </button>
                  <button onClick={() => { setEditing(false); setFullName(profile?.full_name || user?.user_metadata?.full_name || ""); setHeadline(profile?.headline || ""); }} style={{
                    display: "flex", alignItems: "center", gap: 4,
                    background: "white", color: "var(--text-2)",
                    border: "1.5px solid var(--border)", borderRadius: 10,
                    padding: "8px 12px", fontSize: 13, cursor: "pointer",
                  }}>
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Editable form */}
            {editing && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, borderTop: "1px solid var(--border)", paddingTop: 20 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-1)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Full Name
                  </label>
                  <div style={{ position: "relative" }}>
                    <User size={15} color="var(--text-3)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                    <input className="inp" style={{ paddingLeft: 42 }} type="text" placeholder="Your full name"
                      value={fullName} onChange={e => setFullName(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-1)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Headline
                  </label>
                  <div style={{ position: "relative" }}>
                    <Briefcase size={15} color="var(--text-3)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                    <input className="inp" style={{ paddingLeft: 42 }} type="text" placeholder="e.g. ML Engineer @ Google"
                      value={headline} onChange={e => setHeadline(e.target.value)} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Account details card */}
          <div style={{
            background: "white", border: "1px solid var(--border)", borderRadius: 16, padding: 24,
            boxShadow: "0 1px 4px rgba(15,23,42,0.05)",
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "var(--text-1)" }}>Account Details</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { icon: Mail, label: "Email", value: user?.email || "—" },
                { icon: Calendar, label: "Member Since", value: memberSince },
                { icon: Shield, label: "Account Type", value: "Free Plan" },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "var(--bg-base)", borderRadius: 10, border: "1px solid var(--border)" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--primary-subtle)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <item.icon size={14} color="var(--primary)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontSize: 14, color: "var(--text-1)", fontWeight: 500 }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Logout */}
          <div style={{
            background: "white", border: "1px solid var(--border)", borderRadius: 16, padding: 24,
            boxShadow: "0 1px 4px rgba(15,23,42,0.05)",
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: "var(--text-1)" }}>Session</h3>
            <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 16 }}>
              Sign out of your account on this device.
            </p>
            <button onClick={handleLogout} disabled={loggingOut} style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(239,68,68,0.08)", color: "#EF4444",
              border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10,
              padding: "10px 20px", fontSize: 14, fontWeight: 600,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              cursor: "pointer", transition: "all 0.15s",
              opacity: loggingOut ? 0.7 : 1,
            }}>
              <LogOut size={16} />
              {loggingOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </div>

        {/* Stats sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>Statistics</h3>
          {[
            { icon: BookOpen, label: "Courses Enrolled", value: enrollmentCount, color: "var(--primary)", bg: "var(--primary-subtle)" },
            { icon: CheckCircle2, label: "Completed", value: completedCount, color: "#10B981", bg: "#ECFDF5" },
            { icon: Trophy, label: "Badges Earned", value: achievementCount, color: "#F59E0B", bg: "#FFFBEB" },
          ].map(stat => (
            <div key={stat.label} style={{
              background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: 20,
              boxShadow: "0 1px 4px rgba(15,23,42,0.05)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <stat.icon size={18} color={stat.color} />
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 500 }}>{stat.label}</div>
                </div>
              </div>
            </div>
          ))}

          {/* Activity */}
          <div style={{
            background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: 20,
            boxShadow: "0 1px 4px rgba(15,23,42,0.05)",
          }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: "var(--text-1)" }}>Recent Activity</h4>
            <div style={{ textAlign: "center", padding: 20, color: "var(--text-3)", fontSize: 13, border: "1px dashed var(--border)", borderRadius: 10 }}>
              No recent activity to show.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
