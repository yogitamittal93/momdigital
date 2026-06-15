"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Heart, Activity, TrendingUp, Plus, ShieldAlert } from "lucide-react";
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
import { api } from "@/lib/api-client";

function classifyBP(sys: number, dia: number) {
  if (sys > 180 || dia > 120) return { label: "Crisis", color: "text-destructive bg-destructive/10 border-destructive/20" };
  if (sys >= 140 || dia >= 90) return { label: "Hypertension Stage 2", color: "text-red-500 bg-red-500/10 border-red-500/20" };
  if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) return { label: "Hypertension Stage 1", color: "text-orange-500 bg-orange-500/10 border-orange-500/20" };
  if (sys >= 120 && sys <= 129 && dia < 80) return { label: "Elevated", color: "text-yellow-600 bg-yellow-600/10 border-yellow-600/20" };
  return { label: "Normal", color: "text-green-600 bg-green-600/10 border-green-600/20" };
}

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
  const dueDateLabel = user?.dueDate ? new Date(user.dueDate).toLocaleDateString() : null;
  const kickGoal = 10;

  const [kicks, setKicks] = useState(0);
  const [logging, setLogging] = useState(false);
  const [lastKickTime, setLastKickTime] = useState<string | null>(null);

  const [completedMilestones, setCompletedMilestones] = useState<{ week: number; title: string }[]>([]);
  const [togglingMilestone, setTogglingMilestone] = useState<string | null>(null);

  interface BloodPressureLog {
    id: string;
    systolic: number;
    diastolic: number;
    pulse?: number | null;
    loggedAt: string;
  }

  interface WeightLog {
    id: string;
    weight: number;
    loggedAt: string;
  }

  const [bpLogs, setBpLogs] = useState<BloodPressureLog[]>([]);
  const [sysInput, setSysInput] = useState("");
  const [diaInput, setDiaInput] = useState("");
  const [pulseInput, setPulseInput] = useState("");
  const [loggingBp, setLoggingBp] = useState(false);
  const [bpError, setBpError] = useState("");

  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [weightInput, setWeightInput] = useState("");
  const [loggingWeight, setLoggingWeight] = useState(false);
  const [activeMood, setActiveMood] = useState<string | null>(null);

  // Fetch completed milestones, blood pressure, weight, mood, and kicks logs
  useEffect(() => {
    if (!user) return;
    api.get("/pregnancy-milestones")
      .then((data) => {
        const d = data as { week: number; title: string }[];
        if (d && Array.isArray(d)) setCompletedMilestones(d);
      })
      .catch(() => {});

    api.get("/blood-pressure")
      .then((data) => {
        const d = data as BloodPressureLog[];
        if (d && Array.isArray(d)) setBpLogs(d);
      })
      .catch(() => {});

    api.get("/weight-logs")
      .then((data) => {
        const d = data as WeightLog[];
        if (d && Array.isArray(d)) setWeightLogs(d);
      })
      .catch(() => {});

    api.get("/mood-logs/today")
      .then((data) => {
        const d = data as { mood?: string };
        if (d && d.mood) setActiveMood(d.mood);
      })
      .catch(() => {});

    const todayStr = new Date().toISOString().slice(0, 10);
    api.get(`/kick-logs?date=${todayStr}`)
      .then((data) => {
        const d = data as { count?: number; loggedAt?: string };
        if (d && typeof d.count === 'number') {
          setKicks(d.count);
          if (d.loggedAt) {
            setLastKickTime(new Date(d.loggedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
          }
        } else {
          setKicks(0);
        }
      })
      .catch(() => setKicks(0));
  }, [user]);

  const handleToggleMilestone = useCallback(async (week: number, title: string) => {
    if (!user) return;
    const key = `${week}-${title}`;
    setTogglingMilestone(key);
    try {
      const res = await api.post("/pregnancy-milestones/toggle", { week, title }) as { completed: boolean };
      setCompletedMilestones((prev) => {
        if (res.completed) {
          return [...prev, { week, title }];
        } else {
          return prev.filter((cm) => !(cm.week === week && cm.title === title));
        }
      });
    } catch {
      // ignore
    } finally {
      setTogglingMilestone(null);
    }
  }, [user]);

  const milestones = useMemo(() => {
    const defaultMilestones = [
      { week: 20, title: "Anatomy Scan" },
      { week: 24, title: "Glucose Test" },
      { week: 28, title: "Third Trimester Begins" },
    ];
    return defaultMilestones.map((m) => {
      const isCompleted = completedMilestones.some(
        (cm) => cm.week === m.week && cm.title === m.title
      );
      
      let milestoneDateStr = "Date not set";
      if (user?.dueDate) {
        const due = new Date(user.dueDate);
        const conception = new Date(due);
        conception.setDate(conception.getDate() - 280);
        const msDate = new Date(conception);
        msDate.setDate(msDate.getDate() + m.week * 7);
        milestoneDateStr = msDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      } else {
        if (m.week === 20) milestoneDateStr = "Feb 15, 2026";
        else if (m.week === 24) milestoneDateStr = "Mar 28, 2026";
        else if (m.week === 28) milestoneDateStr = "Apr 18, 2026";
      }

      return {
        ...m,
        completed: isCompleted,
        date: milestoneDateStr,
      };
    });
  }, [completedMilestones, user?.dueDate]);

  const handleLogBp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const sys = parseInt(sysInput, 10);
    const dia = parseInt(diaInput, 10);
    const pulse = pulseInput ? parseInt(pulseInput, 10) : undefined;

    if (isNaN(sys) || sys < 50 || sys > 250) {
      setBpError("Please enter a valid Systolic value (50-250 mmHg)");
      return;
    }
    if (isNaN(dia) || dia < 30 || dia > 180) {
      setBpError("Please enter a valid Diastolic value (30-180 mmHg)");
      return;
    }
    if (pulse !== undefined && (isNaN(pulse) || pulse < 30 || pulse > 200)) {
      setBpError("Please enter a valid Pulse value (30-200 bpm)");
      return;
    }

    setBpError("");
    setLoggingBp(true);
    try {
      const newLog = (await api.post("/blood-pressure", {
        systolic: sys,
        diastolic: dia,
        pulse,
      })) as BloodPressureLog;
      setBpLogs((prev) => [newLog, ...prev]);
      setSysInput("");
      setDiaInput("");
      setPulseInput("");
    } catch (err: unknown) {
      setBpError(err instanceof Error ? err.message : "Failed to log blood pressure");
    } finally {
      setLoggingBp(false);
    }
  }, [sysInput, diaInput, pulseInput, user]);

  const handleLogKick = useCallback(async () => {
    if (!user) return;
    setLogging(true);
    const nextKicks = kicks + 1;
    setKicks(nextKicks);
    const now = new Date();
    setLastKickTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    
    try {
      await api.post("/kick-logs", {
        count: nextKicks,
        date: now.toISOString().slice(0, 10),
      });
    } catch {
      // fallback
    } finally {
      setLogging(false);
    }
  }, [user, kicks]);

  const handleLogWeight = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const wt = parseFloat(weightInput);
    if (isNaN(wt) || wt < 30 || wt > 200) return;
    
    setLoggingWeight(true);
    try {
      const newLog = (await api.post("/weight-logs", { weight: wt })) as WeightLog;
      setWeightLogs((prev) => [newLog, ...prev]);
      setWeightInput("");
    } catch {
      // ignore
    } finally {
      setLoggingWeight(false);
    }
  }, [weightInput, user]);

  const handleSelectMood = useCallback(async (mood: string) => {
    if (!user) return;
    setActiveMood(mood);
    try {
      await api.post("/mood-logs", { mood });
    } catch {
      // silent fallback
    }
  }, [user]);

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
                  {user?.dueDate
                    ? `Due date is ${dueDateLabel}. ${daysUntilDue} days until your little one arrives.`
                    : "Update your due date to get a pregnancy plan that matches your stage."}
                </p>
              </div>
            </div>
          </Card>

          <Card className="rounded-3xl border-none shadow-lg p-6 mb-6 border-dashed border-muted/40 bg-muted/5">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="mb-1">Craving & mood log</h3>
                <p className="text-sm text-muted-foreground">
                  {user?.dueDate
                    ? "Share what you’re craving and feeling with the AI assistant to save it here."
                    : "This section fills in once your due date is added and your preferences are captured."}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">Personalized soon</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-dashed border-muted/40 p-4">
                <p className="text-sm font-medium mb-2">Latest craving</p>
                <p className="text-sm text-muted-foreground">
                  No cravings logged yet. Share your preferences with the AI assistant to save them here.
                </p>
              </div>
              <div className="rounded-3xl border border-dashed border-muted/40 p-4">
                <p className="text-sm font-medium mb-2">Mood note</p>
                <p className="text-sm text-muted-foreground">
                  No mood notes yet. Add a note or tell the AI how you’re feeling to fill this space.
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
            <div className="space-y-2">
              {milestones.map((milestone, index) => {
                const isToggling = togglingMilestone === `${milestone.week}-${milestone.title}`;
                return (
                  <button
                    key={index}
                    onClick={() => handleToggleMilestone(milestone.week, milestone.title)}
                    disabled={isToggling}
                    className="w-full flex items-start gap-4 p-2.5 rounded-2xl text-left hover:bg-muted/30 transition-colors cursor-pointer select-none"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
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
                      <p className={`text-sm font-medium ${milestone.completed ? "line-through text-muted-foreground" : ""}`}>
                        {milestone.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Week {milestone.week} • {milestone.date}
                      </p>
                    </div>
                  </button>
                );
              })}
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

                <form onSubmit={handleLogWeight} className="space-y-4 mb-6 p-4 rounded-2xl bg-muted/20 border border-muted/10">
                  <h4 className="text-sm font-semibold mb-2">Log New Weight</h4>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Weight (e.g. 62.5 kg or 135 lbs)"
                        value={weightInput}
                        onChange={(e) => setWeightInput(e.target.value)}
                        className="w-full text-sm bg-background border border-muted/20 rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={loggingWeight}
                      className="rounded-full bg-primary hover:bg-primary/90 text-sm px-6"
                    >
                      {loggingWeight ? "Logging..." : "Log Weight"}
                    </Button>
                  </div>
                </form>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {weightLogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No weights logged yet.</p>
                  ) : (
                    weightLogs.map((log) => {
                      let weekLabel = "Logged";
                      if (user?.dueDate) {
                        const due = new Date(user.dueDate);
                        const con = new Date(due);
                        con.setDate(con.getDate() - 280);
                        const diffMs = new Date(log.loggedAt).getTime() - con.getTime();
                        const wk = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
                        if (wk >= 0 && wk <= 42) {
                          weekLabel = `Week ${wk}`;
                        }
                      }
                      return (
                        <div
                          key={log.id}
                          className="flex justify-between text-sm px-4 py-2.5 rounded-2xl bg-muted/30 border border-muted/10"
                        >
                          <span className="text-muted-foreground">
                            {weekLabel} · {new Date(log.loggedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                          </span>
                          <span className="font-semibold">{log.weight}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            </TabsContent>
            <TabsContent value="bp" className="mt-4">
              <Card className="rounded-3xl border-none shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="mb-1">Blood Pressure Log</h3>
                    {bpLogs.length > 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Last reading: {bpLogs[0].systolic}/{bpLogs[0].diastolic} mmHg 
                        {bpLogs[0].pulse ? ` • Pulse: ${bpLogs[0].pulse} bpm` : ""}
                        <span className={`inline-block ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium border ${classifyBP(bpLogs[0].systolic, bpLogs[0].diastolic).color}`}>
                          {classifyBP(bpLogs[0].systolic, bpLogs[0].diastolic).label}
                        </span>
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">No readings logged yet.</p>
                    )}
                  </div>
                  <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                </div>

                <form onSubmit={handleLogBp} className="space-y-4 mb-6 p-4 rounded-2xl bg-muted/20 border border-muted/10">
                  <h4 className="text-sm font-semibold mb-2">Log New Reading</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                        Systolic (sys)
                      </label>
                      <input
                        type="number"
                        placeholder="120"
                        value={sysInput}
                        onChange={(e) => setSysInput(e.target.value)}
                        className="w-full text-sm bg-background border border-muted/20 rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                        Diastolic (dia)
                      </label>
                      <input
                        type="number"
                        placeholder="80"
                        value={diaInput}
                        onChange={(e) => setDiaInput(e.target.value)}
                        className="w-full text-sm bg-background border border-muted/20 rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block mb-1">
                        Pulse (optional)
                      </label>
                      <input
                        type="number"
                        placeholder="72"
                        value={pulseInput}
                        onChange={(e) => setPulseInput(e.target.value)}
                        className="w-full text-sm bg-background border border-muted/20 rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {bpError && (
                    <div className="flex items-center gap-2 text-xs text-destructive mt-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>{bpError}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loggingBp}
                    className="w-full rounded-full bg-primary hover:bg-primary/90 text-sm py-2"
                  >
                    {loggingBp ? "Logging..." : "Log Blood Pressure"}
                  </Button>
                </form>

                {bpLogs.length > 0 && (
                  <div className="space-y-2 mt-4 max-h-60 overflow-y-auto pr-1">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Recent Readings
                    </h4>
                    {bpLogs.map((log) => {
                      const classification = classifyBP(log.systolic, log.diastolic);
                      return (
                        <div
                          key={log.id}
                          className="flex justify-between items-center text-sm px-4 py-2.5 rounded-2xl bg-muted/30 border border-muted/10"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-foreground">
                              {log.systolic}/{log.diastolic}
                            </span>
                            <span className="text-xs text-muted-foreground">mmHg</span>
                            {log.pulse && (
                              <span className="text-xs text-muted-foreground font-medium bg-muted/60 px-1.5 py-0.5 rounded">
                                ♥ {log.pulse} bpm
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${classification.color}`}>
                              {classification.label}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-medium">
                              {new Date(log.loggedAt).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </TabsContent>
            <TabsContent value="mood" className="mt-4">
              <Card className="rounded-3xl border-none shadow-lg p-6">
                <h3 className="mb-3">Mood Tracker</h3>
                <div className="flex gap-3 flex-wrap">
                  {["😊 Happy", "😌 Calm", "😴 Tired", "🤢 Nauseous"].map((mood) => {
                    const isActive = activeMood === mood;
                    return (
                      <button
                        key={mood}
                        onClick={() => handleSelectMood(mood)}
                        className={`px-4 py-2 rounded-full text-sm transition-all duration-250 border
                          ${isActive
                            ? "bg-primary text-primary-foreground border-primary scale-105 font-medium shadow"
                            : "bg-muted/40 text-foreground border-transparent hover:bg-primary/20 hover:text-primary hover:border-primary/40"
                          }`}
                      >
                        {mood}
                      </button>
                    );
                  })}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  );
}
