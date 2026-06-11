import { Module } from '@nestjs/common';
import { PregnancyMilestonesController } from './pregnancy-milestones.controller';
import { PregnancyMilestonesService } from './pregnancy-milestones.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [PregnancyMilestonesController],
  providers: [PregnancyMilestonesService, PrismaService],
})
export class PregnancyMilestonesModule {}
