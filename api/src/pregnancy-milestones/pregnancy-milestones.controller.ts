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
import { PregnancyMilestonesService } from './pregnancy-milestones.service';
import { ToggleMilestoneDto } from './dto/milestone.dto';

@Controller('pregnancy-milestones')
@UseGuards(JwtGuard)
export class PregnancyMilestonesController {
  constructor(private readonly milestonesService: PregnancyMilestonesService) {}

  @Get()
  findAll(@Req() req: { user: { userId: string } }) {
    return this.milestonesService.findAll(req.user.userId);
  }

  @Post('toggle')
  @HttpCode(HttpStatus.OK)
  toggle(
    @Req() req: { user: { userId: string } },
    @Body() dto: ToggleMilestoneDto,
  ) {
    return this.milestonesService.toggle(req.user.userId, dto);
  }
}
