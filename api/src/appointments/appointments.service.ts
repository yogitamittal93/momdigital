import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from './dto/create-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.appointment.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });
  }

  create(userId: string, dto: CreateAppointmentDto) {
    return this.prisma.appointment.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        date: new Date(dto.date),
        location: dto.location,
        type: dto.type ?? 'CHECKUP',
        reminder: dto.reminder ?? true,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateAppointmentDto) {
    await this.assertOwner(userId, id);
    return this.prisma.appointment.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        date: dto.date ? new Date(dto.date) : undefined,
        location: dto.location,
        type: dto.type,
        reminder: dto.reminder,
        completed: dto.completed,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.assertOwner(userId, id);
    return this.prisma.appointment.delete({ where: { id } });
  }

  private async assertOwner(userId: string, id: string) {
    const row = await this.prisma.appointment.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Appointment not found');
    if (row.userId !== userId) throw new ForbiddenException();
  }
}