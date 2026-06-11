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
import { WeightLogsService } from './weight-logs.service';
import { CreateWeightLogDto } from './dto/create-weight-log.dto';

@Controller('weight-logs')
@UseGuards(JwtGuard)
export class WeightLogsController {
  constructor(private readonly weightLogsService: WeightLogsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Req() req: { user: { userId: string } },
    @Body() dto: CreateWeightLogDto,
  ) {
    return this.weightLogsService.create(req.user.userId, dto);
  }

  @Get()
  findAll(@Req() req: { user: { userId: string } }) {
    return this.weightLogsService.findAll(req.user.userId);
  }
}
