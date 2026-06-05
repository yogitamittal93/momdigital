import { Module } from '@nestjs/common';
import { FeedingLogsController } from './feeding-logs.controller';
import { FeedingLogsService } from './feeding-logs.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [FeedingLogsController],
  providers: [FeedingLogsService, PrismaService],
  exports: [FeedingLogsService],
})
export class FeedingLogsModule {}
