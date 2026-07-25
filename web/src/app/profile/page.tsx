"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Briefcase, Camera, Heart, LogOut, Moon, Pen, Shield, Star, User, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
// ChatWindow removed (relocated to dedicated /chat route)
import { fetchMe, ApiUser } from "@/lib/api-client";
import { updateProfile, uploadAvatar, logoutUser } from "@/services/auth.service";
import { bumpAuthEpoch } from "@/lib/api-client";

// ─── Role helpers ─────────────────────────────────────────────────────────────

const EXPERT_ROLES = [
  "MBBS", "AYURVEDA", "NUTRITIONIST", "CHEF",
  "YOGA_TRAINER", "WORKOUT_TRAINER", "DANCE_TEACHER",
];

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

const expertStatusInfo: Record<string, { label: string; color: string }> = {
  PENDING_APPROVAL: { label: "Pending Approval", color: "text-amber-600 dark:text-amber-400" },
  APPROVED:         { label: "Approved ✓",       color: "text-green-600 dark:text-green-400" },
  SUSPENDED:        { label: "Suspended",         color: "text-destructive" },
  REJECTED:         { label: "Rejected",          color: "text-destructive" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Avatar upload state
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit form state
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState({
    name: "",
    dueDate: "",
    babyBirthDate: "",
    specialization: "",
    bio: "",
    city: "",
    externalLink: "",
    whatsappNumber: "",
  });
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const isExpert = EXPERT_ROLES.includes(profile?.role ?? "");
  const isMother = !isExpert;

  const pregnancyText = useMemo(() => getPregnancyStatus(profile), [profile]);

  // ── Avatar upload ──────────────────────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    setError(null);
    try {
      const { profileImageUrl } = await uploadAvatar(file);
      setProfile((prev) =>
        prev ? { ...prev, profileImage: profileImageUrl, avatarUrl: profileImageUrl } : prev
      );
      setSuccessMessage("Profile photo updated!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload photo.");
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Edit form handlers ────────────────────────────────────────────────────
  const openEditForm = () => {
    setFormState({
      name: profile?.name ?? "",
      dueDate: profile?.dueDate ? profile.dueDate.slice(0, 10) : "",
      babyBirthDate: profile?.babyBirthDate ? profile.babyBirthDate.slice(0, 10) : "",
      specialization: profile?.specialization ?? "",
      bio: (profile as Record<string, unknown>)?.bio as string ?? "",
      city: (profile as Record<string, unknown>)?.city as string ?? "",
      externalLink: profile?.externalLink ?? "",
      whatsappNumber: profile?.whatsappNumber ?? "",
    });
    setSuccessMessage(null);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, string | undefined> = {
        name: formState.name.trim() || undefined,
      };

      if (isMother) {
        if (formState.dueDate) payload.dueDate = formState.dueDate;
        if (formState.babyBirthDate) payload.babyBirthDate = formState.babyBirthDate;
      } else {
        if (formState.specialization) payload.specialization = formState.specialization;
        if (formState.bio) payload.bio = formState.bio;
        if (formState.city) payload.city = formState.city;
        if (formState.externalLink) payload.externalLink = formState.externalLink;
        if (formState.whatsappNumber) payload.whatsappNumber = formState.whatsappNumber;
      }

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

  const statusInfo = profile?.expertStatus
    ? expertStatusInfo[profile.expertStatus]
    : null;

  return (
    <AppShell>
      <div className="min-h-screen bg-background pb-8">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/20 via-secondary/10 to-background px-4 md:px-8 pt-8 pb-16 rounded-b-[3rem]">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl md:text-3xl mb-6">Profile</h1>
            {isMother && (
              <div className="mb-6">
                <Link href="/chat">
                  <Button className="rounded-full bg-primary hover:bg-primary/95 text-white gap-2 shadow-lg h-12 px-6">
                    <MessageSquare className="w-5 h-5" />
                    Ask Matrny (Maternity Help)
                  </Button>
                </Link>
              </div>
            )}
            <Card className="rounded-3xl border-none shadow-lg p-6 -mb-12">
              <div className="flex items-center gap-4">
                {/* Clickable avatar with camera overlay */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="relative w-20 h-20 rounded-full focus:outline-none focus:ring-2 focus:ring-primary group block"
                    aria-label="Change profile photo"
                  >
                    <Avatar className="w-20 h-20 pointer-events-none">
                      {(profile?.profileImage ?? profile?.avatarUrl) ? (
                        <AvatarImage
                          src={profile!.profileImage ?? profile!.avatarUrl ?? ""}
                          alt={profile!.name ?? "profile"}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <AvatarFallback>{initials}</AvatarFallback>
                      )}
                      {!(profile?.profileImage ?? profile?.avatarUrl) && null}
                    </Avatar>
                    <span className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {avatarUploading
                        ? <span className="text-white text-xs font-medium">…</span>
                        : <Camera className="w-6 h-6 text-white" />}
                    </span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>


                <div className="flex-1 min-w-0">
                  <h2>{loading ? "Loading..." : profile?.name ?? "Your Profile"}</h2>
                  <p className="text-sm text-muted-foreground truncate">
                    {loading ? "Loading email..." : profile?.email ?? "No email available"}
                  </p>
                  {/* Role badge */}
                  {profile?.role && (
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                        {isExpert ? <Shield className="w-3 h-3" /> : <Heart className="w-3 h-3" />}
                        {rolePretty[profile.role] ?? profile.role}
                      </span>
                      {statusInfo && (
                        <span className={`text-xs font-semibold ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      )}
                      {profile.isAdmin && (
                        <span className="text-xs font-semibold text-primary">Admin</span>
                      )}
                    </div>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={openEditForm} className="rounded-full shrink-0">
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
          {/* ── Edit form ───────────────────────────────────────────────── */}
          {isEditing ? (
            <Card className="rounded-3xl border-none shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3>Edit Profile</h3>
                  <p className="text-sm text-muted-foreground">
                    {isMother
                      ? "Update your name and pregnancy information."
                      : "Update your professional details."}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {/* Name — shared */}
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <Input
                    value={formState.name}
                    onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="Your name"
                  />
                </div>

                {/* Mother-only fields */}
                {isMother && (
                  <>
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
                  </>
                )}

                {/* Expert-only fields */}
                {isExpert && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Specialization</label>
                      <Input
                        value={formState.specialization}
                        onChange={(event) => setFormState((prev) => ({ ...prev, specialization: event.target.value }))}
                        placeholder="e.g. Postpartum Nutrition, OBGYN"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">City / Location</label>
                      <Input
                        value={formState.city}
                        onChange={(event) => setFormState((prev) => ({ ...prev, city: event.target.value }))}
                        placeholder="e.g. Chandigarh, Mohali, Panchkula"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Short Bio</label>
                      <Input
                        value={formState.bio}
                        onChange={(event) => setFormState((prev) => ({ ...prev, bio: event.target.value }))}
                        placeholder="e.g. Certified postpartum yoga specialist with 8+ years..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">External link</label>
                      <Input
                        value={formState.externalLink}
                        onChange={(event) => setFormState((prev) => ({ ...prev, externalLink: event.target.value }))}
                        placeholder="https://your-website.com"
                        type="url"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">WhatsApp number</label>
                      <Input
                        value={formState.whatsappNumber}
                        onChange={(event) => setFormState((prev) => ({ ...prev, whatsappNumber: event.target.value }))}
                        placeholder="+91 99999 99999"
                        type="tel"
                      />
                    </div>
                  </>
                )}

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

          {/* ── Mother-specific: Pregnancy info ──────────────────────── */}
          {isMother && (
            <Card className="rounded-3xl border-none shadow-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Heart className="w-6 h-6 text-primary" />
                <h3>Pregnancy Information</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {loading ? "Loading pregnancy details..." : pregnancyText}
              </p>
            </Card>
          )}

          {/* ── Expert-specific: Pro stats ───────────────────────────── */}
          {isExpert && (
            <Card className="rounded-3xl border-none shadow-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Star className="w-6 h-6 text-primary" />
                <h3>Expert Profile</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{profile?.contributionCount ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Contributions</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-bold text-amber-500">{profile?.isFeatured ? "⭐" : "—"}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {profile?.isFeatured ? "Featured Expert" : "Not featured yet"}
                  </p>
                </div>
              </div>
              {profile?.specialization && (
                <p className="mt-4 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Specialization:</span> {profile.specialization}
                </p>
              )}
              {profile?.externalLink && (
                <a
                  href={profile.externalLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  {profile.externalLink}
                </a>
              )}
              <div className="mt-4">
                <Link href="/pro">
                  <Button className="rounded-full w-full" variant="outline">
                    Open Expert Dashboard →
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {/* ── Notifications (shared) ────────────────────────────────── */}
          <Card className="rounded-3xl border-none shadow-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-6 h-6 text-secondary" />
              <h3>Notifications</h3>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-2xl">
              <span className="text-sm">
                {isMother ? "Appointment reminders" : "New assignment alerts"}
              </span>
              <Switch checked />
            </div>
          </Card>

          {/* ── Appearance (shared) ────────────────────────────────────── */}
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

          {/* ── Medical Records (mother only) ─────────────────────────── */}
          {isMother && (
            <Card className="rounded-3xl border-none shadow-lg p-6 mb-6">
              <h3 className="mb-2">Medical Records</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload scan reports, review history, download, and manage records.
              </p>
              <Link href="/medical-records">
                <Button className="rounded-full">Open Medical Records</Button>
              </Link>
            </Card>
          )}

          {/* ── Admin (admin only) ────────────────────────────────────── */}
          {profile?.isAdmin && (
            <Card className="rounded-3xl border-none shadow-lg p-6 mb-6 border border-primary/20 bg-primary/5">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-primary" />
                <h3>Admin Panel</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Manage expert approvals, platform configuration, and content moderation.
              </p>
              <Link href="/admin">
                <Button className="rounded-full" variant="outline">
                  Open Admin Panel →
                </Button>
              </Link>
            </Card>
          )}

          {/* ── Expert quick action ───────────────────────────────────── */}
          {isExpert && (
            <Card className="rounded-3xl border-none shadow-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-6 h-6 text-secondary" />
                <h3>Expert Account</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                Status:{" "}
                {statusInfo ? (
                  <span className={`font-semibold ${statusInfo.color}`}>{statusInfo.label}</span>
                ) : (
                  "Unknown"
                )}
              </p>
            </Card>
          )}

          {/* ── Legal & Support (shared) ────────────────────────────────── */}
          <Card className="rounded-3xl border-none shadow-lg p-6 mb-6 bg-card text-foreground">
            <h3 className="mb-4">Information &amp; Support</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link href="/about" className="flex items-center gap-2 p-3 bg-muted/30 hover:bg-muted/60 rounded-2xl transition-colors text-sm font-semibold">
                About Mom Digital
              </Link>
              <Link href="/support" className="flex items-center gap-2 p-3 bg-muted/30 hover:bg-muted/60 rounded-2xl transition-colors text-sm font-semibold">
                Support &amp; Help
              </Link>
              <Link href="/contact" className="flex items-center gap-2 p-3 bg-muted/30 hover:bg-muted/60 rounded-2xl transition-colors text-sm font-semibold">
                Contact Us
              </Link>
              <Link href="/privacy" className="flex items-center gap-2 p-3 bg-muted/30 hover:bg-muted/60 rounded-2xl transition-colors text-sm font-semibold">
                Privacy Policy
              </Link>
              <Link href="/terms" className="flex items-center gap-2 p-3 bg-muted/30 hover:bg-muted/60 rounded-2xl transition-colors text-sm font-semibold sm:col-span-2 justify-center">
                Terms of Service
              </Link>
            </div>
          </Card>

          {/* ── Sign out ────────────────────────────────────────────────── */}
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await logoutUser();
              } catch {
                // Still leave the client session even if the API call fails
                // (e.g. already-expired access token).
              }
              bumpAuthEpoch();
              window.location.href = "/login";
            }}
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
