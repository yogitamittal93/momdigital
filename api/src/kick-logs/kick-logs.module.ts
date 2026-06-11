import { Module } from '@nestjs/common';
import { KickLogsController } from './kick-logs.controller';
import { KickLogsService } from './kick-logs.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [KickLogsController],
  providers: [KickLogsService, PrismaService],
})
export class KickLogsModule {}
