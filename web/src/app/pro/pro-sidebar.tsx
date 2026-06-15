"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  Activity,
  Shield,
} from "lucide-react";

const navItems = [
  { href: "/pro", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/pro/queue", label: "Review Queue", icon: ClipboardList, roles: ["MBBS","AYURVEDA","NUTRITIONIST","CHEF"] },
  { href: "/pro/content", label: "Content Studio", icon: FileText, roles: ["YOGA_TRAINER","WORKOUT_TRAINER"] },
  { href: "/pro/settings", label: "Settings", icon: Settings },
];

interface ProSidebarProps {
  user: { name: string; role: string; expertStatus: string; contributionCount: number } | null;
}

export function ProSidebar({ user }: ProSidebarProps) {
  const pathname = usePathname();

  const visibleNav = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role ?? "");
  });

  const rolePretty: Record<string, string> = {
    MBBS: "MBBS Doctor",
    AYURVEDA: "Ayurveda Practitioner",
    NUTRITIONIST: "Nutritionist",
    CHEF: "Chef / Diet Expert",
    YOGA_TRAINER: "Yoga Trainer",
    WORKOUT_TRAINER: "Fitness Trainer",
  };

  return (
    <aside
      style={{
        width: 240,
        minHeight: "100vh",
        background: "var(--sidebar)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* Brand */}
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, #58A6FF22, #58A6FF55)",
            border: "1px solid #58A6FF44",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Activity size={16} style={{ color: "var(--primary)" }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--foreground)" }}>
            MomDigital Pro
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
          <Shield size={12} style={{ color: "var(--primary)", flexShrink: 0 }} />
          <span style={{ fontSize: "0.7rem", color: "var(--muted-foreground)", letterSpacing: "0.03em" }}>
            Expert Portal
          </span>
        </div>
      </div>

      {/* User info */}
      {user && (
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg, #58A6FF33, #A371F733)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.9rem", fontWeight: 700, color: "var(--primary)",
            marginBottom: 8,
          }}>
            {user.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <p style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--foreground)", margin: 0 }}>
            {user.name}
          </p>
          <p style={{ fontSize: "0.72rem", color: "var(--muted-foreground)", margin: "2px 0 0" }}>
            {rolePretty[user.role] ?? user.role}
          </p>
          {user.expertStatus === "PENDING_APPROVAL" && (
            <div style={{
              marginTop: 8, padding: "4px 8px", borderRadius: 4,
              background: "rgba(210,153,34,0.15)", border: "1px solid rgba(210,153,34,0.3)",
              fontSize: "0.65rem", color: "#D29922", fontWeight: 600,
            }}>
              ⏳ PENDING APPROVAL
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "12px 0" }}>
        {visibleNav.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 20px", textDecoration: "none",
                color: active ? "var(--primary)" : "var(--muted-foreground)",
                background: active ? "rgba(88,166,255,0.08)" : "transparent",
                borderLeft: active ? "2px solid var(--primary)" : "2px solid transparent",
                fontSize: "0.85rem", fontWeight: active ? 600 : 400,
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={16} />
              {item.label}
              {active && <ChevronRight size={14} style={{ marginLeft: "auto", opacity: 0.5 }} />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)" }}>
        <a
          href="/api/auth/logout"
          style={{
            display: "flex", alignItems: "center", gap: 10,
            color: "var(--muted-foreground)", textDecoration: "none",
            fontSize: "0.85rem", padding: "8px 0",
            transition: "color 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--destructive)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted-foreground)")}
        >
          <LogOut size={16} />
          Sign Out
        </a>
      </div>
    </aside>
  );
}
