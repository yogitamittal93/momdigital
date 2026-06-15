"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { CheckCircle2, Heart, Moon, Sparkles } from "lucide-react";
import AppShell from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useUserProfile } from "@/hooks/use-user-profile";
import { api } from "@/lib/api-client";

function currentMonthParam() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function buildCalendarGrid(month: string) {
  const [y, m] = month.split("-").map(Number);
  const days: string[] = [];
  const total = new Date(y, m, 0).getDate();
  for (let d = 1; d <= total; d++) {
    days.push(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  return days;
}

function CalendarHeatmap({
  month,
  calendarDays,
}: {
  month: string;
  calendarDays: Record<string, string[]>;
}) {
  const days = buildCalendarGrid(month);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-2">
        {new Date(`${month}-01`).toLocaleString("default", {
          month: "long",
          year: "numeric",
        })}
      </p>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: "repeat(7, 1fr)" }}
      >
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <p key={i} className="text-[10px] text-muted-foreground text-center">
            {d}
          </p>
        ))}
        {Array.from({
          length: new Date(`${month}-01`).getDay(),
        }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map((day) => {
          const count = calendarDays[day]?.length ?? 0;
          const isToday = day === today;
          const isPast = day < today;
          return (
            <div
              key={day}
              title={count > 0 ? `${count} task${count > 1 ? "s" : ""}` : day}
              className={`aspect-square rounded flex items-center justify-center text-[10px] border
                ${count >= 5 ? "bg-accent text-accent-foreground border-accent" :
                  count >= 3 ? "bg-accent/60 text-accent-foreground border-accent/60" :
                  count >= 1 ? "bg-accent/30 text-foreground border-accent/30" :
                  isPast ? "bg-muted/30 border-muted/20 text-muted-foreground" :
                  "bg-transparent border-muted/20"}
                ${isToday ? "ring-2 ring-accent ring-offset-1" : ""}
              `}
            >
              {new Date(`${day}T12:00:00`).getDate()}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-3">
        <p className="text-xs text-muted-foreground">Less</p>
        {[0, 1, 3, 5].map((n) => (
          <div
            key={n}
            className={`w-3 h-3 rounded ${
              n === 0 ? "bg-muted/30 border border-muted/20" :
              n === 1 ? "bg-accent/30 border border-accent/30" :
              n === 3 ? "bg-accent/60" : "bg-accent"
            }`}
          />
        ))}
        <p className="text-xs text-muted-foreground">More</p>
      </div>
    </div>
  );
}

interface ChecklistItem {
  id: number;
  task: string;
  completed: boolean;
}

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: 1, task: "Take prenatal vitamins", completed: false },
  { id: 2, task: "Pelvic floor exercises (Kegels)", completed: false },
  { id: 3, task: "15-minute walk", completed: false },
  { id: 4, task: "Drink 8 glasses of water", completed: false },
  { id: 5, task: "Rest when baby rests", completed: false },
];

function getWeeksSinceBirth(babyBirthDate: string): number {
  const birth = new Date(babyBirthDate);
  const today = new Date();
  const diffMs = today.getTime() - birth.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7)));
}

export default function PostpartumPage() {
  const { user } = useUserProfile();

  const [checklist, setChecklist] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST);
  const [calendarDays, setCalendarDays] = useState<Record<string, string[]>>({});
  const [loadingCalendar, setLoadingCalendar] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const month = currentMonthParam();
  const today = new Date().toISOString().slice(0, 10);

  // Fetch checklist logs for this month
  useEffect(() => {
    if (!user) return;
    setLoadingCalendar(true);
    api.get(`/wellness-logs?month=${month}`)
      .then((data) => {
        const d = data as { calendarDays?: Record<string, string[]> };
        const calDays = d.calendarDays ?? {};
        setCalendarDays(calDays);

        const todayCompleted = calDays[today] ?? [];
        setChecklist((prev) =>
          prev.map((item) => ({
            ...item,
            completed: todayCompleted.includes(String(item.id)),
          }))
        );
      })
      .catch(() => {})
      .finally(() => setLoadingCalendar(false));
  }, [user, month, today]);

  const toggleItem = useCallback(async (id: number) => {
    if (!user) return;
    setTogglingId(id);
    try {
      const res = await api.post("/wellness-logs/toggle", { taskId: String(id), date: today }) as { completed: boolean };
      
      setChecklist((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, completed: res.completed } : item
        )
      );

      setCalendarDays((prev) => {
        const currentCompleted = prev[today] ?? [];
        let newCompleted = [...currentCompleted];
        if (res.completed) {
          if (!newCompleted.includes(String(id))) {
            newCompleted.push(String(id));
          }
        } else {
          newCompleted = newCompleted.filter((taskId) => taskId !== String(id));
        }
        return {
          ...prev,
          [today]: newCompleted,
        };
      });
    } catch {
      // ignore
    } finally {
      setTogglingId(null);
    }
  }, [user, today]);

  const completedCount = checklist.filter((item) => item.completed).length;
  const progressPct = Math.round((completedCount / checklist.length) * 100);

  const { weekLabel, weeksLabel } = useMemo(() => {
    if (!user?.babyBirthDate) return { weekLabel: "Postpartum Recovery", weeksLabel: "" };
    const weeks = getWeeksSinceBirth(user.babyBirthDate);
    const phase =
      weeks < 2
        ? "Gentle beginning"
        : weeks < 6
        ? "Building foundation"
        : "Active recovery";
    return {
      weekLabel: `Week ${weeks} · ${phase}`,
      weeksLabel: `${weeks} week${weeks !== 1 ? "s" : ""} postpartum`,
    };
  }, [user?.babyBirthDate]);

  return (
    <AppShell>
      <div className="min-h-screen bg-background pb-8">
        <div className="bg-gradient-to-br from-accent/30 via-accent/20 to-background px-4 md:px-8 pt-8 pb-8 rounded-b-[3rem]">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl md:text-3xl mb-2">Postpartum Recovery</h1>
            <p className="text-muted-foreground">Supporting your healing journey</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-4 space-y-6">
          {/* Recovery progress */}
          <Card className="rounded-3xl border-none shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-accent-foreground" />
              <div>
                <h3 className="mb-1">Recovery Progress</h3>
                <p className="text-sm text-muted-foreground">
                  {weeksLabel || weekLabel}
                </p>
              </div>
            </div>
            <Progress value={progressPct} className="h-3 mb-2" />
            <p className="text-xs text-muted-foreground text-right">
              {completedCount}/{checklist.length} tasks today
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              You&apos;re doing great. Be gentle with yourself.
            </p>
          </Card>

          {/* Wellness checklist */}
          <Card className="rounded-3xl border-none shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3>Today&apos;s Wellness Checklist</h3>
              <span className="text-sm text-muted-foreground font-medium">
                {completedCount}/{checklist.length}
              </span>
            </div>
            <div className="space-y-3">
              {checklist.map((item) => {
                const isToggling = togglingId === item.id;
                return (
                  <button
                    key={item.id}
                    id={`checklist-item-${item.id}`}
                    onClick={() => toggleItem(item.id)}
                    disabled={isToggling}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all duration-200 cursor-pointer select-none
                      ${item.completed
                        ? "bg-accent/20 hover:bg-accent/30"
                        : "bg-muted/30 hover:bg-muted/50"
                      } ${isToggling ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200
                        ${item.completed
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted border-2 border-muted-foreground/30"
                        }`}
                    >
                      {item.completed && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                    <span
                      className={`text-sm transition-colors duration-200 ${
                        item.completed ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {item.task}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Mental health */}
          <Card className="rounded-3xl border-none shadow-lg p-6 bg-gradient-to-br from-secondary/10 to-secondary/5">
            <div className="flex items-start gap-4">
              <Heart className="w-6 h-6 text-secondary fill-secondary mt-1" />
              <div className="flex-1">
                <h3 className="mb-2">Mental Health Support</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Feeling overwhelmed is normal. Talk to someone whenever needed.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="rounded-full border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
                  >
                    Talk to Counselor
                  </Button>
                  <Button variant="ghost" className="rounded-full text-secondary">
                    Resources
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Sleep & energy */}
          <Card className="rounded-3xl border-none shadow-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <Moon className="w-5 h-5 text-primary" />
              <h3>Sleep &amp; Energy</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Track mood and energy levels daily to identify recovery patterns.
            </p>
          </Card>

          {/* Calendar Heatmap */}
          {user && (
            <Card className="rounded-3xl border-none shadow-lg p-6">
              <h3 className="mb-4">Wellness Activity this month</h3>
              {loadingCalendar ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : (
                <CalendarHeatmap month={month} calendarDays={calendarDays} />
              )}
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
