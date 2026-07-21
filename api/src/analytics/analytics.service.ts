import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';

export type AnalyticsEventName =
  | 'signup_completed'
  | 'chat_message_sent'
  | 'exercise_log_created'
  | 'scan_uploaded'
  | 'feeding_log_created'
  | 'mood_log_created'
  | 'nanny_check_submitted'
  | 'community_post_created';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Alias kept for backward-compatibility with any existing callers.
   * Internally calls logEvent.
   */
  async trackEvent(
    eventName: string,
    userId?: string | null,
    properties?: Record<string, unknown>,
  ): Promise<void> {
    return this.logEvent(userId ?? null, eventName as AnalyticsEventName, properties);
  }

  /**
   * Fire-and-forget event write. Never throws — analytics must never
   * break a user-facing action.
   */
  async logEvent(
    userId: string | null,
    eventName: AnalyticsEventName | string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.prisma.analyticsEvent.create({
        data: {
          eventName,
          userId: userId ?? null,
          // For nullable Json fields, use undefined to let Prisma store NULL
          ...(metadata !== undefined && metadata !== null ? { metadata: metadata as Prisma.InputJsonValue } : {}),
        },
      });
    } catch (err) {
      // Log but never propagate — analytics must not break user flows
      this.logger.warn(
        `analytics.logEvent failed (${eventName}): ${(err as Error).message}`,
      );
    }
  }

  /**
   * Admin dashboard summary.
   * - Signups, chat volume: last 30 days
   * - Active sessions: last 7 days (distinct users)
   * - RAG source breakdown: all-time (most informative)
   * - Retention: Day-2 / Day-5 / Day-10 for MOTHER users
   * - Recent events: last 20 for live feed
   */
  async getSummary() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalEvents,
      signups,
      activeSessionUsers,
      chatMessages,
      uniqueUserRows,
      ragSourceRows,
      recentEvents,
    ] = await Promise.all([
      this.prisma.analyticsEvent.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),

      this.prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),

      this.prisma.session
        .findMany({
          where: { createdAt: { gte: sevenDaysAgo } },
          select: { userId: true },
          distinct: ['userId'],
        })
        .then((rows) => rows.length),

      this.prisma.chatMessage.count({
        where: { role: 'user', createdAt: { gte: thirtyDaysAgo } },
      }),

      this.prisma.analyticsEvent
        .findMany({
          where: { createdAt: { gte: thirtyDaysAgo }, userId: { not: null } },
          select: { userId: true },
          distinct: ['userId'],
        })
        .then((rows) => rows.length),

      // RAG source breakdown — all-time, only on assistant messages
      this.prisma.chatMessage.groupBy({
        by: ['ragSource'],
        where: { role: 'assistant', ragSource: { not: null } },
        _count: { ragSource: true },
      }),

      this.prisma.analyticsEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          eventName: true,
          userId: true,
          createdAt: true,
          metadata: true,
        },
      }),
    ]);

    const retention = await this._computeRetention();

    const ragSourceBreakdown: Record<string, number> = {};
    for (const row of ragSourceRows) {
      if (row.ragSource) ragSourceBreakdown[row.ragSource] = row._count.ragSource;
    }

    return {
      totalEvents,
      signups,
      activeSessions: activeSessionUsers,
      chatMessages,
      uniqueUsers: uniqueUserRows,
      ragSourceBreakdown,
      retention,
      recentEvents: recentEvents.map((e) => ({
        eventName: e.eventName,
        userId: e.userId,
        createdAt: e.createdAt.toISOString(),
        metadata: e.metadata,
      })),
    };
  }

  /**
   * Day-N retention: % of MOTHER users who returned on day N.
   * "Returned on day N" = has a Session record within ±12h of
   * (signupDate + N days). Only users signed up ≥ N days ago are
   * included in the denominator so buckets are fair.
   */
  private async _computeRetention(): Promise<{
    day2: number | null;
    day5: number | null;
    day10: number | null;
  }> {
    try {
      const users = await this.prisma.user.findMany({
        where: { role: 'MOTHER' },
        select: { id: true, createdAt: true },
      });

      const allSessions = await this.prisma.session.findMany({
        select: { userId: true, createdAt: true },
      });

      const sessionsByUser = new Map<string, Date[]>();
      for (const s of allSessions) {
        if (!sessionsByUser.has(s.userId)) sessionsByUser.set(s.userId, []);
        sessionsByUser.get(s.userId)!.push(s.createdAt);
      }

      const now = new Date();
      const WINDOW_MS = 12 * 60 * 60 * 1000;

      const computeBucket = (days: number): number | null => {
        const eligible = users.filter(
          (u) => now.getTime() - u.createdAt.getTime() >= days * 24 * 60 * 60 * 1000,
        );
        if (eligible.length === 0) return null;
        const returned = eligible.filter((u) => {
          const targetMs = u.createdAt.getTime() + days * 24 * 60 * 60 * 1000;
          return (sessionsByUser.get(u.id) ?? []).some(
            (s) => Math.abs(s.getTime() - targetMs) <= WINDOW_MS,
          );
        });
        return Math.round((returned.length / eligible.length) * 100);
      };

      return { day2: computeBucket(2), day5: computeBucket(5), day10: computeBucket(10) };
    } catch (err) {
      this.logger.warn(`Retention computation failed: ${(err as Error).message}`);
      return { day2: null, day5: null, day10: null };
    }
  }
}
