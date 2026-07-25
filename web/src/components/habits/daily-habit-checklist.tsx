"use client";

import { Loader2, Settings2, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { HabitWithStatus, Habit } from "@/hooks/use-habits";

// Category color map
const CATEGORY_COLORS: Record<string, string> = {
  supplement: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  hydration:  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  exercise:   "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  wellness:   "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  custom:     "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300",
};

interface HabitRowProps {
  habit: HabitWithStatus;
  onToggle: (h: Habit) => void;
  saving: boolean;
}

function HabitRow({ habit, onToggle, saving }: HabitRowProps) {
  const categoryColor = CATEGORY_COLORS[habit.category] ?? CATEGORY_COLORS.custom;

  // Loading phase info
  const loadingPhaseInfo = (() => {
    if (!habit.hasLoadingPhase || !habit.loadingStartDate || !habit.loadingPhaseDays) return null;
    const start = new Date(habit.loadingStartDate);
    const now = new Date();
    const daysDone = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const daysLeft = habit.loadingPhaseDays - daysDone;
    if (daysLeft <= 0) return null;
    return { daysDone: Math.min(daysDone, habit.loadingPhaseDays), daysLeft, total: habit.loadingPhaseDays };
  })();

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
        habit.completedToday
          ? "border-primary/30 bg-primary/5"
          : "border-border/50 hover:border-border"
      }`}
    >
      {/* Toggle button */}
      <button
        onClick={() => onToggle(habit)}
        disabled={saving}
        className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all ${
          saving
            ? "border-muted opacity-50"
            : habit.completedToday
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border hover:border-primary/50"
        }`}
      >
        {saving ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : habit.completedToday ? (
          <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
            <path d="M2 7L5.5 10.5L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </button>

      {/* Emoji */}
      <span className="text-xl w-7 text-center flex-shrink-0">{habit.emoji ?? "✅"}</span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-sm font-medium ${habit.completedToday ? "line-through text-muted-foreground" : "text-foreground"}`}>
            {habit.name}
          </p>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${categoryColor}`}>
            {habit.category}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {habit.targetQuantity && habit.unit && (
            <p className="text-xs text-muted-foreground">
              Target: {habit.targetQuantity} {habit.unit}
            </p>
          )}
          {loadingPhaseInfo && (
            <p className="text-xs text-orange-500 font-medium">
              ⚡ Loading phase: Day {loadingPhaseInfo.daysDone}/{loadingPhaseInfo.total}
              {" "}({loadingPhaseInfo.daysLeft} days left)
            </p>
          )}
        </div>
      </div>

      {/* Status */}
      {habit.completedToday && (
        <span className="text-xs text-primary font-medium flex-shrink-0">Done ✓</span>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  habits: HabitWithStatus[];
  todayCompleted: number;
  todayTotal: number;
  saving: string | null;
  loading: boolean;
  error?: string | null;
  onToggle: (h: Habit) => void;
  onOpenSetup: () => void;
}

export function DailyHabitChecklist({
  habits,
  todayCompleted,
  todayTotal,
  saving,
  loading,
  error,
  onToggle,
  onOpenSetup,
}: Props) {
  const progressPct = todayTotal > 0 ? (todayCompleted / todayTotal) * 100 : 0;

  if (loading) {
    return (
      <div className="space-y-2 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-2xl bg-muted/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-3xl mb-3">🌸</p>
        <p className="text-sm font-medium mb-1">No habits yet</p>
        <p className="text-xs text-muted-foreground mb-4">
          Add your daily supplements, hydration goals, and wellness habits to start tracking.
        </p>
        <Button onClick={onOpenSetup} variant="outline" className="rounded-full gap-2">
          <Plus className="w-4 h-4" />
          Add Your First Habit
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress summary */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-sm text-muted-foreground">
              {todayCompleted} of {todayTotal} done today
            </p>
            <button
              onClick={onOpenSetup}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
              Manage
            </button>
          </div>
          <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2" role="alert">
          {error}
        </p>
      )}

      {/* Habit rows */}
      <div className="space-y-2">
        {habits.map((habit) => (
          <HabitRow
            key={habit.id}
            habit={habit}
            onToggle={onToggle}
            saving={saving === habit.id}
          />
        ))}
      </div>

      {progressPct === 100 && (
        <div className="rounded-2xl bg-gradient-to-r from-primary/20 to-accent/20 p-4 text-center">
          <p className="text-lg mb-1">🎉</p>
          <p className="text-sm font-semibold">All done for today!</p>
          <p className="text-xs text-muted-foreground">Incredible consistency. Keep it up!</p>
        </div>
      )}
    </div>
  );
}
