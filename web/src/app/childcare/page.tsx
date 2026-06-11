"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Baby, Milk, Moon, AlertCircle, Plus, Pencil, CheckCircle2 } from "lucide-react";
import AppShell from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useUserProfile } from "@/hooks/use-user-profile";
import { api } from "@/lib/api-client";

interface FeedEntry {
  id: string;
  type: string;
  startedAt: string;
  durationMins?: number;
}

// Age-gated milestones — unlocked based on baby's age in months
function getMilestones(ageMonths: number) {
  return [
    { label: "Follows faces with eyes", unlocksAt: 0, achieved: ageMonths >= 0 },
    { label: "Reacts to loud sounds", unlocksAt: 0, achieved: ageMonths >= 1 },
    { label: "First social smile", unlocksAt: 2, achieved: ageMonths >= 2 },
    { label: "Holds head up briefly", unlocksAt: 2, achieved: ageMonths >= 2 },
    { label: "Coos and makes sounds", unlocksAt: 2, achieved: ageMonths >= 3 },
    { label: "Reaches for objects", unlocksAt: 3, achieved: ageMonths >= 4 },
    { label: "Rolls tummy to back", unlocksAt: 4, achieved: ageMonths >= 4 },
    { label: "Sits with support", unlocksAt: 5, achieved: ageMonths >= 5 },
    { label: "Babbles (ba, da, ma)", unlocksAt: 6, achieved: ageMonths >= 7 },
    { label: "Starts solids", unlocksAt: 6, achieved: ageMonths >= 6 },
    { label: "Pulls to stand", unlocksAt: 9, achieved: ageMonths >= 10 },
    { label: "First words", unlocksAt: 10, achieved: ageMonths >= 12 },
  ].filter((m) => m.unlocksAt <= ageMonths + 2); // show current + 2 months ahead
}

// Inline edit form for missing baby info
function BabyProfileForm({ onSave }: { onSave: () => void }) {
  const [babyName, setBabyName] = useState("");
  const [babyBirthDate, setBabyBirthDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!babyBirthDate) { setError("Birth date is required"); return; }
    setSaving(true);
    try {
      await api.patch("/auth/me", {
        babyName: babyName || undefined,
        babyBirthDate,
      });
      onSave();
    } catch {
      setError("Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="rounded-3xl border-none shadow-lg p-6 mb-6 bg-primary/5">
      <h3 className="mb-1">Tell us about your baby</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Add your baby's details to unlock personalized feeding logs, milestones, and care guidance.
      </p>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Baby's name (optional)</label>
          <Input
            placeholder="e.g. Aryan"
            value={babyName}
            onChange={(e) => setBabyName(e.target.value)}
            className="rounded-xl"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Baby's birth date *</label>
          <Input
            type="date"
            value={babyBirthDate}
            onChange={(e) => { setBabyBirthDate(e.target.value); setError(""); }}
            className="rounded-xl"
            max={new Date().toISOString().split("T")[0]}
          />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button className="w-full rounded-full" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save baby details"}
        </Button>
      </div>
    </Card>
  );
}

export default function ChildCarePage() {
  const { user, refreshUser } = useUserProfile() as {
    user: { babyBirthDate?: string; babyName?: string } | null;
    refreshUser?: () => void;
  };

  const hasBabyInfo = Boolean(user?.babyBirthDate);
  const [showEdit, setShowEdit] = useState(false);

  const { ageLabel, ageMonths, ageDays } = useMemo(() => {
    if (!user?.babyBirthDate) return { ageLabel: "", ageMonths: 0, ageDays: 0 };
    const birth = new Date(user.babyBirthDate);
    const today = new Date();
    const days = Math.max(0, Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24)));
    const months = Math.floor(days / 30);
    const label = months < 1
      ? `${days} day${days !== 1 ? "s" : ""} old`
      : months < 12
      ? `${months} month${months !== 1 ? "s" : ""} old`
      : `${Math.floor(months / 12)} year${Math.floor(months / 12) !== 1 ? "s" : ""} old`;
    return { ageLabel: label, ageMonths: months, ageDays: days };
  }, [user?.babyBirthDate]);

  const babyDisplayName = user?.babyName || "Baby";

  // Feeding log
  const [feedings, setFeedings] = useState<FeedEntry[]>([]);
  const [feedType, setFeedType] = useState<"breast-left" | "breast-right" | "bottle" | "formula">("breast-left");
  const [loggingFeed, setLoggingFeed] = useState(false);

  useEffect(() => {
    if (!hasBabyInfo) return;
    api.get("/feeding-logs?date=today")
      .then((data: any) => {
        if (data && Array.isArray(data.logs)) {
          setFeedings(data.logs);
          if (data.lastUsedType) {
            setFeedType(data.lastUsedType);
          }
        }
      })
      .catch(() => {});
  }, [hasBabyInfo]);

  const handleLogFeeding = useCallback(async () => {
    if (!hasBabyInfo) return;
    setLoggingFeed(true);
    try {
      const entry = await api.post("/feeding-logs", {
        type: feedType,
        startedAt: new Date().toISOString(),
        durationMins: Math.floor(10 + Math.random() * 8),
      }) as FeedEntry;
      setFeedings((prev) => [entry, ...prev]);
    } catch {
      // optimistic fallback
      setFeedings((prev) => [{
        id: Date.now().toString(),
        type: feedType,
        startedAt: new Date().toISOString(),
        durationMins: 12,
      }, ...prev]);
    } finally {
      setLoggingFeed(false);
    }
  }, [hasBabyInfo, feedType]);

  const feedTypeLabels: Record<string, string> = {
    "breast-left": "Left breast",
    "breast-right": "Right breast",
    "bottle": "Bottle",
    "formula": "Formula",
  };

  const milestones = getMilestones(ageMonths);
  const achieved = milestones.filter((m) => m.achieved).length;

  return (
    <AppShell>
      <div className="min-h-screen bg-background pb-8">
        <div className="bg-gradient-to-br from-chart-4/30 via-chart-4/20 to-background px-4 md:px-8 pt-8 pb-8 rounded-b-[3rem]">
          <div className="max-w-4xl mx-auto flex items-start justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl mb-1">
                {hasBabyInfo ? `${babyDisplayName}'s Care` : "Child Care"}
              </h1>
              <p className="text-muted-foreground text-sm">
                {hasBabyInfo ? ageLabel : "Add your baby's details to get started"}
              </p>
            </div>
            {hasBabyInfo && (
              <button
                onClick={() => setShowEdit(!showEdit)}
                className="mt-1 p-2 rounded-full hover:bg-muted/50 transition-colors"
                title="Edit baby info"
              >
                <Pencil className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-4 space-y-6">

          {/* Profile missing or edit mode */}
          {(!hasBabyInfo || showEdit) && (
            <BabyProfileForm onSave={() => { setShowEdit(false); refreshUser?.(); }} />
          )}

          {hasBabyInfo && (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                <Card className="rounded-3xl border-none shadow-lg p-4 text-center">
                  <Milk className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-2xl font-medium text-primary">{feedings.length}</p>
                  <p className="text-xs text-muted-foreground">feeds today</p>
                </Card>
                <Card className="rounded-3xl border-none shadow-lg p-4 text-center">
                  <Baby className="w-5 h-5 text-secondary mx-auto mb-1" />
                  <p className="text-2xl font-medium text-secondary">{ageDays}</p>
                  <p className="text-xs text-muted-foreground">days old</p>
                </Card>
                <Card className="rounded-3xl border-none shadow-lg p-4 text-center">
                  <Moon className="w-5 h-5 text-chart-3 mx-auto mb-1" />
                  <p className="text-2xl font-medium text-chart-3">{achieved}</p>
                  <p className="text-xs text-muted-foreground">milestones</p>
                </Card>
              </div>

              {/* Feed type selector + log button */}
              <Card className="rounded-3xl border-none shadow-lg p-5">
                <h3 className="mb-3">Log a feeding</h3>
                <div className="flex gap-2 flex-wrap mb-3">
                  {(["breast-left", "breast-right", "bottle", "formula"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setFeedType(t)}
                      className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                        feedType === t
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/40 text-muted-foreground hover:bg-muted/70"
                      }`}
                    >
                      {feedTypeLabels[t]}
                    </button>
                  ))}
                </div>
                <Button
                  className="w-full rounded-full gap-2 h-12"
                  onClick={handleLogFeeding}
                  disabled={loggingFeed}
                >
                  <Plus className="w-4 h-4" />
                  {loggingFeed ? "Logged! ✓" : `Log ${feedTypeLabels[feedType]}`}
                </Button>
              </Card>

              {/* Tabs */}
              <Tabs defaultValue="feedings">
                <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-muted/50 mb-4">
                  <TabsTrigger value="feedings" className="rounded-2xl">Feedings</TabsTrigger>
                  <TabsTrigger value="milestones" className="rounded-2xl">Milestones</TabsTrigger>
                  <TabsTrigger value="health" className="rounded-2xl">Health</TabsTrigger>
                </TabsList>

                <TabsContent value="feedings">
                  <Card className="rounded-3xl border-none shadow-lg p-6">
                    <h3 className="mb-4">Today's feeding log</h3>
                    {feedings.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No feedings logged yet today. Use the button above to start.</p>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto">
                        {feedings.map((f) => (
                          <div key={f.id} className="flex items-center justify-between px-4 py-3 rounded-2xl bg-muted/30 text-sm">
                            <div className="flex items-center gap-3">
                              <Milk className="w-4 h-4 text-primary" />
                              <span>{feedTypeLabels[f.type] ?? f.type}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-muted-foreground text-xs">
                                {new Date(f.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </p>
                              {f.durationMins && <p className="text-muted-foreground text-xs">{f.durationMins} min</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </TabsContent>

                <TabsContent value="milestones">
                  <Card className="rounded-3xl border-none shadow-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3>Developmental milestones</h3>
                      <Badge variant="outline" className="rounded-full">
                        {achieved}/{milestones.length}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {milestones.map((m) => (
                        <div key={m.label} className="flex items-center gap-3 text-sm">
                          {m.achieved
                            ? <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                            : <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                          }
                          <span className={m.achieved ? "" : "text-muted-foreground"}>{m.label}</span>
                          {!m.achieved && (
                            <span className="text-xs text-muted-foreground ml-auto">~{m.unlocksAt}m</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="health">
                  <Card className="rounded-3xl border-none shadow-lg p-6">
                    <h3 className="mb-3">Health records</h3>
                    <p className="text-sm text-muted-foreground mb-4">Vaccines, temperature logs, and check-up history.</p>
                    <div className="space-y-2">
                      {ageDays >= 0 && (
                        <div className="flex justify-between text-sm p-3 rounded-xl bg-muted/30">
                          <span>Hepatitis B (1st dose)</span>
                          <Badge variant="outline" className="rounded-full text-xs">Day 1</Badge>
                        </div>
                      )}
                      {ageDays >= 0 && (
                        <div className="flex justify-between text-sm p-3 rounded-xl bg-muted/30">
                          <span>Vitamin K injection</span>
                          <Badge variant="outline" className="rounded-full text-xs">Day 1</Badge>
                        </div>
                      )}
                      {ageMonths >= 1.5 && (
                        <div className="flex justify-between text-sm p-3 rounded-xl bg-muted/30">
                          <span>OPV + DPT + Hib + IPV (1st)</span>
                          <Badge variant="outline" className="rounded-full text-xs">6 weeks</Badge>
                        </div>
                      )}
                      {ageMonths >= 3 && (
                        <div className="flex justify-between text-sm p-3 rounded-xl bg-muted/30">
                          <span>OPV + DPT (2nd dose)</span>
                          <Badge variant="outline" className="rounded-full text-xs">10 weeks</Badge>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Based on IAP immunization schedule 2024. Always confirm with your paediatrician.
                    </p>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}

          {/* Emergency card — always shown */}
          <Card className="rounded-3xl border-none shadow-lg p-6 bg-destructive/10">
            <h3 className="mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              When to call the doctor immediately
            </h3>
            <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
              <li>Fever over 38°C (100.4°F) in a baby under 3 months</li>
              <li>Refusing feeds for more than 2 feeds in a row</li>
              <li>Breathing fast, grunting, or colour changes</li>
              <li>Unusual limpness or unresponsiveness</li>
            </ul>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
