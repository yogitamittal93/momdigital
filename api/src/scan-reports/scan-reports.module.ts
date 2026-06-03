import { Module } from '@nestjs/common';
import { ScanReportsController } from './scan-reports.controller';
import { ScanReportsService } from './scan-reports.service';
import { PrismaModule } from 'prisma/prisma.module';
import { ContentRequestsModule } from 'src/content-requests/content-requests.module';

@Module({
  imports: [PrismaModule, ContentRequestsModule],
  controllers: [ScanReportsController],
  providers: [ScanReportsService],
})
export class ScanReportsModule {}

