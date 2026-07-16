"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api-client";
import type { Habit, MonthData } from "@/hooks/use-habits";

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildCalendarGrid(month: string) {
  const [y, m] = month.split("-").map(Number);
  const days: string[] = [];
  const total = new Date(y, m, 0).getDate();
  for (let d = 1; d <= total; d++) {
    days.push(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  return days;
}

// Category color map (fallback if no habit color set)
const CATEGORY_COLORS: Record<string, string> = {
  supplement: "#e879f9",
  hydration:  "#38bdf8",
  exercise:   "#f472b6",
  wellness:   "#4ade80",
  custom:     "#a78bfa",
};

// ── Tooltip ───────────────────────────────────────────────────────────────────

function DayTooltip({
  day,
  habits,
  completedIds,
  anchorRef,
}: {
  day: string;
  habits: Habit[];
  completedIds: string[];
  anchorRef: React.RefObject<HTMLDivElement | null>;
}) {
  const completed = habits.filter((h) => completedIds.includes(h.id));
  const missed    = habits.filter((h) => !completedIds.includes(h.id));
  const date      = new Date(`${day}T12:00:00`);

  return (
    <div
      className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 rounded-2xl border border-border/60 bg-card shadow-xl p-3 text-left pointer-events-none"
      style={{ fontSize: "0.72rem" }}
    >
      <p className="font-semibold text-foreground mb-2 text-xs">
        {date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
        {" · "}
        <span className="text-primary">
          {completed.length}/{habits.length} done
        </span>
      </p>
      {completed.length > 0 && (
        <div className="mb-1.5">
          <p className="text-muted-foreground mb-1 uppercase tracking-wider" style={{ fontSize: "0.6rem" }}>Completed</p>
          {completed.map((h) => (
            <div key={h.id} className="flex items-center gap-1.5 py-0.5">
              <span>{h.emoji ?? "✅"}</span>
              <span className="text-foreground">{h.name}</span>
            </div>
          ))}
        </div>
      )}
      {missed.length > 0 && (
        <div>
          <p className="text-muted-foreground mb-1 uppercase tracking-wider" style={{ fontSize: "0.6rem" }}>Missed</p>
          {missed.map((h) => (
            <div key={h.id} className="flex items-center gap-1.5 py-0.5 opacity-40">
              <span>{h.emoji ?? "⬜"}</span>
              <span className="text-foreground">{h.name}</span>
            </div>
          ))}
        </div>
      )}
      {/* Arrow */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-border/60" />
    </div>
  );
}

// ── Day Cell ──────────────────────────────────────────────────────────────────

function DayCell({
  day,
  habits,
  completedIds,
  isToday,
  isPast,
}: {
  day: string;
  habits: Habit[];
  completedIds: string[];
  isToday: boolean;
  isPast: boolean;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dayNum = new Date(`${day}T12:00:00`).getDate();
  const count = completedIds.length;
  const total = habits.length;

  // Mini dots — one per habit, colored if done
  const dots = habits.map((h) => ({
    id: h.id,
    color: completedIds.includes(h.id)
      ? (h.color ?? CATEGORY_COLORS[h.category] ?? "#a78bfa")
      : undefined,
  }));

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => total > 0 && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onTouchStart={() => total > 0 && setShowTooltip((v) => !v)}
    >
      <div
        className={`
          aspect-square rounded-lg flex flex-col items-center justify-between p-0.5
          border transition-all
          ${isToday ? "ring-2 ring-primary ring-offset-1" : ""}
          ${count > 0 && count === total ? "border-primary/50 bg-primary/10" :
            count > 0 ? "border-primary/25 bg-primary/5" :
            isPast ? "border-muted/20 bg-muted/10" :
            "border-transparent bg-transparent"}
          ${total > 0 ? "cursor-pointer hover:shadow-sm" : ""}
        `}
      >
        {/* Day number */}
        <span className="text-[9px] text-muted-foreground leading-none pt-0.5">
          {dayNum}
        </span>

        {/* Mini dots grid */}
        {total > 0 && (
          <div
            className="flex flex-wrap justify-center gap-px pb-0.5"
            style={{ maxWidth: "100%" }}
          >
            {dots.slice(0, 12).map((dot) => (
              <div
                key={dot.id}
                className="rounded-full flex-shrink-0"
                style={{
                  width: total <= 4 ? 5 : total <= 9 ? 4 : 3,
                  height: total <= 4 ? 5 : total <= 9 ? 4 : 3,
                  backgroundColor: dot.color ?? (isPast ? "#94a3b8" : "#e2e8f0"),
                  opacity: dot.color ? 1 : 0.3,
                }}
              />
            ))}
            {total > 12 && (
              <span className="text-[6px] text-muted-foreground">+{total - 12}</span>
            )}
          </div>
        )}
      </div>

      {showTooltip && (
        <DayTooltip
          day={day}
          habits={habits}
          completedIds={completedIds}
          anchorRef={ref}
        />
      )}
    </div>
  );
}

// ── Main Calendar ─────────────────────────────────────────────────────────────

interface Props {
  habits: Habit[];
  userId?: string;
}

export function HabitCalendar({ habits, userId }: Props) {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [monthData, setMonthData] = useState<MonthData | null>(null);
  const [weekPct, setWeekPct] = useState<number>(0);
  const [loadingMonth, setLoadingMonth] = useState(true);

  useEffect(() => {
    if (!userId || habits.length === 0) {
      setLoadingMonth(false);
      return;
    }
    setLoadingMonth(true);
    Promise.all([
      api.get(`/habits/month?month=${month}`) as Promise<MonthData>,
      api.get("/habits/week-stats") as Promise<{ pct: number }>,
    ])
      .then(([data, stats]) => {
        setMonthData(data);
        setWeekPct(stats?.pct ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoadingMonth(false));
  }, [month, userId, habits.length]);

  const days = buildCalendarGrid(month);
  const today = new Date().toISOString().slice(0, 10);
  const calendarDays = monthData?.calendarDays ?? {};

  const monthLabel = new Date(`${month}-01`).toLocaleString("default", {
    month: "long", year: "numeric",
  });

  const navigateMonth = (dir: -1 | 1) => {
    const [y, m] = month.split("-").map(Number);
    const nd = new Date(y, m - 1 + dir, 1);
    setMonth(`${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, "0")}`);
  };

  if (habits.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-muted-foreground">
          Add some habits above to start seeing your calendar tracker.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Week summary bar */}
      <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">This week's compliance</p>
          <p className="text-lg font-bold text-primary">{weekPct}%</p>
        </div>
        <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${weekPct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Across all {habits.length} habit{habits.length !== 1 ? "s" : ""} in the last 7 days
        </p>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateMonth(-1)}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground"
        >
          ‹
        </button>
        <p className="text-sm font-medium">{monthLabel}</p>
        <button
          onClick={() => navigateMonth(1)}
          disabled={month >= today.slice(0, 7)}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground disabled:opacity-30"
        >
          ›
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <p key={i} className="text-[10px] text-muted-foreground text-center">
            {d}
          </p>
        ))}

        {/* Empty offset cells */}
        {Array.from({ length: new Date(`${month}-01`).getDay() }).map((_, i) => (
          <div key={`e${i}`} />
        ))}

        {/* Day cells */}
        {loadingMonth
          ? days.map((d) => (
              <div
                key={d}
                className="aspect-square rounded-lg bg-muted/30 animate-pulse"
              />
            ))
          : days.map((day) => (
              <DayCell
                key={day}
                day={day}
                habits={habits}
                completedIds={calendarDays[day] ?? []}
                isToday={day === today}
                isPast={day < today}
              />
            ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <p className="text-xs text-muted-foreground">Legend:</p>
        {habits.slice(0, 5).map((h) => (
          <div key={h.id} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: h.color ?? CATEGORY_COLORS[h.category] ?? "#a78bfa" }}
            />
            <span className="text-xs text-muted-foreground">{h.name}</span>
          </div>
        ))}
        {habits.length > 5 && (
          <span className="text-xs text-muted-foreground">+{habits.length - 5} more</span>
        )}
      </div>
    </div>
  );
}
