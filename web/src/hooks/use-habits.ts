"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { useUserProfile } from "./use-user-profile";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Habit {
  id: string;
  name: string;
  emoji?: string;
  category: string;
  color?: string;
  targetQuantity?: number;
  unit?: string;
  sortOrder: number;
  hasLoadingPhase: boolean;
  loadingPhaseDays?: number;
  loadingStartDate?: string;
  createdAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  quantity?: number;
  completedAt: string;
}

export interface HabitWithStatus extends Habit {
  completedToday: boolean;
  log: HabitLog | null;
}

export interface TodaySummary {
  date: string;
  total: number;
  completed: number;
  habits: HabitWithStatus[];
}

export interface MonthData {
  habits: Habit[];
  logs: HabitLog[];
  calendarDays: Record<string, string[]>; // date → habitIds completed
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useHabits() {
  const { user } = useUserProfile();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [todaySummary, setTodaySummary] = useState<TodaySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null); // habitId being saved

  const fetchAll = useCallback(async () => {
    if (!user) {
      setLoading(false); // <-- key fix: don't stay loading if no user
      return;
    }
    setLoading(true);
    try {
      const [habitsData, todayData] = await Promise.all([
        api.get("/habits") as Promise<Habit[]>,
        api.get("/habits/today") as Promise<TodaySummary>,
      ]);
      setHabits(habitsData ?? []);
      setTodaySummary(todayData ?? null);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /** Toggle a habit as done/undone for today */
  const toggleHabit = useCallback(
    async (habit: Habit) => {
      const today = new Date().toISOString().slice(0, 10);
      const alreadyDone = todaySummary?.habits.find(
        (h) => h.id === habit.id
      )?.completedToday;

      setSaving(habit.id);
      try {
        if (alreadyDone) {
          await api.delete(`/habits/${habit.id}/log/${today}`);
          setTodaySummary((prev) =>
            prev
              ? {
                  ...prev,
                  completed: prev.completed - 1,
                  habits: prev.habits.map((h) =>
                    h.id === habit.id
                      ? { ...h, completedToday: false, log: null }
                      : h
                  ),
                }
              : prev
          );
        } else {
          await api.post(`/habits/${habit.id}/log`, { date: today });
          setTodaySummary((prev) =>
            prev
              ? {
                  ...prev,
                  completed: prev.completed + 1,
                  habits: prev.habits.map((h) =>
                    h.id === habit.id
                      ? {
                          ...h,
                          completedToday: true,
                          log: {
                            id: "temp",
                            habitId: habit.id,
                            date: today,
                            completedAt: new Date().toISOString(),
                          },
                        }
                      : h
                  ),
                }
              : prev
          );
        }
      } catch {
        // silently fail — user can retry
      } finally {
        setSaving(null);
      }
    },
    [todaySummary]
  );

  /** Create a new habit */
  const createHabit = useCallback(
    async (dto: {
      name: string;
      emoji?: string;
      category?: string;
      color?: string;
      targetQuantity?: number;
      unit?: string;
      sortOrder?: number;
      hasLoadingPhase?: boolean;
      loadingPhaseDays?: number;
      loadingStartDate?: string;
    }) => {
      const created = (await api.post("/habits", dto)) as Habit;
      setHabits((prev) => [...prev, created]);
      await fetchAll(); // refresh today summary
      return created;
    },
    [fetchAll]
  );

  /** Delete a habit */
  const deleteHabit = useCallback(async (habitId: string) => {
    await api.delete(`/habits/${habitId}`);
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    setTodaySummary((prev) =>
      prev
        ? {
            ...prev,
            habits: prev.habits.filter((h) => h.id !== habitId),
            total: prev.total - 1,
          }
        : prev
    );
  }, []);

  return {
    habits,
    todaySummary,
    loading,
    saving,
    fetchAll,
    toggleHabit,
    createHabit,
    deleteHabit,
  };
}
