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
import { FeedingLogsService } from './feeding-logs.service';
import { CreateFeedingLogDto } from './dto/create-feeding-log.dto';

@Controller('feeding-logs')
@UseGuards(JwtGuard)
export class FeedingLogsController {
  constructor(private readonly feedingLogsService: FeedingLogsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Req() req: { user: { userId: string } },
    @Body() dto: CreateFeedingLogDto,
  ) {
    return this.feedingLogsService.create(req.user.userId, dto);
  }

  @Get()
  findByDate(
    @Req() req: { user: { userId: string } },
    @Query('date') date?: string,
  ) {
    return this.feedingLogsService.findByDate(req.user.userId, date);
  }
}
