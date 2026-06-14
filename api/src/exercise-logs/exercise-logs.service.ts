import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateExerciseLogDto } from './dto/exercise-log.dto';

@Injectable()
export class ExerciseLogsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Save a completed exercise for the authenticated user. */
  async create(userId: string, dto: CreateExerciseLogDto) {
    return this.prisma.exerciseLog.create({
      data: {
        userId,
        exerciseId: dto.exerciseId,
        phase: dto.phase,
        durationMins: dto.durationMins ?? null,
      },
    });
  }

  /**
   * Return all logs for a given calendar month.
   * If no month is supplied, returns the current month.
   *
   * Response shape used by the heatmap:
   *   { logs: ExerciseLog[], calendarDays: { [date: string]: string[] } }
   *
   * `calendarDays` maps "YYYY-MM-DD" → exerciseIds completed that day,
   * so the frontend can colour a heatmap square without extra processing.
   */
  async findByMonth(userId: string, month?: string) {
    const { start, end } = this.parseMonthRange(month);

    const logs = await this.prisma.exerciseLog.findMany({
      where: {
        userId,
        completedAt: { gte: start, lt: end },
      },
      orderBy: { completedAt: 'asc' },
    });

    // Build a { "2025-06-04": ["deep-belly-breathing", ...] } map
    const calendarDays: Record<string, string[]> = {};
    for (const log of logs) {
      const key = log.completedAt.toISOString().slice(0, 10); // YYYY-MM-DD
      if (!calendarDays[key]) calendarDays[key] = [];
      calendarDays[key].push(log.exerciseId);
    }

    return { logs, calendarDays };
  }

  /**
   * Return the streak: how many consecutive days (ending today) the user
   * completed at least one exercise.  Used for the "🔥 X day streak" badge.
   */
  async getStreak(userId: string): Promise<number> {
    // Fetch last 90 days to cover any realistic streak
    const since = new Date();
    since.setDate(since.getDate() - 90);

    const logs = await this.prisma.exerciseLog.findMany({
      where: { userId, completedAt: { gte: since } },
      select: { completedAt: true },
      orderBy: { completedAt: 'desc' },
    });

    const activeDays = new Set(
      logs.map((l) => l.completedAt.toISOString().slice(0, 10)),
    );

    let streak = 0;
    const cursor = new Date();

    while (true) {
      const key = cursor.toISOString().slice(0, 10);
      if (!activeDays.has(key)) break;
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  private parseMonthRange(month?: string): { start: Date; end: Date } {
    // month format: "YYYY-MM", e.g. "2025-06"
    const ref = month ? new Date(`${month}-01T00:00:00Z`) : new Date();
    const start = new Date(
      Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), 1),
    );
    const end = new Date(
      Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + 1, 1),
    );
    return { start, end };
  }
}
