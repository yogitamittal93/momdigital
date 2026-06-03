import { Module } from '@nestjs/common';
import { AffirmationsController } from './affirmations.controller';
import { AffirmationsService } from './affirmations.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [AffirmationsController],
  providers: [AffirmationsService, PrismaService],
})
export class AffirmationsModule {}
