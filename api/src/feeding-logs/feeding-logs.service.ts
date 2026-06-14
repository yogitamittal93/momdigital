import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateFeedingLogDto } from './dto/create-feeding-log.dto';

@Injectable()
export class FeedingLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateFeedingLogDto) {
    return this.prisma.feedingLog.create({
      data: {
        userId,
        type: dto.type,
        startedAt: new Date(dto.startedAt),
        durationMins: dto.durationMins ?? null,
        notes: dto.notes ?? null,
      },
    });
  }

  async findByDate(userId: string, date?: string) {
    const start = this.parseDateRange(date).start;
    const end = this.parseDateRange(date).end;

    const logs = await this.prisma.feedingLog.findMany({
      where: {
        userId,
        startedAt: { gte: start, lt: end },
      },
      orderBy: { startedAt: 'desc' },
    });

    return {
      logs,
      lastUsedType: logs[0]?.type ?? 'breast-left',
    };
  }

  private parseDateRange(date?: string): { start: Date; end: Date } {
    const base =
      date && date !== 'today' ? new Date(`${date}T00:00:00`) : new Date();

    const start = new Date(base);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return { start, end };
  }
}
