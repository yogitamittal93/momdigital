import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      // Prisma 7 specific property
      datasourceUrl: process.env.DATABASE_URL,
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ Connected to Neon successfully');
    } catch (e) {
      console.error('❌ Connection error:', e);
    }
  }
}