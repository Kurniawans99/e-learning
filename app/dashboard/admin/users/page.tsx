"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  Users, Search, Shield, ChevronDown,
  CheckCircle2, AlertTriangle, UserCog, Mail, Calendar
} from "lucide-react";
import type { UserRole } from "@/lib/types";
import { getRoleLabel, getRoleColor } from "@/lib/auth-helpers";

type UserRecord = {
  id: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  email?: string;
};

const ROLE_TABS = [
  { key: "all", label: "All Users" },
  { key: "student", label: "Students" },
  { key: "teacher", label: "Teachers" },
  { key: "admin", label: "Admins" },
];

export default function AdminUsersPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      const { data: me } = await supabase.from("users").select("role").eq("id", user.id).single();
      if (me?.role !== "admin") { router.push("/dashboard"); return; }

      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, role, created_at")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setUsers(data as UserRecord[]);
      }
      setLoading(false);
    }
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingId(userId);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { error } = await supabase
        .from("users")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setSuccessMsg(`User role updated to ${getRoleLabel(newRole)} successfully!`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update user role.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = users.filter(u => {
    const matchesTab = activeTab === "all" || u.role === activeTab;
    const matchesSearch = (u.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) || u.id.includes(searchQuery);
    return matchesTab && matchesSearch;
  });

  const counts = {
    all: users.length,
    student: users.filter(u => u.role === "student").length,
    teacher: users.filter(u => u.role === "teacher").length,
    admin: users.filter(u => u.role === "admin").length,
  };

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Shield size={14} color="#DC2626" />
          <span style={{ fontSize: 12, color: "#DC2626", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>ADMIN</span>
        </div>
        <h1 style={{ fontSize: "clamp(24px, 3vw, 36px)", marginBottom: 12, color: "var(--text-1)" }}>User Management</h1>
        <p style={{ color: "var(--text-2)", fontSize: 15, lineHeight: 1.6, maxWidth: 500 }}>
          View, search, and manage user roles across the platform.
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

      {/* Search + Tabs */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 24, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "white", borderRadius: 10, padding: "8px 14px", border: "1.5px solid var(--border)", flex: "1 1 200px", maxWidth: 320 }}>
          <Search size={14} color="var(--text-3)" />
          <input
            type="text" placeholder="Search users by name..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, color: "var(--text-1)", fontFamily: "'Inter', sans-serif", width: "100%" }}
          />
        </div>
        <div style={{ display: "flex", gap: 4, background: "var(--bg-base)", borderRadius: 12, padding: 4, border: "1.5px solid var(--border)" }}>
          {ROLE_TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              background: activeTab === tab.key ? "white" : "transparent",
              border: activeTab === tab.key ? "1px solid var(--border)" : "1px solid transparent",
              borderRadius: 9, padding: "7px 14px",
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 12,
              cursor: "pointer",
              color: activeTab === tab.key ? "var(--primary)" : "var(--text-2)",
              boxShadow: activeTab === tab.key ? "0 1px 4px rgba(15,23,42,0.06)" : "none",
              transition: "all 0.15s",
            }}>
              {tab.label} {counts[tab.key as keyof typeof counts] > 0 && <span style={{ marginLeft: 4, opacity: 0.7 }}>({counts[tab.key as keyof typeof counts]})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ height: 72, borderRadius: 12, animation: "shimmer 1.5s infinite", backgroundImage: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)", backgroundSize: "200% 100%" }} />
          ))}
        </div>
      )}

      {/* User List */}
      {!loading && (
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
          {/* Table header */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 120px 140px 100px", gap: 16,
            padding: "12px 20px", background: "var(--bg-base)", borderBottom: "1px solid var(--border)",
            fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            <span>User</span>
            <span>Role</span>
            <span>Joined</span>
            <span>Actions</span>
          </div>

          {filtered.length > 0 ? filtered.map((u, i) => {
            const rc = getRoleColor(u.role);
            return (
              <div key={u.id} style={{
                display: "grid", gridTemplateColumns: "1fr 120px 140px 100px", gap: 16,
                padding: "14px 20px", alignItems: "center",
                borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                transition: "background 0.15s",
              }}>
                {/* User info */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: "linear-gradient(135deg, var(--primary-dark), var(--primary-light))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700, color: "white", flexShrink: 0,
                  }}>
                    {(u.full_name || "U").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>{u.full_name || "Unnamed"}</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "'IBM Plex Mono', monospace" }}>{u.id.slice(0, 8)}...</div>
                  </div>
                </div>

                {/* Role badge */}
                <div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: rc.text, background: rc.bg,
                    border: `1px solid ${rc.border}`, padding: "3px 10px", borderRadius: 99,
                    textTransform: "uppercase", fontFamily: "'Plus Jakarta Sans', sans-serif",
                    display: "inline-flex", alignItems: "center", gap: 4,
                  }}>
                    <Shield size={9} />
                    {getRoleLabel(u.role)}
                  </span>
                </div>

                {/* Join date */}
                <div style={{ fontSize: 12, color: "var(--text-2)" }}>
                  {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>

                {/* Change role */}
                <div style={{ position: "relative" }}>
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                    disabled={updatingId === u.id}
                    style={{
                      appearance: "none", background: "var(--bg-base)",
                      border: "1.5px solid var(--border)", borderRadius: 8,
                      padding: "6px 28px 6px 10px", fontSize: 12, fontWeight: 600,
                      color: "var(--text-1)", cursor: "pointer",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      opacity: updatingId === u.id ? 0.5 : 1,
                      width: "100%",
                    }}
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                  <ChevronDown size={12} color="var(--text-3)" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                </div>
              </div>
            );
          }) : (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
              {searchQuery ? "No users match your search." : "No users found."}
            </div>
          )}
        </div>
      )}

      {!loading && (
        <div style={{ marginTop: 16, textAlign: "center", fontSize: 12, color: "var(--text-3)" }}>
          Showing {filtered.length} of {users.length} users
        </div>
      )}
    </>
  );
}
