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
import { BloodPressureService } from './blood-pressure.service';
import { CreateBloodPressureDto } from './dto/blood-pressure.dto';

@Controller('blood-pressure')
@UseGuards(JwtGuard)
export class BloodPressureController {
  constructor(private readonly bpService: BloodPressureService) {}

  @Get()
  findAll(@Req() req: { user: { userId: string } }) {
    return this.bpService.findAll(req.user.userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Req() req: { user: { userId: string } },
    @Body() dto: CreateBloodPressureDto,
  ) {
    return this.bpService.create(req.user.userId, dto);
  }
}
