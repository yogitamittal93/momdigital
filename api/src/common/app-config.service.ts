import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

/**
 * App config stored in the database (AppConfig table).
 * Allows admin to change quotas and feature flags without redeploying.
 *
 * Keys used across the app:
 *   MONTHLY_QUESTION_LIMIT   — free tier questions per user per month (default 20)
 *   FEATURED_REVIEW_QUOTA    — contributions needed to become featured doctor/nutritionist
 *   FEATURED_CONTENT_QUOTA   — contributions needed to become featured trainer
 */
@Injectable()
export class AppConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async get(key: string, fallback?: string): Promise<string | undefined> {
    try {
      const record = await this.prisma.appConfig.findUnique({ where: { key } });
      return record?.value ?? fallback;
    } catch {
      return fallback;
    }
  }

  async getNumber(key: string, fallback = 0): Promise<number> {
    const val = await this.get(key);
    const n = Number(val);
    return isNaN(n) ? fallback : n;
  }

  async set(key: string, value: string): Promise<void> {
    await this.prisma.appConfig.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }

  async list() {
    return this.prisma.appConfig.findMany({ orderBy: { key: 'asc' } });
  }
}
