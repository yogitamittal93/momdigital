"use client";

import Link from "next/link";
import { ChevronRight, Loader2, ListChecks } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useHabits, type Habit } from "@/hooks/use-habits";

const CATEGORY_DOT_COLORS: Record<string, string> = {
  supplement: "#e879f9",
  hydration:  "#38bdf8",
  exercise:   "#f472b6",
  wellness:   "#4ade80",
  custom:     "#a78bfa",
};

function MiniHabitRow({
  habit,
  onToggle,
  saving,
}: {
  habit: Habit & { completedToday: boolean };
  onToggle: (h: Habit) => void;
  saving: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      {/* Toggle */}
      <button
        onClick={() => onToggle(habit)}
        disabled={saving}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          saving
            ? "border-muted opacity-50"
            : habit.completedToday
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border hover:border-primary/50"
        }`}
      >
        {saving ? (
          <Loader2 className="w-2.5 h-2.5 animate-spin" />
        ) : habit.completedToday ? (
          <svg className="w-2.5 h-2.5" viewBox="0 0 14 14" fill="none">
            <path d="M2 7L5.5 10.5L12 3.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </button>

      {/* Dot color indicator */}
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{
          backgroundColor: habit.completedToday
            ? (habit.color ?? CATEGORY_DOT_COLORS[habit.category] ?? "#a78bfa")
            : "#e2e8f0",
        }}
      />

      {/* Name */}
      <span className={`text-sm flex-1 truncate ${habit.completedToday ? "line-through text-muted-foreground" : "text-foreground"}`}>
        {habit.emoji} {habit.name}
      </span>
    </div>
  );
}

/**
 * Compact "Daily Habits" widget for the dashboard.
 * Shows up to 5 habits with checkboxes. "See all →" links to /recovery.
 */
export function DashboardHabitsWidget() {
  const { todaySummary, loading, saving, toggleHabit } = useHabits();

  const progressPct =
    (todaySummary?.total ?? 0) > 0
      ? Math.round(((todaySummary?.completed ?? 0) / (todaySummary?.total ?? 1)) * 100)
      : 0;

  if (loading) {
    return (
      <Card className="border-none rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <ListChecks className="w-4 h-4 text-primary" />
          <p className="font-medium text-sm">Daily Habits</p>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 rounded-xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  const habitList = todaySummary?.habits ?? [];

  return (
    <Card className="border-none rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-primary" />
          <p className="font-medium text-sm">Daily Habits</p>
        </div>
        <Link href="/recovery" className="text-xs text-primary flex items-center gap-0.5 hover:underline">
          See all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {habitList.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground mb-3">
            Track your daily vitamins, water, and wellness goals.
          </p>
          <Link
            href="/recovery"
            className="text-xs text-primary font-medium hover:underline"
          >
            Set up habits →
          </Link>
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{todaySummary?.completed}/{todaySummary?.total} done</span>
              <span className="text-primary font-medium">{progressPct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Habit rows — show max 5, rest truncated */}
          <div className="divide-y divide-border/30">
            {habitList.slice(0, 5).map((habit) => (
              <MiniHabitRow
                key={habit.id}
                habit={habit}
                onToggle={toggleHabit}
                saving={saving === habit.id}
              />
            ))}
          </div>

          {habitList.length > 5 && (
            <Link
              href="/recovery"
              className="block text-center text-xs text-muted-foreground hover:text-primary mt-2 transition-colors"
            >
              +{habitList.length - 5} more habits → view all
            </Link>
          )}
        </>
      )}
    </Card>
  );
}
