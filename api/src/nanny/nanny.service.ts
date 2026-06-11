import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class NannyService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Legacy checklist methods (using TrustedHelperCheck) ───────────────────

  async createChecklist(userId: string, nannyName?: string) {
    return this.prisma.trustedHelperCheck.create({
      data: {
        userId,
        helperType: 'nanny',
        checks: { nannyName: nannyName ?? 'Nanny', items: [] },
        score: 0,
      },
    });
  }

  async listChecklists(userId: string) {
    return this.prisma.trustedHelperCheck.findMany({
      where: { userId, helperType: 'nanny' },
      orderBy: { checkedAt: 'desc' },
    });
  }

  async ensureTodayLogs(checklistId: string, userId: string) {
    return this.prisma.trustedHelperCheck.findFirst({
      where: { id: checklistId, userId },
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
    const existing = await this.prisma.trustedHelperCheck.findFirst({
      where: { id: checklistId, userId },
    });
    if (!existing) return null;

    const checks = (existing.checks as Record<string, unknown>) ?? {};
    const items = (checks.items as Record<string, unknown>[]) ?? [];
    const idx = items.findIndex(
      (i) => i.checkItem === checkItem && i.dayNumber === dayNumber,
    );

    if (idx >= 0) {
      items[idx] = { ...items[idx], completed, note };
    } else {
      items.push({ checkItem, dayNumber, completed, note });
    }

    return this.prisma.trustedHelperCheck.update({
      where: { id: checklistId },
      data: { checks: { ...checks, items } as unknown as import('@prisma/client').Prisma.InputJsonValue },
    });
  }

  // ── Scored check methods (used by trusted-help UI) ────────────────────────

  async saveCheck(
    userId: string,
    helperType: string,
    checks: Record<string, boolean>,
    score: number,
    notes?: string,
  ) {
    const checksData = notes ? { ...checks, __notes: notes } : checks;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const existing = await this.prisma.trustedHelperCheck.findFirst({
      where: {
        userId,
        helperType,
        checkedAt: {
          gte: startOfToday,
          lt: endOfToday,
        },
      },
    });

    if (existing) {
      return this.prisma.trustedHelperCheck.update({
        where: { id: existing.id },
        data: {
          checks: checksData as any,
          score,
        },
      });
    }

    return this.prisma.trustedHelperCheck.create({
      data: { userId, helperType, checks: checksData as any, score },
    });
  }


  async getChecks(userId: string, helperType?: string, limit = 10) {
    return this.prisma.trustedHelperCheck.findMany({
      where: { userId, ...(helperType ? { helperType } : {}) },
      orderBy: { checkedAt: 'desc' },
      take: limit,
    });
  }
}
