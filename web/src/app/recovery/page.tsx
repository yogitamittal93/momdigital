"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Flame, ListChecks, Sparkles } from "lucide-react";
import AppShell from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useHabits } from "@/hooks/use-habits";
import { api } from "@/lib/api-client";
import {
  getExercises,
  getWeeksSinceBirth,
  type Exercise,
} from "@/lib/exercises";
import { HabitSetupModal } from "@/components/habits/habit-setup-modal";
import { DailyHabitChecklist } from "@/components/habits/daily-habit-checklist";
import { HabitCalendar } from "@/components/habits/habit-calendar";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ExerciseLog {
  id: string;
  exerciseId: string;
  completedAt: string;
}

interface MonthResponse {
  logs: ExerciseLog[];
  calendarDays: Record<string, string[]>; // "YYYY-MM-DD" → exerciseIds[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}

function currentMonthParam() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function buildCalendarGrid(month: string) {
  // Returns array of ISO date strings "YYYY-MM-DD" for every day in the month
  const [y, m] = month.split("-").map(Number);
  const days: string[] = [];
  const total = new Date(y, m, 0).getDate();
  for (let d = 1; d <= total; d++) {
    days.push(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  return days;
}

// ── Ring progress SVG ─────────────────────────────────────────────────────────

function RingProgress({
  value,
  size = 64,
  label,
}: {
  value: number;
  size?: number;
  label?: string;
}) {
  const r = (size - 10) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={6}
          className="stroke-muted"
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={6}
          stroke="hsl(var(--primary))"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease", transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          fontSize={size * 0.22}
          className="fill-foreground"
          style={{ fontWeight: 500 }}
        >
          {Math.round(value)}%
        </text>
      </svg>
      {label && <p className="text-xs text-muted-foreground text-center">{label}</p>}
    </div>
  );
}

// ── Calendar heatmap ──────────────────────────────────────────────────────────

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
        {/* Empty cells to align the first day of the month */}
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
              title={count > 0 ? `${count} exercise${count > 1 ? "s" : ""}` : day}
              className={`aspect-square rounded flex items-center justify-center text-[10px] border
                ${count >= 3 ? "bg-primary text-primary-foreground border-primary" :
                  count === 2 ? "bg-primary/60 text-primary-foreground border-primary/60" :
                  count === 1 ? "bg-primary/30 text-foreground border-primary/30" :
                  isPast ? "bg-muted/30 border-muted/20 text-muted-foreground" :
                  "bg-transparent border-muted/20"}
                ${isToday ? "ring-2 ring-primary ring-offset-1" : ""}
              `}
            >
              {new Date(`${day}T12:00:00`).getDate()}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-3">
        <p className="text-xs text-muted-foreground">Less</p>
        {[0, 1, 2, 3].map((n) => (
          <div
            key={n}
            className={`w-3 h-3 rounded ${
              n === 0 ? "bg-muted/30 border border-muted/20" :
              n === 1 ? "bg-primary/30 border border-primary/30" :
              n === 2 ? "bg-primary/60" : "bg-primary"
            }`}
          />
        ))}
        <p className="text-xs text-muted-foreground">More</p>
      </div>
    </div>
  );
}

// ── Exercise card ─────────────────────────────────────────────────────────────

function ExerciseCard({
  exercise,
  completedToday,
  onComplete,
  saving,
}: {
  exercise: Exercise;
  completedToday: boolean;
  onComplete: (ex: Exercise) => void;
  saving: boolean;
}) {
  return (
    <Card className="rounded-3xl border-none shadow-lg p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 pr-4">
          <h3 className="mb-1">{exercise.name}</h3>
          <p className="text-sm text-muted-foreground mb-2">
            {exercise.description}
          </p>
          <p className="text-xs text-muted-foreground">
            {exercise.duration} · {exercise.sets}
          </p>
        </div>
        <Badge variant="outline" className="rounded-full flex-shrink-0">
          {exercise.intensity}
        </Badge>
      </div>
      <Button
        className={`rounded-full mt-2 transition-all ${
          completedToday
            ? "bg-primary/20 text-primary hover:bg-primary/20 cursor-default"
            : ""
        }`}
        disabled={completedToday || saving}
        onClick={() => onComplete(exercise)}
      >
        <CheckCircle2 className="w-4 h-4 mr-2" />
        {completedToday ? "Completed today ✓" : saving ? "Saving…" : "Mark complete"}
      </Button>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BodyRecoveryPage() {
  const { user } = useUserProfile();
  const [
    habitSetupOpen,
    setHabitSetupOpen,
  ] = useState(false);

  const {
    habits,
    todaySummary,
    loading: habitsLoading,
    saving: habitSaving,
    actionError: habitActionError,
    toggleHabit,
    createHabit,
    deleteHabit,
  } = useHabits();

  const isPostpartum = Boolean(user?.babyBirthDate);
  const weeksSinceBirth = user?.babyBirthDate
    ? getWeeksSinceBirth(user.babyBirthDate)
    : 0;

  const exercises = useMemo(
    () =>
      user
        ? getExercises({
            isPostpartum,
            weeksSinceBirth,
            deliveryType: (user as { deliveryType?: string }).deliveryType ?? null,
          })
        : [],
    [user, isPostpartum, weeksSinceBirth],
  );

  // ── Calendar / log state ──────────────────────────────────────────────────
  const [calendarDays, setCalendarDays] = useState<Record<string, string[]>>(
    {},
  );
  const [streak, setStreak] = useState<number>(0);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loadingCalendar, setLoadingCalendar] = useState(true);

  const month = currentMonthParam();
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get(`/exercise-logs?month=${month}`) as Promise<MonthResponse>,
      api.get("/exercise-logs/streak") as Promise<{ streak: number }>,
    ])
      .then(([monthData, streakData]) => {
        setCalendarDays(monthData.calendarDays ?? {});
        setStreak(streakData.streak ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoadingCalendar(false));
  }, [user, month]);

  const handleComplete = useCallback(
    async (exercise: Exercise) => {
      if (!user) return;
      setSavingId(exercise.id);
      try {
        await api.post("/exercise-logs", {
          exerciseId: exercise.id,
          phase: isPostpartum ? "postpartum" : "pregnancy",
        });
        setCalendarDays((prev) => ({
          ...prev,
          [today]: [...(prev[today] ?? []), exercise.id],
        }));
        setStreak((s) => {
          // If today already had activity, streak stays the same
          const hadToday = Boolean(calendarDays[today]?.length);
          return hadToday ? s : s + 1;
        });
      } catch {
        // Silently fail — user can retry
      } finally {
        setSavingId(null);
      }
    },
    [user, isPostpartum, today, calendarDays],
  );

  // ── Derived stats ─────────────────────────────────────────────────────────
  const completedTodayIds = new Set(calendarDays[today] ?? []);
  const completedTodayCount = exercises.filter((ex) =>
    completedTodayIds.has(ex.id),
  ).length;
  const progressPct =
    exercises.length > 0 ? (completedTodayCount / exercises.length) * 100 : 0;

  const weekLabel = isPostpartum
    ? weeksSinceBirth < 2
      ? "Week 1–2 · Gentle beginning"
      : weeksSinceBirth < 6
      ? `Week ${weeksSinceBirth} · Building foundation`
      : `Week ${weeksSinceBirth} · Active recovery`
    : "Prenatal movement";

  const profileStatus = user?.babyBirthDate
    ? `Baby born ${formatDate(user.babyBirthDate)}`
    : user?.dueDate
    ? `Due ${formatDate(user.dueDate)}`
    : null;

  return (
    <AppShell>
      <div className="min-h-screen bg-background pb-8">
        <div className="bg-gradient-to-br from-accent/30 via-primary/10 to-secondary/10 px-4 md:px-8 pt-8 pb-8 rounded-b-[3rem]">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl md:text-3xl mb-1">
              {isPostpartum ? "Postpartum Recovery" : "Body Recovery"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isPostpartum
                ? "Daily healing routines for your recovery"
                : "Gentle movement to support your pregnancy"}
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-4 space-y-6">
          {/* Medical disclaimer */}
          <Card className="rounded-3xl border-none shadow-lg p-6 bg-gradient-to-br from-destructive/10 to-chart-4/10">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-destructive mt-1 flex-shrink-0" />
              <div>
                <h3 className="mb-2 text-destructive">Get Medical Clearance First</h3>
                <p className="text-sm text-muted-foreground">
                  Wait for your doctor&apos;s approval before starting postpartum
                  exercises, especially after a C-section.
                </p>
              </div>
            </div>
          </Card>

          {/* Profile / phase status */}
          {profileStatus ? (
            <Card className="rounded-3xl border-none shadow-lg p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="mb-1">Your plan</h3>
                  <p className="text-sm text-muted-foreground">{profileStatus}</p>
                  {isPostpartum && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {weeksSinceBirth} week{weeksSinceBirth !== 1 ? "s" : ""} postpartum
                      {(user as { deliveryType?: string })?.deliveryType === "cesarean"
                        ? " · Cesarean recovery plan"
                        : ""}
                    </p>
                  )}
                </div>
                <Badge className="rounded-full">
                  {isPostpartum ? "Postpartum" : "Pregnancy"}
                </Badge>
              </div>
            </Card>
          ) : (
            <Card className="rounded-3xl border-none shadow-lg p-6 border-dashed border-muted/40 bg-muted/5">
              <h3 className="mb-2">Personalize your plan</h3>
              <p className="text-sm text-muted-foreground">
                Update your profile or tell the AI assistant your due date /
                birth date to unlock a tailored exercise plan.
              </p>
            </Card>
          )}

          {/* Today's progress with ring + streak */}
          <Card className="rounded-3xl border-none shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
              <div className="flex-1">
                <h3 className="mb-1">{weekLabel}</h3>
                <p className="text-sm text-muted-foreground">
                  {completedTodayCount} of {exercises.length} exercises completed today
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <RingProgress
                value={progressPct}
                size={72}
                label="Today"
              />
              {streak > 0 && (
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-2xl font-medium leading-none">{streak}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      day streak
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* ── Daily Habits ───────────────────────────────────────────── */}
          {user && (
            <Card className="rounded-3xl border-none shadow-lg p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-primary" />
                  <h3>Daily Habits</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs gap-1.5"
                  onClick={() => setHabitSetupOpen(true)}
                >
                  + Add
                </Button>
              </div>

              <DailyHabitChecklist
                habits={todaySummary?.habits ?? []}
                todayCompleted={todaySummary?.completed ?? 0}
                todayTotal={todaySummary?.total ?? 0}
                saving={habitSaving}
                loading={habitsLoading}
                error={habitActionError}
                onToggle={toggleHabit}
                onOpenSetup={() => setHabitSetupOpen(true)}
              />
            </Card>
          )}

          {/* ── Habit Calendar ─────────────────────────────────────────── */}
          {user && habits.length > 0 && (
            <Card className="rounded-3xl border-none shadow-lg p-6">
              <h3 className="mb-5">Habit Tracker Calendar</h3>
              <HabitCalendar habits={habits} userId={user.id} />
            </Card>
          )}

          {/* Exercise cards */}
          {exercises.length > 0 ? (
            exercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                completedToday={completedTodayIds.has(exercise.id)}
                onComplete={handleComplete}
                saving={savingId === exercise.id}
              />
            ))
          ) : user ? (
            <Card className="rounded-3xl border-none shadow-lg p-6 bg-muted/5">
              <p className="text-sm text-muted-foreground">
                No exercises unlocked yet for this phase. Check back after your
                medical clearance appointment.
              </p>
            </Card>
          ) : null}

          {/* Calendar heatmap */}
          {user && (
            <Card className="rounded-3xl border-none shadow-lg p-6">
              <h3 className="mb-4">Exercise Activity this month</h3>
              {loadingCalendar ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : (
                <CalendarHeatmap month={month} calendarDays={calendarDays} />
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Habit setup modal */}
      {habitSetupOpen && (
        <HabitSetupModal
          existingHabits={habits}
          onAdd={createHabit}
          onDelete={deleteHabit}
          onClose={() => setHabitSetupOpen(false)}
        />
      )}
    </AppShell>
  );
}
