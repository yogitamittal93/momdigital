import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.gaurd';
import { AdminGuard } from '../common/guards/admin.guard';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  @UseGuards(JwtGuard, AdminGuard)
  async getSummary(@Req() req: { user?: { userId?: string } }) {
    return this.analyticsService.getSummary();
  }
}
