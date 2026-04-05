"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import {
  Settings, Bell, Globe, Shield, Palette,
  Mail, Lock, Eye, EyeOff, Save, CheckCircle2,
  AlertTriangle, Trash2, Moon, Sun, Monitor
} from "lucide-react";

export default function SettingsPage() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Password change
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  // Notification preferences (local state, not persisted for now)
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [courseUpdates, setCourseUpdates] = useState(true);
  const [achievements, setAchievements] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }
    fetchUser();
  }, []);

  const handlePasswordChange = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (newPass !== confirmPass) {
      setErrorMsg("New passwords don't match.");
      return;
    }
    if (newPass.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }

    setChangingPass(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPass,
      });
      if (error) throw error;
      setSuccessMsg("Password updated successfully!");
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error: any) {
      setErrorMsg(error.message || "Failed to update password.");
    } finally {
      setChangingPass(false);
    }
  };

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
        <div style={{ fontSize: 12, color: "var(--primary)", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.06em", marginBottom: 8, textTransform: "uppercase" }}>PREFERENCES</div>
        <h1 style={{ fontSize: "clamp(24px, 3vw, 36px)", marginBottom: 12, color: "var(--text-1)" }}>Settings</h1>
        <p style={{ color: "var(--text-2)", fontSize: 15, lineHeight: 1.6, maxWidth: 500 }}>
          Customize your learning experience and manage your account.
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

      <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 700 }}>

        {/* Notifications */}
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "var(--primary-subtle)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bell size={15} color="var(--primary)" />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>Notifications</h3>
              <p style={{ fontSize: 12, color: "var(--text-3)" }}>Choose what notifications you receive</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {[
              { label: "Email Notifications", desc: "Receive email about your account activity", value: emailNotifs, onChange: setEmailNotifs },
              { label: "Course Updates", desc: "Get notified when enrolled courses have updates", value: courseUpdates, onChange: setCourseUpdates },
              { label: "Achievement Alerts", desc: "Celebrate when you unlock new badges", value: achievements, onChange: setAchievements },
              { label: "Marketing Emails", desc: "Receive promotional offers and news", value: marketing, onChange: setMarketing },
            ].map(toggle => (
              <div key={toggle.label} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 16px", borderRadius: 10, transition: "background 0.15s",
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", marginBottom: 2 }}>{toggle.label}</div>
                  <div style={{ fontSize: 12, color: "var(--text-3)" }}>{toggle.desc}</div>
                </div>
                <button
                  onClick={() => toggle.onChange(!toggle.value)}
                  style={{
                    width: 44, height: 24, borderRadius: 12, border: "none",
                    background: toggle.value ? "var(--primary)" : "var(--border-strong)",
                    position: "relative", cursor: "pointer", transition: "background 0.2s",
                    flexShrink: 0,
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%", background: "white",
                    position: "absolute", top: 3,
                    left: toggle.value ? 23 : 3,
                    transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                  }} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Appearance */}
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "#FFFBEB", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Palette size={15} color="#F59E0B" />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>Appearance</h3>
              <p style={{ fontSize: 12, color: "var(--text-3)" }}>Customize the look and feel</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[
              { icon: Sun, label: "Light", active: true },
              { icon: Moon, label: "Dark", active: false },
              { icon: Monitor, label: "System", active: false },
            ].map(theme => (
              <button key={theme.label} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                padding: "16px 24px", borderRadius: 12,
                background: theme.active ? "var(--primary-subtle)" : "var(--bg-base)",
                border: `1.5px solid ${theme.active ? "rgba(37,99,235,0.3)" : "var(--border)"}`,
                cursor: "pointer", transition: "all 0.15s", minWidth: 90,
              }}>
                <theme.icon size={20} color={theme.active ? "var(--primary)" : "var(--text-3)"} />
                <span style={{ fontSize: 12, fontWeight: 600, color: theme.active ? "var(--primary)" : "var(--text-2)" }}>{theme.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Security — Change Password */}
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "#F0F9FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={15} color="#0EA5E9" />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>Security</h3>
              <p style={{ fontSize: 12, color: "var(--text-3)" }}>Update your password</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-1)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>New Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={15} color="var(--text-3)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input className="inp" style={{ paddingLeft: 42, paddingRight: 42 }}
                  type={showPass ? "text" : "password"} placeholder="••••••••••"
                  value={newPass} onChange={e => setNewPass(e.target.value)} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}>
                  {showPass ? <EyeOff size={15} color="var(--text-3)" /> : <Eye size={15} color="var(--text-3)" />}
                </button>
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-1)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Confirm New Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={15} color="var(--text-3)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input className="inp" style={{ paddingLeft: 42 }}
                  type={showPass ? "text" : "password"} placeholder="••••••••••"
                  value={confirmPass} onChange={e => setConfirmPass(e.target.value)} />
              </div>
            </div>
            <button onClick={handlePasswordChange} disabled={changingPass || !newPass} className="btn-primary" style={{
              justifyContent: "center", width: "fit-content", marginTop: 4,
              opacity: changingPass || !newPass ? 0.6 : 1,
            }}>
              <Save size={14} /> {changingPass ? "Updating..." : "Update Password"}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div style={{
          background: "white", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 16, padding: 24,
          boxShadow: "0 1px 4px rgba(15,23,42,0.05)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(239,68,68,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Trash2 size={15} color="#EF4444" />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#EF4444" }}>Danger Zone</h3>
              <p style={{ fontSize: 12, color: "var(--text-3)" }}>Irreversible actions</p>
            </div>
          </div>
          <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 16, lineHeight: 1.6 }}>
            Once you delete your account, there is no going back. All your data, courses, and achievements will be permanently removed.
          </p>
          <button style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(239,68,68,0.08)", color: "#EF4444",
            border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10,
            padding: "10px 20px", fontSize: 14, fontWeight: 600,
            fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: "not-allowed", opacity: 0.5,
          }} disabled>
            <Trash2 size={14} /> Delete Account
          </button>
        </div>
      </div>
    </>
  );
}
