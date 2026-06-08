import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');
    const { password, ...safe } = user;
    return safe;
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    const data: any = { ...dto };

    // Convert date strings to Date objects for Prisma
    if (dto.dueDate) data.dueDate = new Date(dto.dueDate);
    if (dto.babyBirthDate) data.babyBirthDate = new Date(dto.babyBirthDate);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });
    const { password, ...safe } = user;
    return safe;
  }

  // Called by the maternity chat to patch specific fields
  // extracted from conversation (e.g. babyBirthDate, deliveryType)
  async patchFromChat(userId: string, extracted: Partial<UpdateUserDto>) {
    return this.updateMe(userId, extracted);
  }
}