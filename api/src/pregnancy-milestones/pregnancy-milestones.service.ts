import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { ToggleMilestoneDto } from './dto/milestone.dto';

@Injectable()
export class PregnancyMilestonesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.pregnancyMilestoneLog.findMany({
      where: { userId },
      orderBy: { completedAt: 'asc' },
    });
  }

  async toggle(userId: string, dto: ToggleMilestoneDto) {
    const existing = await this.prisma.pregnancyMilestoneLog.findUnique({
      where: {
        userId_week_title: {
          userId,
          week: dto.week,
          title: dto.title,
        },
      },
    });

    if (existing) {
      await this.prisma.pregnancyMilestoneLog.delete({
        where: { id: existing.id },
      });
      return { completed: false };
    } else {
      const created = await this.prisma.pregnancyMilestoneLog.create({
        data: {
          userId,
          week: dto.week,
          title: dto.title,
        },
      });
      return { completed: true, log: created };
    }
  }
}
