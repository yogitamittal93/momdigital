import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from 'src/auth/jwt.gaurd';
import { MoodLogsService } from './mood-logs.service';
import { CreateMoodLogDto } from './dto/create-mood-log.dto';

@Controller('mood-logs')
@UseGuards(JwtGuard)
export class MoodLogsController {
  constructor(private readonly moodLogsService: MoodLogsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Req() req: { user: { userId: string } },
    @Body() dto: CreateMoodLogDto,
  ) {
    return this.moodLogsService.create(req.user.userId, dto);
  }

  @Get()
  findAll(@Req() req: { user: { userId: string } }) {
    return this.moodLogsService.findAll(req.user.userId);
  }

  @Get('today')
  findToday(@Req() req: { user: { userId: string } }) {
    return this.moodLogsService.findToday(req.user.userId);
  }
}
