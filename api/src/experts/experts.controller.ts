import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from 'src/auth/jwt.gaurd';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { ExpertsService } from './experts.service';

@Controller('experts')
export class ExpertsController {
  constructor(private readonly service: ExpertsService) {}

  /** Public — no auth required */
  @Get('featured')
  getFeatured() {
    return this.service.getFeatured();
  }

  // ─── Admin endpoints ───────────────────────────────────────────────────────

  @Get('pending')
  @UseGuards(JwtGuard, AdminGuard)
  getPending() {
    return this.service.getPending();
  }

  @Get()
  @UseGuards(JwtGuard, AdminGuard)
  getAll() {
    return this.service.getAll();
  }

  @Get('pii-audit')
  @UseGuards(JwtGuard, AdminGuard)
  getPiiAuditLog() {
    return this.service.getPiiAuditLog();
  }

  @Get('config')
  @UseGuards(JwtGuard, AdminGuard)
  getConfig() {
    return this.service.getConfig();
  }

  @Patch('config/:key')
  @UseGuards(JwtGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  setConfig(@Param('key') key: string, @Body() body: { value: string }) {
    return this.service.setConfig(key, body.value);
  }
}
