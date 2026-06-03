import { Module } from '@nestjs/common';
import { DoctorQueueService } from './doctor-queue.service';
import {
  DoctorQueueController,
  AdminDoctorsController,
} from './doctor-queue.controller';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [DoctorQueueController, AdminDoctorsController],
  providers: [DoctorQueueService, PrismaService],
  exports: [DoctorQueueService],
})
export class DoctorQueueModule {}
