import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import {
  getChecklistItemsForDay,
  TRUST_MILESTONES,
} from './nanny-checklist.constants';

@Injectable()
export class NannyService {
  constructor(private readonly prisma: PrismaService) {}

  async createChecklist(userId: string, nannyName?: string) {
    const checklist = await this.prisma.nannyChecklist.create({
      data: {
        userId,
        nannyName,
      },
    });

    const items = getChecklistItemsForDay(1);
    await this.prisma.nannyCheckLog.createMany({
      data: items.map((item) => ({
        checklistId: checklist.id,
        checkItem: item.id,
        dayNumber: 1,
      })),
    });

    return this.getChecklist(checklist.id, userId);
  }

  async getChecklist(checklistId: string, userId: string) {
    const checklist = await this.prisma.nannyChecklist.findFirst({
      where: { id: checklistId, userId },
      include: {
        checks: { orderBy: [{ dayNumber: 'asc' }, { checkItem: 'asc' }] },
      },
    });

    if (!checklist) {
      throw new NotFoundException('Checklist not found');
    }

    const dayNumber = this.getDayNumber(checklist.startDate);
    const milestone = TRUST_MILESTONES.find((m) => m.day === dayNumber);

    return {
      ...checklist,
      currentDay: dayNumber,
      trustMilestone: milestone ?? null,
      todayItems: getChecklistItemsForDay(dayNumber),
    };
  }

  async listChecklists(userId: string) {
    return this.prisma.nannyChecklist.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        checks: {
          where: { dayNumber: 1 },
          take: 3,
        },
      },
    });
  }

  async toggleCheck(
    checklistId: string,
    userId: string,
    checkItem: string,
    dayNumber: number,
    completed: boolean,
    note?: string,
  ) {
    const checklist = await this.prisma.nannyChecklist.findFirst({
      where: { id: checklistId, userId },
    });

    if (!checklist) {
      throw new NotFoundException('Checklist not found');
    }

    const log = await this.prisma.nannyCheckLog.findFirst({
      where: { checklistId, checkItem, dayNumber },
    });

    if (!log) {
      return this.prisma.nannyCheckLog.create({
        data: {
          checklistId,
          checkItem,
          dayNumber,
          completed,
          note,
          checkedAt: completed ? new Date() : null,
        },
      });
    }

    return this.prisma.nannyCheckLog.update({
      where: { id: log.id },
      data: {
        completed,
        note,
        checkedAt: completed ? new Date() : null,
      },
    });
  }

  async ensureTodayLogs(checklistId: string, userId: string) {
    const checklist = await this.prisma.nannyChecklist.findFirst({
      where: { id: checklistId, userId },
    });

    if (!checklist) {
      throw new NotFoundException('Checklist not found');
    }

    const dayNumber = this.getDayNumber(checklist.startDate);
    const items = getChecklistItemsForDay(dayNumber);

    for (const item of items) {
      const exists = await this.prisma.nannyCheckLog.findFirst({
        where: { checklistId, checkItem: item.id, dayNumber },
      });
      if (!exists) {
        await this.prisma.nannyCheckLog.create({
          data: {
            checklistId,
            checkItem: item.id,
            dayNumber,
          },
        });
      }
    }

    return this.getChecklist(checklistId, userId);
  }

  private getDayNumber(startDate: Date): number {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffMs = today.getTime() - start.getTime();
    return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);
  }
}
