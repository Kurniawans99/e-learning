"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  Users, Search, Shield, ChevronDown, Plus, Pencil, Trash2,
  CheckCircle2, AlertTriangle, UserCog, Mail, Calendar,
  X, User, Loader2, BookOpen, Award
} from "lucide-react";
import type { UserRole } from "@/lib/types";
import { getRoleLabel, getRoleColor } from "@/lib/auth-helpers";

type UserRecord = {
  id: string;
  full_name: string | null;
  headline: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
};

const ROLE_TABS = [
  { key: "all", label: "All Users" },
  { key: "student", label: "Students" },
  { key: "teacher", label: "Teachers" },
  { key: "admin", label: "Admins" },
];

type ModalMode = "create" | "edit" | null;

export default function AdminUsersPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Modal state
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [formName, setFormName] = useState("");
  const [formHeadline, setFormHeadline] = useState("");
  const [formRole, setFormRole] = useState<UserRole>("student");

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Detail view
  const [detailUser, setDetailUser] = useState<UserRecord | null>(null);
  const [detailStats, setDetailStats] = useState<{ enrollments: number; achievements: number } | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      const { data: me } = await supabase.from("users").select("role").eq("id", user.id).single();
      if (me?.role !== "admin") { router.push("/dashboard"); return; }

      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, headline, avatar_url, role, created_at")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setUsers(data as UserRecord[]);
      }
      setLoading(false);
    }
    fetchUsers();
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 5000);
  };

  // CREATE
  const openCreateModal = () => {
    setFormName("");
    setFormHeadline("");
    setFormRole("student");
    setEditUser(null);
    setModalMode("create");
  };

  // EDIT
  const openEditModal = (user: UserRecord) => {
    setFormName(user.full_name || "");
    setFormHeadline(user.headline || "");
    setFormRole(user.role);
    setEditUser(user);
    setModalMode("edit");
  };

  // Save (create or edit)
  const handleSave = async () => {
    if (!formName.trim()) {
      showError("Nama lengkap harus diisi.");
      return;
    }

    setModalLoading(true);
    try {
      if (modalMode === "create") {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ full_name: formName.trim(), headline: formHeadline.trim() || null, role: formRole }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create user");

        setUsers(prev => [data.user, ...prev]);
        showSuccess(`User "${formName}" berhasil dibuat sebagai ${getRoleLabel(formRole)}!`);
      } else if (modalMode === "edit" && editUser) {
        const res = await fetch("/api/admin/users", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editUser.id, full_name: formName.trim(), headline: formHeadline.trim() || null, role: formRole }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update user");

        setUsers(prev => prev.map(u => u.id === editUser.id ? data.user : u));
        showSuccess(`User "${formName}" berhasil diperbarui!`);
      }
      setModalMode(null);
    } catch (err: any) {
      showError(err.message || "Terjadi kesalahan.");
    } finally {
      setModalLoading(false);
    }
  };

  // DELETE
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/users?id=${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");

      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
      showSuccess(`User "${deleteTarget.full_name || "Unnamed"}" berhasil dihapus.`);
      setDeleteTarget(null);
    } catch (err: any) {
      showError(err.message || "Gagal menghapus user.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Detail
  const openDetail = async (user: UserRecord) => {
    setDetailUser(user);
    setDetailStats(null);

    // Fetch stats
    const { count: enrollments } = await supabase
      .from("user_enrollments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    const { count: achievements } = await supabase
      .from("user_achievements")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    setDetailStats({ enrollments: enrollments ?? 0, achievements: achievements ?? 0 });
  };

  // Role change inline
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      showSuccess(`Role berhasil diubah ke ${getRoleLabel(newRole)}.`);
    } catch (err: any) {
      showError(err.message || "Gagal mengubah role.");
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: "clamp(24px, 3vw, 36px)", marginBottom: 8, color: "var(--text-1)" }}>User Management</h1>
            <p style={{ color: "var(--text-2)", fontSize: 15, lineHeight: 1.6, maxWidth: 500 }}>
              Kelola semua akun pengguna platform IntelliCourse.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="btn-primary"
            style={{ fontSize: 14, padding: "12px 24px" }}
          >
            <Plus size={16} /> Tambah User
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="mobile-col-2" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Total Users", value: counts.all, color: "#2563EB", bg: "#EFF6FF", icon: Users },
          { label: "Students", value: counts.student, color: "#0EA5E9", bg: "#F0F9FF", icon: User },
          { label: "Teachers", value: counts.teacher, color: "#059669", bg: "#ECFDF5", icon: BookOpen },
          { label: "Admins", value: counts.admin, color: "#DC2626", bg: "#FEF2F2", icon: Shield },
        ].map(stat => (
          <div key={stat.label} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px", boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}>{stat.label}</span>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <stat.icon size={14} color={stat.color} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", color: stat.color }}>{stat.value}</div>
          </div>
        ))}
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
            type="text" placeholder="Cari user berdasarkan nama..."
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
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ height: 72, borderRadius: 12, animation: "shimmer 1.5s infinite", backgroundImage: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)", backgroundSize: "200% 100%" }} />
          ))}
        </div>
      )}

      {/* User List */}
      {!loading && (
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
          {/* Table header */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 120px 140px 160px", gap: 16,
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
                display: "grid", gridTemplateColumns: "1fr 120px 140px 160px", gap: 16,
                padding: "14px 20px", alignItems: "center",
                borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                transition: "background 0.15s",
              }}>
                {/* User info */}
                <button
                  onClick={() => openDetail(u)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0,
                  }}
                >
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
                </button>

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
                  {new Date(u.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {/* Role dropdown */}
                  <div style={{ position: "relative", flex: 1 }}>
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                      style={{
                        appearance: "none", background: "var(--bg-base)",
                        border: "1.5px solid var(--border)", borderRadius: 8,
                        padding: "5px 24px 5px 8px", fontSize: 11, fontWeight: 600,
                        color: "var(--text-1)", cursor: "pointer",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        width: "100%",
                      }}
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                    <ChevronDown size={10} color="var(--text-3)" style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  </div>

                  {/* Edit button */}
                  <button
                    onClick={() => openEditModal(u)}
                    style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: "#EFF6FF", border: "1px solid rgba(37,99,235,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", flexShrink: 0,
                    }}
                    title="Edit user"
                  >
                    <Pencil size={13} color="#2563EB" />
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={() => setDeleteTarget(u)}
                    style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", flexShrink: 0,
                    }}
                    title="Delete user"
                  >
                    <Trash2 size={13} color="#EF4444" />
                  </button>
                </div>
              </div>
            );
          }) : (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
              {searchQuery ? "Tidak ada user yang cocok." : "Tidak ada user ditemukan."}
            </div>
          )}
        </div>
      )}

      {!loading && (
        <div style={{ marginTop: 16, textAlign: "center", fontSize: 12, color: "var(--text-3)" }}>
          Menampilkan {filtered.length} dari {users.length} user
        </div>
      )}

      {/* ── CREATE / EDIT MODAL ── */}
      {modalMode && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}
            onClick={() => setModalMode(null)}
          />
          <div style={{
            position: "relative", width: "100%", maxWidth: 480,
            background: "white", borderRadius: 20, padding: 32,
            boxShadow: "0 20px 60px rgba(15,23,42,0.2)",
            animation: "slide-up 0.3s ease-out",
          }}>
            <button
              onClick={() => setModalMode(null)}
              style={{ position: "absolute", top: 16, right: 16, background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <X size={16} color="var(--text-2)" />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: modalMode === "create" ? "#EFF6FF" : "#FFFBEB",
                border: `1px solid ${modalMode === "create" ? "rgba(37,99,235,0.2)" : "rgba(245,158,11,0.2)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {modalMode === "create" ? <Plus size={20} color="#2563EB" /> : <Pencil size={20} color="#F59E0B" />}
              </div>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-1)", marginBottom: 2 }}>
                  {modalMode === "create" ? "Tambah User Baru" : "Edit User"}
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-3)" }}>
                  {modalMode === "create" ? "Buat akun user baru di platform." : `Edit data ${editUser?.full_name || "user"}.`}
                </p>
              </div>
            </div>

            {/* Form */}
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", display: "block", marginBottom: 6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Nama Lengkap *</label>
                <input
                  type="text" value={formName} onChange={e => setFormName(e.target.value)}
                  placeholder="Masukkan nama lengkap..."
                  className="inp"
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", display: "block", marginBottom: 6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Headline (opsional)</label>
                <input
                  type="text" value={formHeadline} onChange={e => setFormHeadline(e.target.value)}
                  placeholder="Misal: Mahasiswa Informatika"
                  className="inp"
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", display: "block", marginBottom: 6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Role *</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["student", "teacher", "admin"] as UserRole[]).map(role => {
                    const rc = getRoleColor(role);
                    const isSelected = formRole === role;
                    return (
                      <button
                        key={role}
                        onClick={() => setFormRole(role)}
                        style={{
                          flex: 1, padding: "12px", borderRadius: 10, cursor: "pointer",
                          background: isSelected ? rc.bg : "var(--bg-base)",
                          border: `2px solid ${isSelected ? rc.text : "var(--border)"}`,
                          color: isSelected ? rc.text : "var(--text-2)",
                          fontWeight: 700, fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif",
                          transition: "all 0.15s",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        }}
                      >
                        <Shield size={12} />
                        {getRoleLabel(role)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
              <button
                onClick={() => setModalMode(null)}
                className="btn-secondary"
                style={{ flex: 1, justifyContent: "center" }}
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={modalLoading || !formName.trim()}
                className="btn-primary"
                style={{ flex: 1, justifyContent: "center", opacity: modalLoading || !formName.trim() ? 0.5 : 1 }}
              >
                {modalLoading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : null}
                {modalMode === "create" ? "Buat User" : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM MODAL ── */}
      {deleteTarget && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}
            onClick={() => setDeleteTarget(null)}
          />
          <div style={{
            position: "relative", width: "100%", maxWidth: 420,
            background: "white", borderRadius: 20, padding: 32,
            boxShadow: "0 20px 60px rgba(15,23,42,0.2)",
            animation: "slide-up 0.3s ease-out", textAlign: "center",
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, margin: "0 auto 20px",
              background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Trash2 size={24} color="#EF4444" />
            </div>

            <h3 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-1)", marginBottom: 8 }}>Hapus User?</h3>
            <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 8, lineHeight: 1.6 }}>
              Anda yakin ingin menghapus <strong>{deleteTarget.full_name || "Unnamed"}</strong>?
            </p>
            <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 24, lineHeight: 1.5 }}>
              Semua data terkait (enrollment, achievement, submission) juga akan dihapus. Aksi ini tidak bisa dibatalkan.
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setDeleteTarget(null)}
                className="btn-secondary"
                style={{ flex: 1, justifyContent: "center" }}
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                style={{
                  flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                  background: "#EF4444", color: "white", border: "none",
                  borderRadius: 10, padding: "10px 22px",
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 14,
                  cursor: deleteLoading ? "not-allowed" : "pointer",
                  opacity: deleteLoading ? 0.6 : 1,
                  boxShadow: "0 4px 14px rgba(239,68,68,0.3)",
                  transition: "all 0.2s",
                }}
              >
                {deleteLoading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={16} />}
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── USER DETAIL DRAWER ── */}
      {detailUser && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          zIndex: 1000, display: "flex", justifyContent: "flex-end",
        }}>
          <div
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(15,23,42,0.3)", backdropFilter: "blur(4px)" }}
            onClick={() => setDetailUser(null)}
          />
          <div style={{
            position: "relative", width: "100%", maxWidth: 400, height: "100%",
            background: "white", boxShadow: "-8px 0 32px rgba(15,23,42,0.15)",
            animation: "slideIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards",
            display: "flex", flexDirection: "column",
          }}>
            <style>{`@keyframes slideIn { from{transform:translateX(100%)} to{transform:translateX(0)} }`}</style>

            {/* Header */}
            <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-1)" }}>Detail User</h3>
              <button onClick={() => setDetailUser(null)} style={{ background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <X size={16} color="var(--text-2)" />
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: "auto", padding: "28px" }}>
              {/* Avatar & Name */}
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 20, margin: "0 auto 16px",
                  background: "linear-gradient(135deg, var(--primary-dark), var(--primary-light))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 28, fontWeight: 800, color: "white",
                  boxShadow: "0 8px 24px rgba(37,99,235,0.3)",
                }}>
                  {(detailUser.full_name || "U").charAt(0).toUpperCase()}
                </div>
                <h4 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-1)", marginBottom: 4 }}>{detailUser.full_name || "Unnamed"}</h4>
                {detailUser.headline && (
                  <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 8 }}>{detailUser.headline}</p>
                )}
                <span style={{
                  fontSize: 11, fontWeight: 700, color: getRoleColor(detailUser.role).text,
                  background: getRoleColor(detailUser.role).bg, border: `1px solid ${getRoleColor(detailUser.role).border}`,
                  padding: "4px 14px", borderRadius: 99, display: "inline-flex", alignItems: "center", gap: 5,
                  fontFamily: "'Plus Jakarta Sans', sans-serif", textTransform: "uppercase",
                }}>
                  <Shield size={10} /> {getRoleLabel(detailUser.role)}
                </span>
              </div>

              {/* Info rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "var(--bg-base)", borderRadius: 10, border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Calendar size={14} color="var(--text-3)" />
                    <span style={{ fontSize: 13, color: "var(--text-3)" }}>Bergabung</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>
                    {new Date(detailUser.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "var(--bg-base)", borderRadius: 10, border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <BookOpen size={14} color="var(--text-3)" />
                    <span style={{ fontSize: 13, color: "var(--text-3)" }}>Enrollments</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>
                    {detailStats ? detailStats.enrollments : "..."}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "var(--bg-base)", borderRadius: 10, border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Award size={14} color="var(--text-3)" />
                    <span style={{ fontSize: 13, color: "var(--text-3)" }}>Achievements</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>
                    {detailStats ? detailStats.achievements : "..."}
                  </span>
                </div>
              </div>

              {/* User ID */}
              <div style={{ padding: "12px 16px", background: "var(--bg-base)", borderRadius: 10, border: "1px solid var(--border)" }}>
                <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, display: "block", marginBottom: 4 }}>USER ID</span>
                <span style={{ fontSize: 12, color: "var(--text-1)", fontFamily: "'IBM Plex Mono', monospace", wordBreak: "break-all" }}>{detailUser.id}</span>
              </div>
            </div>

            {/* Footer actions */}
            <div style={{ padding: "16px 28px", borderTop: "1px solid var(--border)", display: "flex", gap: 10 }}>
              <button
                onClick={() => { setDetailUser(null); openEditModal(detailUser); }}
                className="btn-secondary"
                style={{ flex: 1, justifyContent: "center" }}
              >
                <Pencil size={14} /> Edit
              </button>
              <button
                onClick={() => { setDetailUser(null); setDeleteTarget(detailUser); }}
                style={{
                  flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                  background: "#FEF2F2", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: 10, padding: "10px 22px",
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 14,
                  cursor: "pointer", transition: "all 0.2s",
                }}
              >
                <Trash2 size={14} /> Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </>
  );
}
