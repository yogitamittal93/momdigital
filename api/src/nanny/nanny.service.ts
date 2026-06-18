import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Prisma } from '@prisma/client';

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
      data: {
        checks: {
          ...checks,
          items,
        } as unknown as import('@prisma/client').Prisma.InputJsonValue,
      },
    });
  }

  // ── Caregiver entity and streak methods ──────────────────────────────────

  private getCalendarDaysDiff(d1: Date, d2: Date): number {
    const date1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
    const date2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
    const diffTime = Math.abs(date1.getTime() - date2.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  async getOrCreateActiveCaregiver(userId: string, helperType: string) {
    let active = await this.prisma.caregiver.findFirst({
      where: { userId, helperType, isAssigned: true },
    });

    if (!active) {
      const defaultName = helperType === 'nanny' ? 'Default Nanny' : 'Default Chef';
      active = await this.prisma.caregiver.create({
        data: {
          userId,
          helperType,
          name: defaultName,
          consecutiveCheckedInDays: 0,
          status: 'Verifying',
          isAssigned: true,
        },
      });
    } else {
      // Auto-reset check: If status is Verifying, and they missed yesterday's check-in
      if (active.lastCheckedIn && active.status === 'Verifying') {
        const daysDiff = this.getCalendarDaysDiff(new Date(), new Date(active.lastCheckedIn));
        if (daysDiff > 1) {
          active = await this.prisma.caregiver.update({
            where: { id: active.id },
            data: {
              consecutiveCheckedInDays: 0,
            },
          });
        }
      }
    }

    return active;
  }

  async listCaregivers(userId: string, helperType: string) {
    // Ensure a default caregiver is created if none exists
    await this.getOrCreateActiveCaregiver(userId, helperType);

    // Return all caregivers of this type for the family, with currently assigned first
    return this.prisma.caregiver.findMany({
      where: { userId, helperType },
      orderBy: [
        { isAssigned: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async createCaregiver(userId: string, helperType: string, name: string) {
    // 1. Unassign all other caregivers of this type for the user
    await this.prisma.caregiver.updateMany({
      where: { userId, helperType, isAssigned: true },
      data: { isAssigned: false },
    });

    // 2. Create the new caregiver (starts at 0 streak and Verifying status)
    return this.prisma.caregiver.create({
      data: {
        userId,
        helperType,
        name: name.trim(),
        consecutiveCheckedInDays: 0,
        status: 'Verifying',
        isAssigned: true,
      },
    });
  }

  async resetCaregiverStreak(userId: string, caregiverId: string) {
    return this.prisma.caregiver.update({
      where: { id: caregiverId, userId },
      data: {
        consecutiveCheckedInDays: 0,
        status: 'Verifying',
      },
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
          checks: checksData as Prisma.InputJsonValue,
          score,
        },
      });
    }

    // Retrieve active caregiver
    const caregiver = await this.getOrCreateActiveCaregiver(userId, helperType);

    // Calculate the new streak
    let newStreak = caregiver.consecutiveCheckedInDays;
    if (caregiver.status === 'Verifying') {
      if (!caregiver.lastCheckedIn) {
        newStreak = 1;
      } else {
        const daysDiff = this.getCalendarDaysDiff(new Date(), new Date(caregiver.lastCheckedIn));
        if (daysDiff === 1) {
          newStreak += 1;
        } else if (daysDiff > 1) {
          newStreak = 1;
        }
      }
    } else {
      // status is Trusted
      if (!caregiver.lastCheckedIn) {
        newStreak = 14;
      } else {
        const daysDiff = this.getCalendarDaysDiff(new Date(), new Date(caregiver.lastCheckedIn));
        if (daysDiff >= 1) {
          newStreak += 1;
        }
      }
    }

    const newStatus = newStreak >= 14 ? 'Trusted' : 'Verifying';

    // Update caregiver state
    await this.prisma.caregiver.update({
      where: { id: caregiver.id },
      data: {
        consecutiveCheckedInDays: newStreak,
        status: newStatus,
        lastCheckedIn: new Date(),
      },
    });

    return this.prisma.trustedHelperCheck.create({
      data: {
        userId,
        helperType,
        checks: checksData as Prisma.InputJsonValue,
        score,
        caregiverId: caregiver.id,
      },
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
