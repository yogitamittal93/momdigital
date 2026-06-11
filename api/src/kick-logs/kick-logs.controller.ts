import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from 'src/auth/jwt.gaurd';
import { KickLogsService } from './kick-logs.service';
import { CreateKickLogDto } from './dto/create-kick-log.dto';

@Controller('kick-logs')
@UseGuards(JwtGuard)
export class KickLogsController {
  constructor(private readonly kickLogsService: KickLogsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  upsert(
    @Req() req: { user: { userId: string } },
    @Body() dto: CreateKickLogDto,
  ) {
    return this.kickLogsService.upsert(req.user.userId, dto);
  }

  @Get()
  findForDate(
    @Req() req: { user: { userId: string } },
    @Query('date') date?: string,
  ) {
    const targetDate = date || new Date().toISOString().slice(0, 10);
    return this.kickLogsService.findForDate(req.user.userId, targetDate);
  }
}
