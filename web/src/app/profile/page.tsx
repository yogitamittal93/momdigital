"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Heart, LogOut, Moon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { fetchMe, ApiUser } from "@/lib/api-client";

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}

function getPregnancyStatus(user: ApiUser | null) {
  if (!user) return "No pregnancy data available";

  if (user.dueDate) {
    const due = new Date(user.dueDate);
    const today = new Date();
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const week = Math.max(0, Math.min(40, 40 - Math.floor(diffDays / 7)));
    return `Due Date: ${formatDate(user.dueDate)} • Week ${week}`;
  }

  if (user.babyBirthDate) {
    return `Baby born ${formatDate(user.babyBirthDate)}`;
  }

  return "Please complete your profile to get personalized updates.";
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMe()
      .then((user) => {
        if (!user) {
          router.replace("/login");
          return;
        }
        setProfile(user);
      })
      .catch((err) => {
        console.error("Failed to load profile:", err);
        setError("Unable to load profile. Please sign in again.");
        router.replace("/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const initials = useMemo(() => {
    if (!profile?.name) return "MH";
    return profile.name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [profile]);

  const pregnancyText = useMemo(() => getPregnancyStatus(profile), [profile]);

  return (
    <AppShell>
      <div className="min-h-screen bg-background pb-8">
        <div className="bg-gradient-to-br from-primary/20 via-secondary/10 to-background px-4 md:px-8 pt-8 pb-16 rounded-b-[3rem]">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl md:text-3xl mb-6">Profile</h1>
            <ChatWindow />
            <Card className="rounded-3xl border-none shadow-lg p-6 -mb-12">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  {profile?.avatarUrl ? (
                    <AvatarImage src={profile.avatarUrl} alt={profile.name ?? "profile"} />
                  ) : null}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2>{loading ? "Loading..." : profile?.name ?? "Your Profile"}</h2>
                  <p className="text-sm text-muted-foreground">
                    {loading ? "Loading email..." : profile?.email ?? "No email available"}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="rounded-full">
                  Edit
                </Button>
              </div>
              {error ? (
                <p className="mt-4 text-sm text-destructive">{error}</p>
              ) : null}
            </Card>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 md:px-8 mt-16">
          <Card className="rounded-3xl border-none shadow-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-6 h-6 text-primary" />
              <h3>Pregnancy Information</h3>
            </div>
            <p className="text-sm text-muted-foreground">{loading ? "Loading pregnancy details..." : pregnancyText}</p>
          </Card>
          <Card className="rounded-3xl border-none shadow-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-6 h-6 text-secondary" />
              <h3>Notifications</h3>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-2xl">
              <span className="text-sm">Appointment reminders</span>
              <Switch checked />
            </div>
          </Card>
          <Card className="rounded-3xl border-none shadow-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Moon className="w-6 h-6 text-accent-foreground" />
              <h3>Appearance</h3>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl">
              <span className="text-sm">Dark Mode</span>
              <ThemeToggle />
            </div>
          </Card>
          <Card className="rounded-3xl border-none shadow-lg p-6 mb-6">
            <h3 className="mb-2">Medical Records</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload scan reports, review history, download, and manage records.
            </p>
            <Link href="/medical-records">
              <Button className="rounded-full">Open Medical Records</Button>
            </Link>
          </Card>
          <Button
            variant="outline"
            onClick={() => router.push("/login")}
            className="w-full rounded-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
