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
import { WellnessLogsService } from './wellness-logs.service';
import { ToggleWellnessDto } from './dto/wellness-log.dto';

@Controller('wellness-logs')
@UseGuards(JwtGuard)
export class WellnessLogsController {
  constructor(private readonly wellnessLogsService: WellnessLogsService) {}

  @Get()
  findByMonth(
    @Req() req: { user: { userId: string } },
    @Query('month') month?: string,
  ) {
    return this.wellnessLogsService.findByMonth(req.user.userId, month);
  }

  @Post('toggle')
  @HttpCode(HttpStatus.OK)
  toggle(
    @Req() req: { user: { userId: string } },
    @Body() dto: ToggleWellnessDto,
  ) {
    return this.wellnessLogsService.toggle(req.user.userId, dto);
  }
}
