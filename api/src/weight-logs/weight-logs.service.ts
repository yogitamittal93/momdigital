import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateWeightLogDto } from './dto/create-weight-log.dto';

@Injectable()
export class WeightLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateWeightLogDto) {
    return this.prisma.weightLog.create({
      data: {
        userId,
        weight: dto.weight,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.weightLog.findMany({
      where: { userId },
      orderBy: { loggedAt: 'desc' },
    });
  }
}
