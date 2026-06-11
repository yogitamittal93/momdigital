import { Module } from '@nestjs/common';
import { BloodPressureController } from './blood-pressure.controller';
import { BloodPressureService } from './blood-pressure.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [BloodPressureController],
  providers: [BloodPressureService, PrismaService],
})
export class BloodPressureModule {}
