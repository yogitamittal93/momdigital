"use client";

import { useState, useCallback, useMemo } from "react";
import { Heart, Activity, TrendingUp, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import AppShell from "@/components/layout/app-shell";
import { useUserProfile } from "@/hooks/use-user-profile";
import {
  getPregnancyWeek,
  getDaysUntilDue,
  formatTrimesterLabel,
} from "@/lib/pregnancy";

export default function PregnancyTracker() {
  const { user } = useUserProfile();
  const weekNumber = useMemo(() => {
    if (user?.dueDate) return getPregnancyWeek(user.dueDate);
    return 24;
  }, [user?.dueDate]);
  const daysUntilDue = useMemo(() => {
    if (user?.dueDate) return getDaysUntilDue(user.dueDate);
    return 112;
  }, [user?.dueDate]);
  const kickGoal = 10;

  const [kicks, setKicks] = useState(12);
  const [logging, setLogging] = useState(false);
  const [lastKickTime, setLastKickTime] = useState<string | null>(null);

  const milestones = [
    { week: 20, title: "Anatomy Scan", completed: true, date: "Feb 15, 2026" },
    { week: 24, title: "Glucose Test", completed: false, date: "Mar 28, 2026" },
    { week: 28, title: "Third Trimester Begins", completed: false, date: "Apr 18, 2026" },
  ];

  const handleLogKick = useCallback(() => {
    setLogging(true);
    setKicks((k) => k + 1);
    setLastKickTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    // Simulate brief haptic feedback delay
    setTimeout(() => setLogging(false), 600);
  }, []);

  return (
    <AppShell>
      <div className="min-h-screen bg-background pb-8">
        <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-background px-4 md:px-8 pt-8 pb-8 rounded-b-[3rem]">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl md:text-3xl mb-2">Pregnancy Tracker</h1>
            <p className="text-muted-foreground">
              Week {weekNumber} • {formatTrimesterLabel(weekNumber)}
              {user?.dueDate ? ` • ${daysUntilDue} days until due` : ""}
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-4">
          <Card className="rounded-3xl border-none shadow-lg p-6 mb-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-primary/10 flex-shrink-0">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1643618511639-d3f8eba7f486?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
                  alt="Baby Development"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h2 className="mb-2">Your Baby This Week</h2>
                <p className="text-sm text-muted-foreground">About the size of a corn 🌽</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your baby can now hear sounds and may respond to your voice!
                </p>
              </div>
            </div>
          </Card>

          {/* ── Kick Counter — Interactive ── */}
          <Card className="rounded-3xl border-none shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3>Kick Counter</h3>
              <Heart className="w-6 h-6 text-primary fill-primary" />
            </div>
            <div className="mb-4">
              <div className="flex items-end gap-2 mb-2">
                <span
                  className="text-4xl text-primary transition-all duration-300"
                  style={{ transform: logging ? "scale(1.3)" : "scale(1)" }}
                >
                  {kicks}
                </span>
                <span className="text-muted-foreground mb-2">/ {kickGoal} kicks today</span>
              </div>
              <Progress value={Math.min((kicks / kickGoal) * 100, 100)} className="h-3 mb-2" />
              {kicks >= kickGoal && (
                <p className="text-xs text-primary font-medium">🎉 Daily goal reached!</p>
              )}
              {lastKickTime && (
                <p className="text-xs text-muted-foreground mt-1">Last kick at {lastKickTime}</p>
              )}
            </div>
            <Button
              id="log-kick-btn"
              className="w-full rounded-full bg-primary hover:bg-primary/90 gap-2 active:scale-95 transition-transform"
              onClick={handleLogKick}
              disabled={logging}
            >
              <Plus className="w-4 h-4" />
              {logging ? "Logged! ✓" : "Log a Kick"}
            </Button>
          </Card>

          <Card className="rounded-3xl border-none shadow-lg p-6 mb-6">
            <h3 className="mb-4">Upcoming Milestones</h3>
            <div className="space-y-4">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      milestone.completed
                        ? "bg-primary/20 text-primary"
                        : "bg-muted border-2 border-muted-foreground/30"
                    }`}
                  >
                    {milestone.completed ? (
                      <Activity className="w-5 h-5" />
                    ) : (
                      <span className="text-xs font-bold">{milestone.week}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={milestone.completed ? "line-through text-muted-foreground" : ""}>
                      {milestone.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Week {milestone.week} • {milestone.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Tabs defaultValue="weight" className="mb-6">
            <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-muted/50">
              <TabsTrigger value="weight" className="rounded-2xl">Weight</TabsTrigger>
              <TabsTrigger value="bp" className="rounded-2xl">Blood Pressure</TabsTrigger>
              <TabsTrigger value="mood" className="rounded-2xl">Mood</TabsTrigger>
            </TabsList>
            <TabsContent value="weight" className="mt-4">
              <Card className="rounded-3xl border-none shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3>Weight Tracking</h3>
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
                <div className="space-y-2">
                  {[
                    { week: 20, weight: "132 lbs" },
                    { week: 22, weight: "134 lbs" },
                    { week: 24, weight: "136 lbs" },
                  ].map((entry) => (
                    <div
                      key={entry.week}
                      className="flex justify-between text-sm px-3 py-2 rounded-xl bg-muted/30"
                    >
                      <span className="text-muted-foreground">Week {entry.week}</span>
                      <span className="font-medium">{entry.weight}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
            <TabsContent value="bp" className="mt-4">
              <Card className="rounded-3xl border-none shadow-lg p-6">
                <h3 className="mb-3">Blood Pressure Log</h3>
                <p className="text-sm text-muted-foreground">Last reading: 118/76 mmHg — Normal ✓</p>
              </Card>
            </TabsContent>
            <TabsContent value="mood" className="mt-4">
              <Card className="rounded-3xl border-none shadow-lg p-6">
                <h3 className="mb-3">Mood Tracker</h3>
                <div className="flex gap-3 flex-wrap">
                  {["😊 Happy", "😌 Calm", "😴 Tired", "🤢 Nauseous"].map((mood) => (
                    <button
                      key={mood}
                      className="px-4 py-2 rounded-full bg-muted/40 text-sm hover:bg-primary/20 hover:text-primary transition-colors"
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  );
}
