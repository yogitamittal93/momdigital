"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Heart, LogOut, Moon, Pen } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { fetchMe, ApiUser } from "@/lib/api-client";
import { updateProfile } from "@/services/auth.service";

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

  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState({
    name: "",
    dueDate: "",
    babyBirthDate: "",
  });
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const pregnancyText = useMemo(() => getPregnancyStatus(profile), [profile]);

  const openEditForm = () => {
    setFormState({
      name: profile?.name ?? "",
      dueDate: profile?.dueDate ? profile.dueDate.slice(0, 10) : "",
      babyBirthDate: profile?.babyBirthDate ? profile.babyBirthDate.slice(0, 10) : "",
    });
    setSuccessMessage(null);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    setError(null);
    try {
      const payload: { name?: string; dueDate?: string; babyBirthDate?: string } = {
        name: formState.name.trim() || undefined,
      };
      if (formState.dueDate) payload.dueDate = formState.dueDate;
      if (formState.babyBirthDate) payload.babyBirthDate = formState.babyBirthDate;

      const updated = (await updateProfile(payload)) as ApiUser;
      setProfile(updated);
      setSuccessMessage("Profile updated successfully.");
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

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
                <Button variant="outline" size="sm" onClick={openEditForm} className="rounded-full">
                  <Pen className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
              {error ? (
                <p className="mt-4 text-sm text-destructive">{error}</p>
              ) : null}
              {successMessage ? (
                <p className="mt-4 text-sm text-primary">{successMessage}</p>
              ) : null}
            </Card>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 md:px-8 mt-16">
          {isEditing ? (
            <Card className="rounded-3xl border-none shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3>Edit Profile</h3>
                  <p className="text-sm text-muted-foreground">Update your name and due date information.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <Input
                    value={formState.name}
                    onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Expected due date</label>
                  <Input
                    type="date"
                    value={formState.dueDate}
                    onChange={(event) => setFormState((prev) => ({ ...prev, dueDate: event.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Baby birth date</label>
                  <Input
                    type="date"
                    value={formState.babyBirthDate}
                    onChange={(event) => setFormState((prev) => ({ ...prev, babyBirthDate: event.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              </div>
            </Card>
          ) : null}
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
