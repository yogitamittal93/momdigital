import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateMoodLogDto } from './dto/create-mood-log.dto';

@Injectable()
export class MoodLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateMoodLogDto) {
    return this.prisma.moodLog.create({
      data: {
        userId,
        mood: dto.mood,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.moodLog.findMany({
      where: { userId },
      orderBy: { loggedAt: 'desc' },
    });
  }

  async findToday(userId: string) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    return this.prisma.moodLog.findFirst({
      where: {
        userId,
        loggedAt: {
          gte: startOfToday,
          lt: endOfToday,
        },
      },
      orderBy: { loggedAt: 'desc' },
    });
  }
}
