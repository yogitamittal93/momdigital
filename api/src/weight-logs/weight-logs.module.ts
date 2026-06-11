import { Module } from '@nestjs/common';
import { WeightLogsController } from './weight-logs.controller';
import { WeightLogsService } from './weight-logs.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [WeightLogsController],
  providers: [WeightLogsService, PrismaService],
})
export class WeightLogsModule {}
