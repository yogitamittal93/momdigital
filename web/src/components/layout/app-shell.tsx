"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";

const navItems = [
  { path: "/dashboard", icon: Home, label: "Home" },
  { path: "/pregnancy", icon: Heart, label: "Pregnancy" },
  { path: "/appointments", icon: Calendar, label: "Appointments" },
  { path: "/postpartum", icon: Sparkles, label: "Recovery" },
  { path: "/childcare", icon: Baby, label: "Child Care" },
  { path: "/community", icon: Users, label: "Community" },
  { path: "/profile", icon: User, label: "Profile" },
];

const secondaryItems = [
  { path: "/affirmations", icon: Star, label: "Affirmations" },
  { path: "/trusted-help", icon: Shield, label: "Trusted Help" },
  { path: "/career", icon: Briefcase, label: "Career" },
  { path: "/recovery", icon: TrendingUp, label: "Body Recovery" },
  { path: "/medical-records", icon: FolderOpen, label: "Medical Records" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (path: string) =>
    path === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <main className="w-full md:ml-64 md:w-[calc(100%-16rem)]">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden z-50 shadow-lg">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : ""}`} />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <nav className="hidden md:block fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border p-6 overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-xl mb-1 text-primary flex items-center gap-2">
            <Heart className="w-6 h-6 fill-primary" />
            MomDigital
          </h1>
          <p className="text-sm text-muted-foreground">MidwifeBuddy</p>
        </div>
        <div className="space-y-2">
          {navItems.map((item) => {
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
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
        <div className="mt-8 space-y-2">
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
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
