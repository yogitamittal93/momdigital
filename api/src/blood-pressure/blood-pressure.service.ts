import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateBloodPressureDto } from './dto/blood-pressure.dto';

@Injectable()
export class BloodPressureService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.bloodPressureLog.findMany({
      where: { userId },
      orderBy: { loggedAt: 'desc' },
    });
  }

  async create(userId: string, dto: CreateBloodPressureDto) {
    return this.prisma.bloodPressureLog.create({
      data: {
        userId,
        systolic: dto.systolic,
        diastolic: dto.diastolic,
        pulse: dto.pulse ?? null,
      },
    });
  }
}
