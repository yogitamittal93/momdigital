import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AffirmationsController } from './affirmations.controller';
import { AffirmationsService } from './affirmations.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  imports: [HttpModule],
  controllers: [AffirmationsController],
  providers: [AffirmationsService, PrismaService],
})
export class AffirmationsModule {}
