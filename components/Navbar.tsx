"use client";
import Link from "next/link";
import { useState } from "react";
import { Search, Bell, ChevronDown, Zap, Menu, X } from "lucide-react";

export default function Navbar({ variant = "default" }: { variant?: "default" | "dashboard" }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav style={{
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
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
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

      {/* Center nav */}
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
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

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
              }}>A</div>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 13, color: "var(--text-1)" }}>Alex</span>
              <ChevronDown size={12} color="var(--text-3)" />
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
    </nav>
  );
}
