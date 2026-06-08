import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/jwt.gaurd';
import { PrismaService } from 'prisma/prisma.service';
import { AffirmationsService } from './affirmations.service';
import { IsOptional, IsString } from 'class-validator';

class GenerateAffirmationDto {
  @IsOptional() @IsString() mood?: string;
  @IsOptional() @IsString() intention?: string;
}

@Controller('affirmations')
@UseGuards(JwtGuard)
export class AffirmationsController {
  constructor(
    private readonly affirmationsService: AffirmationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('daily')
  async getDaily(@Req() req: { user: { userId: string } }) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { name: true, dueDate: true, babyBirthDate: true },
    });
    return this.affirmationsService.getDailyAffirmation(user ?? {});
  }

  /**
   * POST /affirmations/generate
   * Generates a personalised affirmation using Groq directly.
   * Does NOT go through the ML service / RAG pipeline — lightweight call.
   */
  @Post('generate')
  async generate(
    @Req() req: { user: { userId: string } },
    @Body() dto: GenerateAffirmationDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { name: true, dueDate: true, babyBirthDate: true },
    });
    return this.affirmationsService.generatePersonalised(user ?? {}, dto);
  }
}
