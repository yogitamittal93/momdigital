import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ToggleWellnessDto } from './dto/wellness-log.dto';

@Injectable()
export class WellnessLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByMonth(userId: string, month?: string) {
    const { start, end } = this.parseMonthRange(month);

    const logs = await this.prisma.wellnessChecklistLog.findMany({
      where: {
        userId,
        completedAt: { gte: start, lt: end },
      },
      orderBy: { completedAt: 'asc' },
    });

    // Build a { "2026-06-01": ["1", "2"], ... } map
    const calendarDays: Record<string, string[]> = {};
    for (const log of logs) {
      const key = log.completedAt.toISOString().slice(0, 10);
      if (!calendarDays[key]) calendarDays[key] = [];
      calendarDays[key].push(log.taskId);
    }

    return { logs, calendarDays };
  }

  async toggle(userId: string, dto: ToggleWellnessDto) {
    // We treat the dateStr as UTC start of the day to avoid timezone drift
    const startOfDay = new Date(`${dto.date}T00:00:00.000Z`);
    const endOfDay = new Date(`${dto.date}T23:59:59.999Z`);

    const existing = await this.prisma.wellnessChecklistLog.findFirst({
      where: {
        userId,
        taskId: dto.taskId,
        completedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (existing) {
      await this.prisma.wellnessChecklistLog.delete({
        where: { id: existing.id },
      });
      return { completed: false };
    } else {
      const created = await this.prisma.wellnessChecklistLog.create({
        data: {
          userId,
          taskId: dto.taskId,
          completedAt: startOfDay,
        },
      });
      return { completed: true, log: created };
    }
  }

  private parseMonthRange(month?: string): { start: Date; end: Date } {
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
