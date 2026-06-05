"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Milk, Moon, AlertCircle, Plus } from "lucide-react";
import AppShell from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserProfile } from "@/hooks/use-user-profile";
import api from "@/lib/api";

interface FeedEntry {
  id: string;
  type: string;
  startedAt: string;
  durationMins?: number | null;
}

interface SleepEntry {
  id: number;
  date: string;
  hours: number;
}

export default function ChildCarePage() {
  const { user } = useUserProfile();
  const babyLabel = useMemo(() => {
    if (user?.babyBirthDate) {
      const bornDate = new Date(user.babyBirthDate);
      const ageDays = Math.max(
        0,
        Math.ceil((Date.now() - bornDate.getTime()) / (1000 * 60 * 60 * 24)),
      );
      return `Your baby • ${ageDays} days old`;
    }
    return "Add baby details to personalize care";
  }, [user?.babyBirthDate]);
  const hasBabyInfo = Boolean(user?.babyBirthDate);

  const [feedings, setFeedings] = useState<FeedEntry[]>([]);
  const [sleepLog] = useState<SleepEntry[]>([
    { id: 1, date: "Today", hours: 12 },
    { id: 2, date: "Yesterday", hours: 11.5 },
  ]);
  const [loggingFeed, setLoggingFeed] = useState(false);
  const [feedingType, setFeedingType] = useState("breast-left");

  const loadFeedings = useCallback(async () => {
    try {
      const { data } = await api.get<{ logs?: FeedEntry[] }>("/feeding-logs?date=today");
      const nextFeedings = Array.isArray(data?.logs) ? data.logs : [];
      setFeedings(nextFeedings);
      if (nextFeedings[0]?.type) {
        setFeedingType(nextFeedings[0].type);
      }
    } catch {
      setFeedings([]);
    }
  }, []);

  useEffect(() => {
    loadFeedings();
  }, [loadFeedings]);

  const handleLogFeeding = useCallback(async () => {
    if (!hasBabyInfo) return;

    setLoggingFeed(true);

    try {
      await api.post("/feeding-logs", {
        type: feedingType,
        startedAt: new Date().toISOString(),
        durationMins: 15,
      });
      await loadFeedings();
    } finally {
      setLoggingFeed(false);
    }
  }, [feedingType, hasBabyInfo, loadFeedings]);

  const feedingTypeLabel = useMemo(
    () => ({
      "breast-left": "Left breast",
      "breast-right": "Right breast",
      bottle: "Bottle",
      formula: "Formula",
    }),
    [],
  );

  return (
    <AppShell>
      <div className="min-h-screen bg-background pb-8">
        <div className="bg-gradient-to-br from-chart-4/30 via-chart-4/20 to-background px-4 md:px-8 pt-8 pb-8 rounded-b-[3rem]">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl md:text-3xl mb-2">Child Care</h1>
            <p className="text-muted-foreground">{babyLabel}</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-4">
          {/* Stats row */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="rounded-3xl border-none shadow-lg p-5">
              <div className="flex items-center gap-2 mb-2">
                <Milk className="w-5 h-5 text-primary" />
                <p className="text-sm text-muted-foreground">Feedings Today</p>
              </div>
              <p className="text-3xl font-bold text-primary">{feedings.length}</p>
            </Card>
            <Card className="rounded-3xl border-none shadow-lg p-5">
              <div className="flex items-center gap-2 mb-2">
                <Moon className="w-5 h-5 text-secondary" />
                <p className="text-sm text-muted-foreground">Sleep (hrs)</p>
              </div>
              <p className="text-3xl font-bold text-secondary">{sleepLog[0].hours}</p>
            </Card>
          </div>

          {hasBabyInfo ? (
            <div className="mb-6 rounded-3xl border border-muted/40 bg-card p-4 shadow-sm">
              <label htmlFor="feeding-type" className="mb-2 block text-sm font-medium">Feeding type</label>
              <select
                id="feeding-type"
                value={feedingType}
                onChange={(event) => setFeedingType(event.target.value)}
                className="w-full rounded-2xl border border-muted/60 bg-background px-4 py-3 text-sm shadow-sm outline-none transition focus:border-primary"
              >
                <option value="breast-left">Left breast</option>
                <option value="breast-right">Right breast</option>
                <option value="bottle">Bottle</option>
                <option value="formula">Formula</option>
              </select>
            </div>
          ) : null}

          {/* Log feeding button */}
          <Button
            id="log-feeding-btn"
            className="w-full mb-6 rounded-full bg-primary hover:bg-primary/90 gap-2 h-14 shadow-lg active:scale-95 transition-transform text-base"
            onClick={handleLogFeeding}
            disabled={loggingFeed || !hasBabyInfo}
          >
            <Plus className="w-5 h-5" />
            {hasBabyInfo ? (loggingFeed ? "Logged! ✓" : "Log a Feeding") : "Complete profile first"}
          </Button>
          {!hasBabyInfo ? (
            <Card className="rounded-3xl border-none shadow-lg p-6 border-dashed border-muted/40 bg-muted/5 mb-6">
              <h3 className="mb-2">Baby care will personalize once your profile is complete</h3>
              <p className="text-sm text-muted-foreground">
                Add your baby&apos;s birth date and share your first care notes with the AI to unlock tailored feeding and sleep guidance.
              </p>
            </Card>
          ) : null}

          <Tabs defaultValue="feedings" className="mb-6">
            <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-muted/50 mb-6">
              <TabsTrigger value="feedings" className="rounded-2xl">Feedings</TabsTrigger>
              <TabsTrigger value="health" className="rounded-2xl">Health</TabsTrigger>
              <TabsTrigger value="milestones" className="rounded-2xl">Milestones</TabsTrigger>
            </TabsList>

            <TabsContent value="feedings">
              <Card className="rounded-3xl border-none shadow-lg p-6">
                <h3 className="mb-4">Today&apos;s Feeding Log</h3>
                {hasBabyInfo ? (
                  <div className="space-y-3 max-h-72 overflow-y-auto">
                    {feedings.map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center justify-between px-4 py-3 rounded-2xl bg-muted/30 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <Milk className="w-4 h-4 text-primary" />
                          <span>
                            {new Date(f.startedAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="text-muted-foreground">
                            {feedingTypeLabel[f.type as keyof typeof feedingTypeLabel] ?? f.type}
                          </span>
                        </div>
                        <span className="text-muted-foreground">{f.durationMins ?? 15} min</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-muted/40 p-6 text-sm text-muted-foreground bg-muted/5">
                    Add your baby&apos;s birth date and share your first feeding note with the AI to see a personalized log.
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="health">
              <Card className="rounded-3xl border-none shadow-lg p-6">
                <h3 className="mb-3">Health Records</h3>
                <p className="text-sm text-muted-foreground">Vaccines, temperature logs, and pediatric history.</p>
                <div className="mt-4 space-y-2">
                  {[
                    { name: "Hepatitis B (1st dose)", date: "Day 1" },
                    { name: "Vitamin K shot", date: "Day 1" },
                  ].map((v) => (
                    <div key={v.name} className="flex justify-between text-sm p-3 rounded-xl bg-muted/30">
                      <span>{v.name}</span>
                      <span className="text-muted-foreground">{v.date}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="milestones">
              <Card className="rounded-3xl border-none shadow-lg p-6">
                <h3 className="mb-3">Developmental Milestones</h3>
                <div className="space-y-3">
                  {[
                    { label: "Follows faces with eyes", achieved: true },
                    { label: "Reacts to loud sounds", achieved: true },
                    { label: "First social smile", achieved: false },
                    { label: "Holds head up briefly", achieved: false },
                  ].map((m) => (
                    <div key={m.label} className="flex items-center gap-3 text-sm">
                      <div
                        className={`w-5 h-5 rounded-full flex-shrink-0 ${
                          m.achieved ? "bg-primary" : "bg-muted border-2 border-muted-foreground/30"
                        }`}
                      />
                      <span className={m.achieved ? "" : "text-muted-foreground"}>{m.label}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="rounded-3xl border-none shadow-lg p-6 bg-destructive/10">
            <h3 className="mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              When to call the doctor
            </h3>
            <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
              <li>Fever over 100.4°F (38°C)</li>
              <li>Refusing feeds repeatedly</li>
              <li>Breathing difficulties or colour changes</li>
            </ul>
            <Button variant="outline" className="mt-4 rounded-full">
              Emergency Contacts
            </Button>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
