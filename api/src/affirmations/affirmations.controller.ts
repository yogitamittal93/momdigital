import { BadRequestException, Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/jwt.gaurd';
import { PrismaService } from 'prisma/prisma.service';
import { AffirmationsService } from './affirmations.service';

@Controller('affirmations')
@UseGuards(JwtGuard)
export class AffirmationsController {
  constructor(
    private readonly affirmationsService: AffirmationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('generate')
  async generateCustom(@Body() body: { prompt?: string }) {
    if (!body?.prompt?.trim()) {
      throw new BadRequestException('Prompt is required');
    }

    return this.affirmationsService.generateCustomAffirmation(body.prompt);
  }

  @Get('daily')
  async getDaily(@Req() req: { user: { userId: string } }) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { name: true, dueDate: true, babyBirthDate: true },
    });

    return this.affirmationsService.getDailyAffirmation(user ?? {});
  }
}
