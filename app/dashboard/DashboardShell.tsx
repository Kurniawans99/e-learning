"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BookOpen, Trophy, Sparkles, Settings,
  Zap, Search, Bell, ChevronDown, User, Menu, X
} from "lucide-react";
import { useState } from "react";

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: BookOpen, label: "My Courses", href: "/dashboard/my-courses" },
  { icon: Trophy, label: "Achievements", href: "/dashboard/achievements" },
  { icon: Sparkles, label: "Recommendations", href: "/dashboard/recommendations", badge: 3 },
  { icon: User, label: "Profile", href: "/dashboard/profile" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

interface DashboardShellProps {
  userName: string;
  userEmail: string;
  userInitial: string;
  children: React.ReactNode;
}

export default function DashboardShell({ userName, userEmail, userInitial, children }: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const firstName = userName.split(" ")[0];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      {/* ── NAVBAR ── */}
      <nav className="mobile-px" style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)", padding: "0 32px",
        height: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 1px 8px rgba(15,23,42,0.06)",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: "linear-gradient(135deg, var(--primary-dark), var(--primary-light))",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
          }}>
            <Zap size={16} color="white" fill="white" />
          </div>
          <span style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800,
            fontSize: 17, color: "var(--text-1)", letterSpacing: "-0.03em",
          }}>
            Intelli<span style={{ color: "var(--primary)" }}>Course</span>
          </span>
        </Link>

        {/* Center nav - Desktop only */}
        <div className="mobile-hide" style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {["Explore", "Paths", "Community", "Pricing"].map((item) => (
            <Link key={item} href="#" style={{
              color: "var(--text-2)", textDecoration: "none", padding: "6px 14px",
              borderRadius: 8, fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 500, transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              (e.target as HTMLElement).style.color = "var(--primary)";
              (e.target as HTMLElement).style.background = "var(--primary-subtle)";
            }}
            onMouseLeave={e => {
              (e.target as HTMLElement).style.color = "var(--text-2)";
              (e.target as HTMLElement).style.background = "transparent";
            }}>
              {item}
            </Link>
          ))}
        </div>

        {/* Right side - Desktop */}
        <div className="mobile-hide" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "var(--bg-base)", borderRadius: 10, padding: "8px 14px",
            border: "1.5px solid var(--border)",
          }}>
            <Search size={14} color="var(--text-3)" />
            <span style={{ fontSize: 13, color: "var(--text-3)", fontFamily: "'Inter', sans-serif" }}>Search courses...</span>
          </div>
          <button style={{
            position: "relative", background: "var(--bg-base)",
            border: "1.5px solid var(--border)", borderRadius: 10,
            width: 38, height: 38, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Bell size={15} color="var(--text-2)" />
            <span style={{
              position: "absolute", top: 8, right: 8,
              width: 6, height: 6, borderRadius: "50%",
              background: "var(--rose)", border: "1.5px solid white",
            }} />
          </button>
          <Link href="/dashboard/profile" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: "linear-gradient(135deg, var(--primary-dark), var(--primary-light))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700,
              fontSize: 13, color: "white",
              boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
            }}>{userInitial}</div>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 13, color: "var(--text-1)" }}>{firstName}</span>
            <ChevronDown size={12} color="var(--text-3)" />
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="mobile-show"
          onClick={() => setMobileOpen(true)}
          style={{
            display: "none", alignItems: "center", justifyContent: "center",
            background: "transparent", border: "none", cursor: "pointer", padding: 8,
          }}
        >
          <Menu size={24} color="var(--text-1)" />
        </button>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 999, display: "flex" }}>
          <div
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)" }}
            onClick={() => setMobileOpen(false)}
          />
          <div style={{
            position: "relative", width: "80%", maxWidth: 320, height: "100%", background: "white",
            boxShadow: "4px 0 24px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column",
            animation: "slideIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards",
          }}>
            <style>{`@keyframes slideIn { from{transform:translateX(-100%)} to{transform:translateX(0)} }`}</style>

            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, var(--primary-dark), var(--primary-light))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Zap size={14} color="white" fill="white" />
                </div>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 16 }}>IntelliCourse</span>
              </div>
              <button onClick={() => setMobileOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}>
                <X size={20} color="var(--text-2)" />
              </button>
            </div>

            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 4, overflowY: "auto", flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", marginBottom: 8 }}>MENU</div>
              {SIDEBAR_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.label} href={item.href} onClick={() => setMobileOpen(false)} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10,
                    textDecoration: "none", background: isActive ? "var(--primary-subtle)" : "transparent",
                    border: `1px solid ${isActive ? "rgba(37,99,235,0.2)" : "transparent"}`,
                    color: isActive ? "var(--primary)" : "var(--text-2)",
                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: isActive ? 700 : 500, fontSize: 14,
                  }}>
                    <item.icon size={16} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span style={{ background: "var(--primary)", color: "white", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}

              <div style={{ height: 1, background: "var(--border)", margin: "16px 0" }} />
              <Link href="/dashboard/profile" onClick={() => setMobileOpen(false)} style={{
                textDecoration: "none", display: "flex", alignItems: "center", gap: 12,
                padding: 12, background: "var(--bg-base)", borderRadius: 12, border: "1px solid var(--border)",
              }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, var(--primary-dark), var(--primary-light))", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 13 }}>{userInitial}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-1)" }}>{firstName}</div>
                  <div style={{ fontSize: 12, color: "var(--text-3)" }}>View Profile</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── BODY: SIDEBAR + MAIN ── */}
      <div className="mobile-col-1 mobile-auto-h" style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: "calc(100vh - 64px)" }}>

        {/* ── SIDEBAR (desktop) ── */}
        <aside className="mobile-hide" style={{
          background: "white", borderRight: "1px solid var(--border)", padding: "24px 16px",
          display: "flex", flexDirection: "column", position: "sticky", top: 64,
          height: "calc(100vh - 64px)", overflowY: "auto", boxShadow: "2px 0 12px rgba(15,23,42,0.04)",
        }}>
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.label} href={item.href} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10,
                textDecoration: "none", marginBottom: 4,
                background: isActive ? "var(--primary-subtle)" : "transparent",
                border: `1px solid ${isActive ? "rgba(37,99,235,0.2)" : "transparent"}`,
                color: isActive ? "var(--primary)" : "var(--text-2)",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: isActive ? 700 : 500, fontSize: 14, transition: "all 0.15s",
              }} className="sidebar-link">
                <item.icon size={16} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span style={{ background: "var(--primary)", color: "white", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div style={{ marginTop: "auto" }}>
            <div style={{ background: "var(--primary-subtle)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, var(--primary-dark), var(--primary-light))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Zap size={13} color="white" fill="white" />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--primary)" }}>AI Concierge</div>
                  <div style={{ fontSize: 10, color: "var(--emerald)" }}>● Active</div>
                </div>
              </div>
              <p style={{ fontSize: 11, color: "var(--text-2)", lineHeight: 1.5 }}>Your learning path is being dynamically updated based on recent activity.</p>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="mobile-px mobile-py" style={{ padding: 32, overflowY: "auto", background: "var(--bg-base)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
