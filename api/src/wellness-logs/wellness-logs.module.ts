import { Module } from '@nestjs/common';
import { WellnessLogsController } from './wellness-logs.controller';
import { WellnessLogsService } from './wellness-logs.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [WellnessLogsController],
  providers: [WellnessLogsService, PrismaService],
})
export class WellnessLogsModule {}
