"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Baby,
  Briefcase,
  Calendar,
  Heart,
  Home,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  User,
  Users,
  FolderOpen,
  LayoutDashboard,
  ClipboardList,
  FileText,
  Activity,
  AlertCircle,
  MessageSquare,
  Grid3X3,
  X,
} from "lucide-react";
import { useUserProfileContext } from "@/context/user-profile-context";
import type { UserRole } from "@/lib/api-client";
import { NotificationBell } from "./notification-bell";


// ─── Mother navigation ───────────────────────────────────────────────────────

const motherNavItems = [
  { path: "/chat", icon: MessageSquare, label: "Maternity Help" },
  { path: "/dashboard", icon: Home, label: "Home" },
  { path: "/pregnancy", icon: Heart, label: "Pregnancy" },
  { path: "/appointments", icon: Calendar, label: "Appointments" },
  { path: "/postpartum", icon: Sparkles, label: "Recovery" },
  { path: "/childcare", icon: Baby, label: "Child Care" },
  { path: "/community", icon: Users, label: "Community" },
  { path: "/profile", icon: User, label: "Profile" },
];

const motherSecondaryItems = [
  { path: "/affirmations", icon: Star, label: "Affirmations" },
  { path: "/trusted-help", icon: Shield, label: "Trusted Help" },
  { path: "/career", icon: Briefcase, label: "Career" },
  { path: "/recovery", icon: TrendingUp, label: "Body Recovery" },
  { path: "/medical-records", icon: FolderOpen, label: "Medical Records" },
  { path: "/trainers", icon: Users, label: "Top Trainers" },
];

// ─── Expert navigation ────────────────────────────────────────────────────────

const expertNavItems = [
  { path: "/pro", icon: LayoutDashboard, label: "Dashboard", exact: true },
  {
    path: "/pro/queue",
    icon: ClipboardList,
    label: "Review Queue",
    roles: ["MBBS", "AYURVEDA", "NUTRITIONIST", "CHEF"],
  },
  {
    path: "/pro/content",
    icon: FileText,
    label: "Content Studio",
    roles: ["YOGA_TRAINER", "WORKOUT_TRAINER", "DANCE_TEACHER"],
  },
  { path: "/community", icon: Users, label: "Community" },
  { path: "/profile", icon: User, label: "Profile" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EXPERT_ROLES: UserRole[] = [
  "MBBS",
  "AYURVEDA",
  "NUTRITIONIST",
  "CHEF",
  "YOGA_TRAINER",
  "WORKOUT_TRAINER",
  "DANCE_TEACHER",
];

function isExpertRole(role?: UserRole | null): boolean {
  return !!role && EXPERT_ROLES.includes(role);
}

const rolePretty: Record<string, string> = {
  MBBS: "MBBS Doctor",
  AYURVEDA: "Ayurveda Practitioner",
  NUTRITIONIST: "Nutritionist",
  CHEF: "Chef / Diet Expert",
  YOGA_TRAINER: "Yoga Trainer",
  WORKOUT_TRAINER: "Fitness Trainer",
  DANCE_TEACHER: "Dance Teacher",
  ADMIN: "Administrator",
  MOTHER: "Mom",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, error } = useUserProfileContext();

  // Client-side auth guard. Redirect to /login only when we have definitively
  // confirmed there is no authenticated user (loading is false AND user is null).
  // Do NOT also require `error` — a null user with no error (e.g. fetchMe
  // returned null after a 401→failed-refresh) is equally unauthenticated.
  // Requiring `error` was causing a flash-then-logout after Google OAuth because
  // the first /auth/me probe could silently return null (no thrown error) before
  // the SameSite cookie from the OAuth redirect had propagated.
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  const role = user?.role ?? "MOTHER";
  const isExpert = isExpertRole(role);
  const isAdmin = user?.isAdmin ?? false;
  const isPending = user?.expertStatus === "PENDING_APPROVAL";

  // Which nav list to render
  const navItems = isExpert
    ? expertNavItems.filter((item) => {
      if (!("roles" in item) || !item.roles) return true;
      return item.roles.includes(role);
    })
    : motherNavItems;

  const secondaryItems = isExpert ? [] : motherSecondaryItems;

  const isActive = (path: string, exact?: boolean) =>
    exact ? pathname === path : pathname.startsWith(path);

  // Mobile nav: show only the first 4 items; 5th slot is the "More" drawer button
  const mobileNavItems = navItems.slice(0, 4);
  const drawerPrimaryItems = navItems.slice(4);

  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <main className="w-full md:ml-64 md:w-[calc(100%-16rem)]">
        {/* Pending approval banner — shown inside every page for pending experts */}
        {isPending && (
          <div className="flex items-center gap-3 bg-amber-500/10 border-b border-amber-500/30 px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-amber-700 dark:text-amber-400">
              <span className="font-semibold">Account pending review.</span>{" "}
              An admin will approve your credentials shortly. Some features are
              locked until approval.
            </p>
          </div>
        )}
        {children}

        {/* Mobile footer for legal and support links */}
        <footer className="md:hidden py-6 border-t border-border/40 px-6 text-center space-y-2 bg-card mt-8">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground font-semibold">
            <Link href="/about" className="hover:text-primary transition-colors">About</Link>
            <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
            <Link href="/support" className="hover:text-primary transition-colors">Support</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
          </div>
          <p className="text-[10px] text-muted-foreground/60">© {new Date().getFullYear()} MomDigital</p>
        </footer>
      </main>

      {/* ── Mobile bottom nav ─────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden z-50 shadow-lg">
        <div className="flex items-center justify-around px-2 py-2">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path, (item as { exact?: boolean }).exact);
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all ${active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : ""}`} />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            );
          })}
          {/* More button — opens the drawer */}
          <button
            id="mobile-more-btn"
            onClick={() => setDrawerOpen(true)}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all ${
              drawerOpen
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Grid3X3 className="w-5 h-5" />
            <span className="text-[10px]">More</span>
          </button>
        </div>
      </nav>

      {/* ── Mobile slide-up drawer ─────────────────────────────────────── */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] md:hidden"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer panel */}
          <div
            id="mobile-drawer"
            className="fixed bottom-0 left-0 right-0 z-[70] md:hidden bg-card rounded-t-3xl shadow-2xl border-t border-border max-h-[82vh] overflow-y-auto"
            style={{ animation: "slideUp 0.25s cubic-bezier(0.32,0.72,0,1)" }}
          >
            <style>{`
              @keyframes slideUp {
                from { transform: translateY(100%); }
                to { transform: translateY(0); }
              }
            `}</style>

            {/* Drag handle + close */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto" />
              <button
                onClick={() => setDrawerOpen(false)}
                className="absolute right-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-4 pb-8 space-y-1">
              {/* User identity chip */}
              {user && (
                <div className="flex items-center gap-3 px-3 py-3 mb-3 rounded-2xl bg-muted/40">
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {user.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {rolePretty[role] ?? role}
                      {isAdmin && (
                        <span className="ml-1 text-primary font-semibold">· Admin</span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Remaining primary items (items 4+) */}
              {drawerPrimaryItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path, (item as { exact?: boolean }).exact);
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                      active
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}

              {/* Secondary items */}
              {secondaryItems.length > 0 && (
                <>
                  <p className="px-4 pt-3 pb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    More
                  </p>
                  {secondaryItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                          active
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    );
                  })}
                </>
              )}

              {/* Admin shortcut */}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-3 px-4 py-3 mt-2 rounded-2xl text-primary border border-primary/30 hover:bg-primary/10 transition-all text-sm font-semibold"
                >
                  <Shield className="w-5 h-5" />
                  Admin Panel
                </Link>
              )}

              {/* Legal links */}
              <div className="mt-4 pt-4 border-t border-border/50 px-4">
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground font-medium">
                  <Link href="/about" className="hover:text-primary transition-colors">About</Link>
                  <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
                  <Link href="/support" className="hover:text-primary transition-colors">Support</Link>
                  <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
                  <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
                </div>
                <p className="text-[10px] text-muted-foreground/60 mt-2">© {new Date().getFullYear()} MomDigital</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Desktop sidebar ───────────────────────────────────────────── */}
      <nav className="hidden md:block fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border p-6 overflow-y-auto">
        {/* Brand */}
        <div className="mb-8">
          {isExpert ? (
            <>
              <h1 className="text-xl mb-1 text-primary flex items-center gap-2">
                <Activity className="w-6 h-6" />
                MomDigital Pro
              </h1>
              <p className="text-sm text-muted-foreground">Expert Portal</p>
            </>
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl mb-1 text-primary flex items-center gap-2">
                  <Heart className="w-6 h-6 fill-primary" />
                  MomDigital
                </h1>
                <p className="text-sm text-muted-foreground">MidwifeBuddy</p>
              </div>
              <NotificationBell />
            </div>
          )}
        </div>

        {/* User identity chip */}
        {user && (
          <div className="mb-6 flex items-center gap-3 px-3 py-3 rounded-2xl bg-muted/40">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
              {user.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground">
                {rolePretty[role] ?? role}
                {isAdmin && (
                  <span className="ml-1 text-primary font-semibold">· Admin</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Pending banner */}
        {isPending && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            Pending approval
          </div>
        )}

        {/* Primary nav */}
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path, (item as { exact?: boolean }).exact);
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${active
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-foreground hover:bg-muted"
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Secondary nav (mother only) */}
        {secondaryItems.length > 0 && (
          <div className="mt-6 space-y-1">
            <p className="px-4 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              More
            </p>
            {secondaryItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${active
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-foreground hover:bg-muted"
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Admin shortcut */}
        {isAdmin && (
          <div className="mt-6">
            <Link
              href="/admin"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-primary border border-primary/30 hover:bg-primary/10 transition-all text-sm font-semibold"
            >
              <Shield className="w-5 h-5" />
              Admin Panel
            </Link>
          </div>
        )}

        {/* Utility / Legal Links */}
        <div className="mt-8 pt-4 border-t border-border/50 px-4 space-y-2">
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground font-medium">
            <Link href="/about" className="hover:text-primary transition-colors">About</Link>
            <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
            <Link href="/support" className="hover:text-primary transition-colors">Support</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
          </div>
          <p className="text-[9px] text-muted-foreground/60">© {new Date().getFullYear()} MomDigital</p>
        </div>
      </nav>

      {/* Floating Chat Button for patients */}
      {!isExpert && user && (
        <Link
          href="/chat"
          className="fixed bottom-24 right-6 md:bottom-8 md:right-8 w-14 h-14 rounded-full bg-primary text-white shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center z-[99] hover:bg-primary/95 group"
          aria-label="Maternity Help"
        >
          <MessageSquare className="w-6 h-6 group-hover:rotate-6 transition-transform" />
        </Link>
      )}
    </div>
  );
}
