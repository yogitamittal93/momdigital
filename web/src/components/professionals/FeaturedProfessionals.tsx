"use client";

import { useEffect, useRef, useState } from "react";
import { Star, ChevronLeft, ChevronRight, ExternalLink, Stethoscope, Salad, Dumbbell, Flame } from "lucide-react";
import type { FeaturedExpert } from "@/services/experts.service";

import { getApiBase } from "@/lib/api-url";

const API = getApiBase();

const roleConfig: Record<string, { label: string; color: string; bg: string; Icon: React.ComponentType<{ size?: number }> }> = {
  MBBS:             { label: "MBBS Doctor",     color: "#E57373", bg: "rgba(229,115,115,0.12)", Icon: Stethoscope },
  AYURVEDA:         { label: "Ayurveda",         color: "#BA68C8", bg: "rgba(186,104,200,0.12)", Icon: Stethoscope },
  NUTRITIONIST:     { label: "Nutritionist",     color: "#4CAF50", bg: "rgba(76,175,80,0.12)",   Icon: Salad },
  CHEF:             { label: "Chef Expert",      color: "#FF9800", bg: "rgba(255,152,0,0.12)",   Icon: Flame },
  YOGA_TRAINER:     { label: "Yoga Trainer",     color: "#D4B5E8", bg: "rgba(212,181,232,0.12)", Icon: Dumbbell },
  WORKOUT_TRAINER:  { label: "Fitness Trainer",  color: "#FF9F89", bg: "rgba(255,159,137,0.12)", Icon: Dumbbell },
};

function ExpertCard({ expert }: { expert: FeaturedExpert }) {
  const cfg = roleConfig[expert.role] ?? { label: expert.role, color: "#FF9F89", bg: "rgba(255,159,137,0.12)", Icon: Star };
  const initials = expert.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div
      style={{
        flexShrink: 0,
        width: 200,
        background: "var(--card)",
        borderRadius: "1.25rem",
        padding: "20px 16px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        border: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 10,
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        cursor: "default",
        scrollSnapAlign: "start",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)";
      }}
    >
      {/* Avatar */}
      <div style={{ position: "relative" }}>
        {expert.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={expert.avatarUrl}
            alt={expert.name}
            style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", border: `2px solid ${cfg.color}22` }}
          />
        ) : (
          <div style={{
            width: 60, height: 60, borderRadius: "50%",
            background: `linear-gradient(135deg, ${cfg.color}30, ${cfg.color}15)`,
            border: `2px solid ${cfg.color}33`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.1rem", fontWeight: 700, color: cfg.color,
          }}>
            {initials}
          </div>
        )}
        {/* Featured star badge */}
        <div style={{
          position: "absolute", bottom: -2, right: -2,
          width: 20, height: 20, borderRadius: "50%",
          background: "linear-gradient(135deg, #FFD700, #FFA500)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 6px rgba(255,165,0,0.4)",
        }}>
          <Star size={10} fill="#fff" style={{ color: "#fff" }} />
        </div>
      </div>

      {/* Name */}
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: "0.875rem", color: "var(--foreground)", lineHeight: 1.3 }}>
          {expert.name}
        </p>
        {expert.specialization && (
          <p style={{ margin: "3px 0 0", fontSize: "0.72rem", color: "var(--muted-foreground)", lineHeight: 1.3 }}>
            {expert.specialization}
          </p>
        )}
      </div>

      {/* Role badge */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "3px 10px", borderRadius: 20,
        background: cfg.bg, fontSize: "0.65rem",
        fontWeight: 700, color: cfg.color,
        letterSpacing: "0.03em", textTransform: "uppercase",
      }}>
        <cfg.Icon size={10} />
        {cfg.label}
      </div>

      {/* Book button */}
      {expert.externalLink ? (
        <a
          href={expert.externalLink}
          target="_blank"
          rel="noreferrer"
          id={`book-expert-${expert.id}`}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            width: "100%", padding: "8px 0", borderRadius: "0.75rem",
            background: "var(--primary)", color: "var(--primary-foreground)",
            fontSize: "0.75rem", fontWeight: 600, textDecoration: "none",
            transition: "opacity 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <ExternalLink size={11} />
          Book Consultation
        </a>
      ) : (
        <div style={{
          width: "100%", padding: "8px 0", borderRadius: "0.75rem",
          background: "var(--muted)", color: "var(--muted-foreground)",
          fontSize: "0.75rem", fontWeight: 600, textAlign: "center",
        }}>
          Contact via App
        </div>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{
      flexShrink: 0, width: 200, background: "var(--card)", borderRadius: "1.25rem",
      padding: "20px 16px", border: "1px solid var(--border)", scrollSnapAlign: "start",
    }}>
      {[60, 40, 24, 20, 32].map((h, i) => (
        <div key={i} style={{
          height: h, borderRadius: 8, background: "var(--muted)",
          margin: i === 0 ? "0 auto 12px" : "8px 0",
          width: i === 0 ? 60 : "100%",
          animation: "shimmer 1.5s ease-in-out infinite",
          opacity: 0.6,
        }} />
      ))}
    </div>
  );
}

export function FeaturedProfessionals() {
  const [experts, setExperts] = useState<FeaturedExpert[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API}/experts/featured`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { setExperts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "right" ? 220 : -220, behavior: "smooth" });
  };

  if (!loading && experts.length === 0) return null;

  return (
    <section style={{ marginBottom: "2rem" }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div>
          <h2 style={{ margin: 0 }}>Featured Professionals</h2>
          <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "var(--muted-foreground)" }}>
            Verified experts — book a free consultation
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            id="fp-scroll-left"
            onClick={() => scroll("left")}
            style={{
              width: 34, height: 34, borderRadius: "50%",
              border: "1px solid var(--border)", background: "var(--card)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "var(--foreground)", transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--muted)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--card)")}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            id="fp-scroll-right"
            onClick={() => scroll("right")}
            style={{
              width: 34, height: 34, borderRadius: "50%",
              border: "1px solid var(--border)", background: "var(--card)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "var(--foreground)", transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--muted)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--card)")}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        style={{
          display: "flex", gap: 14, overflowX: "auto",
          scrollSnapType: "x mandatory", paddingBottom: 8,
          scrollbarWidth: "none", msOverflowStyle: "none",
        }}
      >
        {loading
          ? [...Array(5)].map((_, i) => <SkeletonCard key={i} />)
          : experts.map((e) => <ExpertCard key={e.id} expert={e} />)
        }
      </div>

      <style>{`
        @keyframes shimmer {
          0%,100% { opacity: 0.4; }
          50%      { opacity: 0.8; }
        }
      `}</style>
    </section>
  );
}
