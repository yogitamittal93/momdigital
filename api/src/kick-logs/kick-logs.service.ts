import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateKickLogDto } from './dto/create-kick-log.dto';

@Injectable()
export class KickLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(userId: string, dto: CreateKickLogDto) {
    return this.prisma.kickLog.upsert({
      where: {
        userId_date: {
          userId,
          date: dto.date,
        },
      },
      update: {
        count: dto.count,
      },
      create: {
        userId,
        date: dto.date,
        count: dto.count,
      },
    });
  }

  async findForDate(userId: string, date: string) {
    return this.prisma.kickLog.findUnique({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
    });
  }
}
