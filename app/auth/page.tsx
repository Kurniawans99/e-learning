"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  Zap, Eye, EyeOff, Mail, Lock, User,
  Globe, GitBranch, Sparkles, Check, TrendingUp, Users, BookOpen
} from "lucide-react";

const INSIGHTS = [
  { icon: TrendingUp, stat: "98%", label: "Retention Rate" },
  { icon: Users, stat: "500K+", label: "Active Learners" },
  { icon: BookOpen, stat: "12K+", label: "Curated Paths" },
];

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (tab === "register") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              full_name: name.trim(),
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        
        if (data?.session) {
           router.refresh();
           router.push("/dashboard");
        } else {
           setErrorMsg("Success! Please sign in to continue.");
           setTab("login");
           setPassword("");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });
        if (error) throw error;
        router.refresh(); // Refresh to catch new cookies in middleware
        router.push("/dashboard");
      }
    } catch (error: any) {
      setErrorMsg(error.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      setErrorMsg(error.message || "An error occurred with Google Auth.");
      setLoading(false);
    }
  };

  return (
    <div className="mobile-col-1 mobile-flex-col" style={{
      minHeight: "100vh",
      background: "var(--bg-base)",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
    }}>

      {/* ── LEFT PANEL — Form ── */}
      <div className="mobile-px mobile-py mobile-auto-h" style={{
        display: "flex", flexDirection: "column", padding: "48px 64px",
        background: "white", borderRight: "1px solid var(--border)",
        position: "relative", boxShadow: "4px 0 24px rgba(15,23,42,0.04)",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 64 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "linear-gradient(135deg, var(--primary-dark), var(--primary-light))",
            display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
          }}>
            <Zap size={16} color="white" fill="white" />
          </div>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 18, color: "var(--text-1)" }}>
            Intelli<span style={{ color: "var(--primary)" }}>Course</span>
          </span>
        </Link>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 400 }}>
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontSize: 34, fontWeight: 800, marginBottom: 10, color: "var(--text-1)" }}>
              {tab === "login" ? "Welcome back 👋" : "Start learning today"}
            </h1>
            <p style={{ color: "var(--text-2)", fontSize: 15 }}>
              {tab === "login"
                ? "Enter your details to access your curated dashboard."
                : "Create your account and get a personalized AI learning path."}
            </p>
          </div>

          {errorMsg && (
            <div style={{
              background: errorMsg.includes("Success") ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${errorMsg.includes("Success") ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
              color: errorMsg.includes("Success") ? "var(--emerald)" : "var(--red)",
              padding: "12px 16px", borderRadius: 8, fontSize: 13, marginBottom: 24,
            }}>
              {errorMsg}
            </div>
          )}

          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", background: "var(--bg-base)",
            borderRadius: 12, padding: 4, marginBottom: 32, border: "1.5px solid var(--border)",
          }}>
            {(["login", "register"] as const).map((t) => (
              <button key={t} onClick={() => { setTab(t); setErrorMsg(null); }} style={{
                background: tab === t ? "linear-gradient(135deg, var(--primary-dark), var(--primary))" : "transparent",
                border: "none", borderRadius: 9, padding: "10px", fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 600, fontSize: 13, cursor: "pointer", color: tab === t ? "white" : "var(--text-2)",
                transition: "all 0.2s", boxShadow: tab === t ? "0 4px 14px rgba(37,99,235,0.3)" : "none",
              }}>
                {t === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {tab === "register" && (
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--text-1)" }}>
                  Full Name
                </label>
                <div style={{ position: "relative" }}>
                  <User size={15} color="var(--text-3)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                  <input className="inp" style={{ paddingLeft: 42 }} type="text" placeholder="Alex Johnson"
                    value={name} onChange={e => setName(e.target.value)} required={tab === "register"} />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--text-1)" }}>
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={15} color="var(--text-3)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input className="inp" style={{ paddingLeft: 42 }} type="email" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--text-1)" }}>Password</label>
                {tab === "login" && (
                  <Link href="#" style={{ fontSize: 12, color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>Forgot Password?</Link>
                )}
              </div>
              <div style={{ position: "relative" }}>
                <Lock size={15} color="var(--text-3)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input className="inp" style={{ paddingLeft: 42, paddingRight: 42 }}
                  type={showPass ? "text" : "password"} placeholder="••••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}>
                  {showPass ? <EyeOff size={15} color="var(--text-3)" /> : <Eye size={15} color="var(--text-3)" />}
                </button>
              </div>
            </div>

            {tab === "register" && (
              <div style={{ background: "var(--bg-base)", borderRadius: 12, padding: "14px 16px", border: "1.5px solid var(--border)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: "var(--text-2)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>PASSWORD REQUIREMENTS</div>
                {[
                  { label: "At least 8 characters", ok: password.length >= 8 },
                  { label: "One uppercase letter", ok: /[A-Z]/.test(password) },
                  { label: "One number", ok: /[0-9]/.test(password) },
                ].map(req => (
                  <div key={req.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: "50%",
                      background: req.ok ? "rgba(16,185,129,0.15)" : "var(--bg-base)",
                      border: `1.5px solid ${req.ok ? "var(--emerald)" : "var(--border-strong)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {req.ok && <Check size={9} color="var(--emerald)" />}
                    </div>
                    <span style={{ fontSize: 12, color: req.ok ? "var(--emerald)" : "var(--text-3)" }}>{req.label}</span>
                  </div>
                ))}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary" style={{ textAlign: "center", justifyContent: "center", marginTop: 8, fontSize: 15, padding: "14px", width: "100%", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Processing..." : tab === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "'Inter', sans-serif" }}>OR CONTINUE WITH</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <button type="button" onClick={signInWithGoogle} disabled={loading} className="btn-secondary" style={{ justifyContent: "center", padding: "11px", opacity: loading ? 0.7 : 1 }}>
              <Globe size={15} color="#EA4335" /> Google
            </button>
            <button type="button" disabled className="btn-secondary" style={{ justifyContent: "center", padding: "11px", opacity: 0.5, cursor: "not-allowed" }}>
              <GitBranch size={15} color="var(--text-1)" /> GitHub
            </button>
          </div>

          <p style={{ marginTop: 28, textAlign: "center", fontSize: 13, color: "var(--text-2)" }}>
            {tab === "login" ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => { setTab(tab === "login" ? "register" : "login"); setErrorMsg(null); }}
              style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "'Inter', sans-serif" }}>
              {tab === "login" ? "Create Account" : "Sign In"}
            </button>
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL — Blue Showcase ── */}
      <div className="hero-section mobile-hide" style={{
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
        padding: "64px", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: "10%", right: "5%", width: 200, height: 200, borderRadius: "50%", border: "1px dashed rgba(255,255,255,0.2)" }} className="animate-spin-slow" />
        <div style={{ position: "absolute", bottom: "15%", left: "5%", width: 120, height: 120, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)" }} />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 420 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 10, padding: "8px 16px", marginBottom: 32, backdropFilter: "blur(8px)",
          }}>
            <Sparkles size={14} color="white" />
            <span style={{ fontSize: 12, fontWeight: 600, color: "white", letterSpacing: "0.05em" }}>AI-POWERED INSIGHT</span>
          </div>

          <h2 style={{ fontSize: "clamp(28px, 3vw, 44px)", marginBottom: 20, lineHeight: 1.1, color: "white" }}>
            Personalization at the{" "}
            <span style={{ fontStyle: "italic", borderBottom: "2px solid rgba(255,255,255,0.5)" }}>Speed of Thought.</span>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.7, fontSize: 16, marginBottom: 40 }}>
            Our curator learns your cognitive patterns to deliver educational content that perfectly bridges your current skills and your future goals.
          </p>

          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16,
            background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 16, padding: "24px", backdropFilter: "blur(12px)", marginBottom: 20,
          }}>
            {INSIGHTS.map((insight, i) => (
              <div key={insight.label} style={{ textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}><insight.icon size={18} color="white" /></div>
                <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", color: "white", marginBottom: 4 }}>{insight.stat}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{insight.label}</div>
              </div>
            ))}
          </div>

          <div style={{
            background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 14, padding: "18px 20px", backdropFilter: "blur(12px)", textAlign: "left",
          }}>
            <div style={{ display: "flex", gap: 3, marginBottom: 10 }}>
              {[1,2,3,4,5].map(s => <svg key={s} width="12" height="12" viewBox="0 0 12 12" fill="#FCD34D"><path d="M6 1l1.5 3h3l-2.5 2 1 3L6 7.5 3 9l1-3L1.5 4h3z"/></svg>)}
            </div>
            <p style={{ fontSize: 14, color: "white", lineHeight: 1.6, marginBottom: 14 }}>
              "IntelliCourse rebuilt my entire approach to learning. I hit Senior Engineer in 14 months."
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "white" }}>JR</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", color: "white" }}>James Rivera</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>Staff Engineer @ Stripe</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mobile-px mobile-py mobile-flex-col" style={{
        gridColumn: "1 / -1", borderTop: "1px solid var(--border)", padding: "16px 64px", background: "white",
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16
      }}>
        <span style={{ color: "var(--text-3)", fontSize: 12 }}>© 2024 IntelliCourse. AI-Driven Excellence.</span>
        <div style={{ display: "flex", gap: 24 }}>
          {["About Us", "Privacy Policy", "Terms of Service", "Help Center"].map(l => (
            <Link key={l} href="#" style={{ color: "var(--text-3)", fontSize: 12, textDecoration: "none" }}>{l}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}
