import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

export class CreateAppointmentDto {
  title: string;
  doctorName?: string;
  location?: string;
  date?: string;
  dateTime?: string;
  description?: string;
  notes?: string;
  reminder?: boolean;
}

export class UpdateAppointmentDto {
  title?: string;
  doctorName?: string;
  location?: string;
  date?: string;
  dateTime?: string;
  description?: string;
  notes?: string;
  reminder?: boolean;
  completed?: boolean;
}

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.appointment.findMany({
      where: { userId },
      orderBy: { dateTime: 'asc' },
    });
  }

  create(userId: string, dto: CreateAppointmentDto) {
    const rawDate = dto.date ?? dto.dateTime;
    return this.prisma.appointment.create({
      data: {
        userId,
        title: dto.title,
        notes: dto.description ?? dto.notes,
        dateTime: rawDate ? new Date(rawDate) : new Date(),
        location: dto.location,
        doctorName: dto.doctorName,
        reminded: dto.reminder ?? false,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateAppointmentDto) {
    await this.assertOwner(userId, id);
    const rawDate = dto.date ?? dto.dateTime;
    return this.prisma.appointment.update({
      where: { id },
      data: {
        ...(dto.title     && { title: dto.title }),
        ...(dto.doctorName !== undefined && { doctorName: dto.doctorName }),
        ...(dto.location  !== undefined && { location: dto.location }),
        ...(rawDate       && { dateTime: new Date(rawDate) }),
        ...((dto.description ?? dto.notes) !== undefined && {
          notes: dto.description ?? dto.notes,
        }),
        ...(dto.reminder  !== undefined && { reminded: dto.reminder }),
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
