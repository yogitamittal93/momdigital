import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'prisma/prisma.service';
import { RedisService } from './redis.service';

/**
 * Configurable key-value store backed by the `app_config` DB table.
 *
 * Read priority:
 *   1. Redis cache (TTL: APP_CONFIG_TTL_SECONDS, default 300)
 *   2. Database (result is then written to cache)
 *   3. Environment variable with the same key (safety fallback)
 *   4. Provided defaultValue
 *
 * Write: updates DB and immediately invalidates the Redis key.
 *
 * Seed keys:
 *   FEATURED_REVIEW_QUOTA   — default 40
 *   FEATURED_CONTENT_QUOTA  — default 5
 */
@Injectable()
export class AppConfigService {
  private readonly logger = new Logger(AppConfigService.name);
  private readonly ttl: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.ttl = Number(
      this.configService.get<string>('APP_CONFIG_TTL_SECONDS') ?? '300',
    );
  }

  private cacheKey(key: string) {
    return `app_config:${key}`;
  }

  async get(key: string, defaultValue?: string): Promise<string | undefined> {
    // 1. Redis cache
    const cached = await this.redis.get<string>(this.cacheKey(key));
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    // 2. Database
    try {
      const record = await this.prisma.appConfig.findUnique({ where: { key } });
      if (record) {
        await this.redis.set(this.cacheKey(key), record.value, this.ttl);
        return record.value;
      }
    } catch (err) {
      this.logger.warn(`DB read failed for AppConfig key "${key}": ${err}`);
    }

    // 3. Environment variable fallback
    const envVal = this.configService.get<string>(key);
    if (envVal !== undefined) {
      this.logger.warn(
        `AppConfig key "${key}" not in DB — using env fallback: ${envVal}`,
      );
      return envVal;
    }

    // 4. Hard-coded default
    return defaultValue;
  }

  async getNumber(key: string, defaultValue: number): Promise<number> {
    const raw = await this.get(key, String(defaultValue));
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : defaultValue;
  }

  async set(key: string, value: string): Promise<void> {
    await this.prisma.appConfig.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
    // Invalidate cache so next read picks up the new value immediately
    await this.redis.del(this.cacheKey(key));
    this.logger.log(`AppConfig "${key}" updated to "${value}"`);
  }

  async list(): Promise<Array<{ key: string; value: string; updatedAt: Date }>> {
    return this.prisma.appConfig.findMany({ orderBy: { key: 'asc' } });
  }
}
