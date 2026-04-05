"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Search, Bell, ChevronDown, Zap, Menu, X, LayoutDashboard } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function Navbar({ variant = "default" }: { variant?: "default" | "dashboard" }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [userInitial, setUserInitial] = useState<string>("");

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setIsAuth(true);
        const name = session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User";
        setUserName(name.split(" ")[0]);
        setUserInitial(name.charAt(0).toUpperCase());
      } else {
        setIsAuth(false);
      }
    };
    checkAuth();
  }, []);

  return (
    <>
      <nav className="mobile-px" style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(255, 255, 255, 0.92)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
        padding: "0 32px",
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 1px 8px rgba(15, 23, 42, 0.06)",
      }}>
        {/* Logo */}
        <Link href={isAuth ? "/dashboard" : "/"} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: "linear-gradient(135deg, var(--primary-dark), var(--primary-light))",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
          }}>
            <Zap size={16} color="white" fill="white" />
          </div>
          <span style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 800,
            fontSize: 17,
            color: "var(--text-1)",
            letterSpacing: "-0.03em",
          }}>
            Intelli<span style={{ color: "var(--primary)" }}>Course</span>
          </span>
        </Link>

        {/* Center nav - Desktop only */}
        <div className="mobile-hide" style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {["Explore", "Paths", "Community", "Pricing"].map((item) => (
            <Link key={item} href="#" style={{
              color: "var(--text-2)",
              textDecoration: "none",
              padding: "6px 14px",
              borderRadius: 8,
              fontSize: 14,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 500,
              transition: "all 0.15s",
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

        {/* Right side - Desktop only */}
        <div className="mobile-hide" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {variant === "dashboard" ? (
            <>
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
              <Link href="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: "linear-gradient(135deg, var(--primary-dark), var(--primary-light))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700,
                  fontSize: 13, color: "white",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
                }}>{userInitial || "A"}</div>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 13, color: "var(--text-1)" }}>{userName || "Alex"}</span>
                <ChevronDown size={12} color="var(--text-3)" />
              </Link>
            </>
          ) : isAuth ? (
            <>
              <Link href="/dashboard" className="btn-primary" style={{ fontSize: 14, padding: "8px 18px", display: "flex", alignItems: "center", gap: 6 }}>
                <LayoutDashboard size={16} /> Go to Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth" style={{
                color: "var(--text-2)", textDecoration: "none",
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 14,
                padding: "8px 16px", borderRadius: 9,
                transition: "color 0.15s",
              }}>Sign In</Link>
              <Link href="/auth" className="btn-primary" style={{ fontSize: 14, padding: "8px 18px" }}>
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Icon (shown only via CSS display override) */}
        <button 
          className="mobile-show" 
          onClick={() => setMobileOpen(true)}
          style={{
            display: "none", /* Hidden on desktop by default */
            alignItems: "center", justifyContent: "center",
            background: "transparent", border: "none", cursor: "pointer", padding: "8px"
          }}
        >
          <Menu size={24} color="var(--text-1)" />
        </button>
      </nav>

      {/* Slide-out Drawer for Mobile */}
      {mobileOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 999,
          display: "flex"
        }}>
          {/* Backdrop */}
          <div 
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(15,23,42,0.4)", backdropFilter: "blur(4px)" }}
            onClick={() => setMobileOpen(false)}
          />
          
          {/* Drawer Content */}
          <div style={{
            position: "relative", width: "80%", maxWidth: 320, height: "100%", background: "white",
            boxShadow: "4px 0 24px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column",
            animation: "slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards"
          }}>
            <style>{`
              @keyframes slideIn {
                from { transform: translateX(-100%); }
                to { transform: translateX(0); }
              }
            `}</style>
            
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

            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", marginBottom: 4 }}>NAVIGATION</div>
              {["Explore", "Paths", "Community", "Pricing"].map((item) => (
                <Link key={item} href="#" onClick={() => setMobileOpen(false)} style={{
                  textDecoration: "none", color: "var(--text-1)", fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 12
                }}>
                  {item}
                </Link>
              ))}

              <div style={{ height: 1, background: "var(--border)", margin: "16px 0" }} />

              {variant === "dashboard" || isAuth ? (
                <Link href="/dashboard" onClick={() => setMobileOpen(false)} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12, padding: "12px", background: "var(--bg-base)", borderRadius: 12, border: "1px solid var(--border)" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, var(--primary-dark), var(--primary-light))", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700 }}>{userInitial || "A"}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-1)" }}>{userName || "Alex"}</div>
                    <div style={{ fontSize: 12, color: "var(--text-3)" }}>View Profile</div>
                  </div>
                </Link>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <Link href="/auth" onClick={() => setMobileOpen(false)} style={{ padding: "12px", textAlign: "center", borderRadius: 10, border: "1.5px solid var(--border)", color: "var(--text-1)", fontWeight: 600, textDecoration: "none", fontSize: 15 }}>Log In</Link>
                  <Link href="/auth" onClick={() => setMobileOpen(false)} style={{ padding: "12px", textAlign: "center", borderRadius: 10, background: "var(--primary)", color: "white", fontWeight: 700, textDecoration: "none", fontSize: 15 }}>Get Started Free</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
