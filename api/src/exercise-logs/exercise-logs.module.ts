import { Module } from '@nestjs/common';
import { ExerciseLogsController } from './exercise-logs.controller';
import { ExerciseLogsService } from './exercise-logs.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [ExerciseLogsController],
  providers: [ExerciseLogsService, PrismaService],
  exports: [ExerciseLogsService],
})
export class ExerciseLogsModule {}
