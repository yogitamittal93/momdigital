import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redis: Redis | null = null;
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      this.logger.warn('REDIS_URL not set — Redis caching disabled (dev mode)');
      return;
    }

    try {
      const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
      this.redis = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: isProduction ? 3 : 1,
        retryStrategy: (times) => {
          if (!isProduction && times > 1) {
            return null; // stop retrying in local dev to avoid console spam
          }
          // Exponential backoff reconnect: 500ms, 1000ms, 2000ms, up to 5000ms
          return Math.min(times * 500, 5000);
        },
        enableOfflineQueue: false,
      });

      // Suppress unhandled error events — log once and move on
      this.redis.on('error', (err: Error) => {
        this.logger.warn(`Redis connection error: ${err.message}`);
        if (!isProduction) {
          this.redis?.disconnect(); // disconnect in dev to prevent terminal spam
        }
      });
    } catch (e) {
      this.logger.warn('Failed to initialize Redis client — caching disabled');
      this.redis = null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;
    try {
      const raw = await this.redis.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      // noop — cache miss is acceptable
    }
  }

  async del(key: string): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.del(key);
    } catch {
      // noop
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit().catch(() => undefined);
    }
  }
}
