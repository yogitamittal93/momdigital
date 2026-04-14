import { Module } from '@nestjs/common';
import { ScanReportsController } from './scan-reports.controller';
import { ScanReportsService } from './scan-reports.service';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ScanReportsController],
  providers: [ScanReportsService],
})
export class ScanReportsModule {}
