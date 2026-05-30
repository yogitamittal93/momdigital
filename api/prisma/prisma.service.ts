import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      datasources: {
        db: { url: process.env.DATABASE_URL }
      },
      log: ['error'],
    });
  }

  async onModuleInit() {
    // Retry up to 5 times — handles Neon cold start delay
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        await this.$connect();
        this.logger.log('✅ Connected to Neon successfully');
        return;
      } catch (e) {
        this.logger.warn(`Connection attempt ${attempt}/5 failed: ${e.message}`);
        if (attempt === 5) {
          this.logger.error('❌ All connection attempts failed');
        } else {
          // Wait 3 seconds before retrying — gives Neon time to wake up
          await new Promise(res => setTimeout(res, 3000));
        }
      }
    }
  }
}