"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import {
  Trophy, Lock, Star, Flame, Users, BookOpen,
  Target, Award, Zap, Crown, Medal, Gem,
  CheckCircle2, TrendingUp
} from "lucide-react";

type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  unlocked_at: string;
};

const ICON_MAP: Record<string, any> = {
  trophy: Trophy,
  star: Star,
  flame: Flame,
  users: Users,
  "book-open": BookOpen,
  target: Target,
  award: Award,
  zap: Zap,
  crown: Crown,
  medal: Medal,
  gem: Gem,
};

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  learning: { label: "Learning", color: "var(--primary)", bg: "var(--primary-subtle)", border: "rgba(37,99,235,0.2)" },
  consistency: { label: "Consistency", color: "#F59E0B", bg: "#FFFBEB", border: "rgba(245,158,11,0.2)" },
  social: { label: "Social", color: "#0EA5E9", bg: "#F0F9FF", border: "rgba(14,165,233,0.2)" },
  mastery: { label: "Mastery", color: "#10B981", bg: "#ECFDF5", border: "rgba(16,185,129,0.2)" },
};

const ALL_BADGES = [
  { title: "First Steps", description: "Enroll in your first course", icon: "zap", category: "learning" },
  { title: "Quick Learner", description: "Complete a course within 7 days", icon: "flame", category: "learning" },
  { title: "Bookworm", description: "Enroll in 5 courses", icon: "book-open", category: "learning" },
  { title: "Scholar", description: "Complete 3 courses", icon: "award", category: "learning" },
  { title: "Master Mind", description: "Complete 10 courses", icon: "crown", category: "mastery" },
  { title: "Perfectionist", description: "Score 100% on any quiz", icon: "target", category: "mastery" },
  { title: "Diamond Hands", description: "Maintain a 30-day streak", icon: "gem", category: "consistency" },
  { title: "Week Warrior", description: "Study 7 days in a row", icon: "flame", category: "consistency" },
  { title: "Daily Driver", description: "Study 3 days in a row", icon: "star", category: "consistency" },
  { title: "Team Player", description: "Join a study group", icon: "users", category: "social" },
  { title: "Reviewer", description: "Leave your first course review", icon: "star", category: "social" },
  { title: "Top Achiever", description: "Earn 10 badges", icon: "trophy", category: "mastery" },
];

export default function AchievementsPage() {
  const supabase = createClient();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    async function fetchAchievements() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", user.id)
        .order("unlocked_at", { ascending: false });

      if (!error && data) {
        setAchievements(data as Achievement[]);
      }
      setLoading(false);
    }
    fetchAchievements();
  }, []);

  const unlockedSet = new Set(achievements.map(a => a.title));

  const filteredBadges = ALL_BADGES.filter(b =>
    activeCategory === "all" || b.category === activeCategory
  );

  const totalUnlocked = achievements.length;
  const totalBadges = ALL_BADGES.length;
  const completionRate = totalBadges > 0 ? Math.round((totalUnlocked / totalBadges) * 100) : 0;

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 12, color: "var(--primary)", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.06em", marginBottom: 8, textTransform: "uppercase" }}>RECOGNITION</div>
        <h1 style={{ fontSize: "clamp(24px, 3vw, 36px)", marginBottom: 12, color: "var(--text-1)" }}>Achievements</h1>
        <p style={{ color: "var(--text-2)", fontSize: 15, lineHeight: 1.6, maxWidth: 500 }}>
          Unlock badges by reaching milestones in your learning journey.
        </p>
      </div>

      {/* Stats summary */}
      <div className="mobile-col-2" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
        {[
          { icon: Trophy, label: "Badges Earned", value: `${totalUnlocked}/${totalBadges}`, color: "var(--primary)", bg: "var(--primary-subtle)" },
          { icon: TrendingUp, label: "Completion", value: `${completionRate}%`, color: "#10B981", bg: "#ECFDF5" },
          { icon: Flame, label: "Current Streak", value: "0 days", color: "#F59E0B", bg: "#FFFBEB" },
        ].map(stat => (
          <div key={stat.label} style={{
            background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: "20px",
            boxShadow: "0 1px 4px rgba(15,23,42,0.05)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: "var(--text-2)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}>{stat.label}</span>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <stat.icon size={15} color={stat.color} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Category filter */}
      <div style={{ display: "flex", gap: 4, background: "var(--bg-base)", borderRadius: 12, padding: 4, border: "1.5px solid var(--border)", marginBottom: 28, flexWrap: "wrap" }}>
        <button onClick={() => setActiveCategory("all")} style={{
          background: activeCategory === "all" ? "white" : "transparent",
          border: activeCategory === "all" ? "1px solid var(--border)" : "1px solid transparent",
          borderRadius: 9, padding: "7px 14px", fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 600, fontSize: 12, cursor: "pointer",
          color: activeCategory === "all" ? "var(--primary)" : "var(--text-2)",
          boxShadow: activeCategory === "all" ? "0 1px 4px rgba(15,23,42,0.06)" : "none", transition: "all 0.15s",
        }}>
          All
        </button>
        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
          <button key={key} onClick={() => setActiveCategory(key)} style={{
            background: activeCategory === key ? "white" : "transparent",
            border: activeCategory === key ? "1px solid var(--border)" : "1px solid transparent",
            borderRadius: 9, padding: "7px 14px", fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 600, fontSize: 12, cursor: "pointer",
            color: activeCategory === key ? cfg.color : "var(--text-2)",
            boxShadow: activeCategory === key ? "0 1px 4px rgba(15,23,42,0.06)" : "none", transition: "all 0.15s",
          }}>
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ height: 160, borderRadius: 14, animation: "shimmer 1.5s infinite", backgroundImage: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)", backgroundSize: "200% 100%" }} />
          ))}
        </div>
      )}

      {/* Badge grid */}
      {!loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {filteredBadges.map((badge) => {
            const isUnlocked = unlockedSet.has(badge.title);
            const unlocked = achievements.find(a => a.title === badge.title);
            const cfg = CATEGORY_CONFIG[badge.category];
            const IconComponent = ICON_MAP[badge.icon] || Trophy;
            return (
              <div key={badge.title} style={{
                background: isUnlocked ? "white" : "var(--bg-base)",
                border: `1.5px solid ${isUnlocked ? cfg.border : "var(--border)"}`,
                borderRadius: 14, padding: 20,
                position: "relative", overflow: "hidden",
                opacity: isUnlocked ? 1 : 0.6,
                transition: "all 0.2s",
                boxShadow: isUnlocked ? "0 2px 8px rgba(15,23,42,0.06)" : "none",
              }}>
                {/* Category tag */}
                <div style={{
                  position: "absolute", top: 12, right: 12,
                  fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 6,
                  background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                  textTransform: "uppercase", letterSpacing: "0.05em",
                }}>
                  {cfg.label}
                </div>

                {/* Icon */}
                <div style={{
                  width: 48, height: 48, borderRadius: 12, marginBottom: 14,
                  background: isUnlocked ? cfg.bg : "var(--bg-base)",
                  border: `1.5px solid ${isUnlocked ? cfg.border : "var(--border)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {isUnlocked
                    ? <IconComponent size={22} color={cfg.color} />
                    : <Lock size={18} color="var(--text-3)" />}
                </div>

                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: isUnlocked ? "var(--text-1)" : "var(--text-3)" }}>
                  {badge.title}
                </h3>
                <p style={{ fontSize: 12, color: isUnlocked ? "var(--text-2)" : "var(--text-3)", lineHeight: 1.5 }}>
                  {badge.description}
                </p>

                {isUnlocked && unlocked && (
                  <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 4 }}>
                    <CheckCircle2 size={11} color={cfg.color} />
                    <span style={{ fontSize: 10, color: cfg.color, fontWeight: 600 }}>
                      Unlocked {new Date(unlocked.unlocked_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
