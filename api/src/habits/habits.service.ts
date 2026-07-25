import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import type { CreateHabitDto, LogHabitDto } from './habit.dto';

export type { CreateHabitDto, LogHabitDto } from './habit.dto';

@Injectable()
export class HabitsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── CRUD ──────────────────────────────────────────────────────────

  async getHabits(userId: string) {
    return this.prisma.habit.findMany({
      where: { userId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createHabit(userId: string, dto: CreateHabitDto) {
    return this.prisma.habit.create({
      data: {
        userId,
        name: dto.name,
        emoji: dto.emoji,
        category: dto.category ?? 'custom',
        color: dto.color,
        targetQuantity: dto.targetQuantity,
        unit: dto.unit,
        sortOrder: dto.sortOrder ?? 0,
        hasLoadingPhase: dto.hasLoadingPhase ?? false,
        loadingPhaseDays: dto.loadingPhaseDays,
        loadingStartDate: dto.loadingStartDate
          ? new Date(dto.loadingStartDate)
          : undefined,
      },
    });
  }

  async updateHabit(
    userId: string,
    habitId: string,
    dto: Partial<CreateHabitDto>,
  ) {
    const habit = await this.prisma.habit.findUnique({ where: { id: habitId } });
    if (!habit) throw new NotFoundException('Habit not found');
    if (habit.userId !== userId) throw new ForbiddenException();

    return this.prisma.habit.update({
      where: { id: habitId },
      data: {
        ...dto,
        loadingStartDate: dto.loadingStartDate
          ? new Date(dto.loadingStartDate)
          : undefined,
      },
    });
  }

  async deleteHabit(userId: string, habitId: string) {
    const habit = await this.prisma.habit.findUnique({ where: { id: habitId } });
    if (!habit) throw new NotFoundException('Habit not found');
    if (habit.userId !== userId) throw new ForbiddenException();

    // Soft-delete
    return this.prisma.habit.update({
      where: { id: habitId },
      data: { isActive: false },
    });
  }

  // ── LOGGING ───────────────────────────────────────────────────────

  async logHabit(userId: string, habitId: string, dto: LogHabitDto) {
    const habit = await this.prisma.habit.findUnique({ where: { id: habitId } });
    if (!habit) throw new NotFoundException('Habit not found');
    if (habit.userId !== userId) throw new ForbiddenException();

    return this.prisma.habitLog.upsert({
      where: { habitId_date: { habitId, date: dto.date } },
      create: { habitId, userId, date: dto.date, quantity: dto.quantity },
      update: { quantity: dto.quantity, completedAt: new Date() },
    });
  }

  async deleteLog(userId: string, habitId: string, date: string) {
    const log = await this.prisma.habitLog.findUnique({
      where: { habitId_date: { habitId, date } },
    });
    if (!log) throw new NotFoundException('Log not found');
    if (log.userId !== userId) throw new ForbiddenException();
    return this.prisma.habitLog.delete({
      where: { habitId_date: { habitId, date } },
    });
  }

  // ── CALENDAR DATA ─────────────────────────────────────────────────

  /**
   * Returns logs for a given month (YYYY-MM), structured as:
   * {
   *   logs: HabitLog[],
   *   calendarDays: { "YYYY-MM-DD": { habitId: { completed: bool, quantity: number } }[] }
   *   habits: Habit[]
   * }
   */
  async getMonthData(userId: string, month: string) {
    const habits = await this.prisma.habit.findMany({
      where: { userId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    const logs = await this.prisma.habitLog.findMany({
      where: {
        userId,
        date: { startsWith: month },
      },
      orderBy: { date: 'asc' },
    });

    // Build calendarDays: date → array of completed habitIds
    const calendarDays: Record<string, string[]> = {};
    for (const log of logs) {
      if (!calendarDays[log.date]) calendarDays[log.date] = [];
      calendarDays[log.date].push(log.habitId);
    }

    return { habits, logs, calendarDays };
  }

  /** Returns today's completion data for the dashboard widget */
  async getTodaySummary(userId: string) {
    const today = new Date().toISOString().slice(0, 10);
    const habits = await this.prisma.habit.findMany({
      where: { userId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    const logs = await this.prisma.habitLog.findMany({
      where: { userId, date: today },
    });

    const completedIds = new Set(logs.map((l) => l.habitId));

    return {
      date: today,
      total: habits.length,
      completed: logs.length,
      habits: habits.map((h) => ({
        ...h,
        completedToday: completedIds.has(h.id),
        log: logs.find((l) => l.habitId === h.id) ?? null,
      })),
    };
  }

  /** Returns week summary: days done / total days that have any completion */
  async getWeekStats(userId: string) {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6); // last 7 days including today

    const start = weekStart.toISOString().slice(0, 10);
    const end = now.toISOString().slice(0, 10);

    const habits = await this.prisma.habit.findMany({
      where: { userId, isActive: true },
    });

    const logs = await this.prisma.habitLog.findMany({
      where: {
        userId,
        date: { gte: start, lte: end },
      },
    });

    const totalSlots = habits.length * 7;
    const completedSlots = logs.length;
    const pct = totalSlots > 0 ? Math.round((completedSlots / totalSlots) * 100) : 0;

    return { totalSlots, completedSlots, pct, start, end };
  }
}
