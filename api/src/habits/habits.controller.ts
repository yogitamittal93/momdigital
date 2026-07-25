import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtGuard, type JwtPayload } from 'src/auth/jwt.gaurd';
import { HabitsService } from './habits.service';
import {
  parseCreateHabitBody,
  parseLogHabitBody,
  parseUpdateHabitBody,
} from './habit.dto';

type AuthedRequest = Request & { user: JwtPayload };

@Controller('habits')
@UseGuards(JwtGuard)
export class HabitsController {
  private readonly logger = new Logger(HabitsController.name);

  constructor(private readonly habitsService: HabitsService) {}

  private userId(req: AuthedRequest): string {
    // JwtPayload uses userId; some older handlers incorrectly read `.id`.
    return req.user.userId;
  }

  /** GET /habits — list all active habits for the user */
  @Get()
  getHabits(@Req() req: AuthedRequest) {
    return this.habitsService.getHabits(this.userId(req));
  }

  /** POST /habits — create a new habit */
  @Post()
  createHabit(
    @Req() req: AuthedRequest,
    // Record<string, unknown> → ValidationPipe treats metatype as Object and
    // skips whitelist/forbidNonWhitelisted. We validate explicitly instead.
    @Body() body: Record<string, unknown>,
  ) {
    try {
      const dto = parseCreateHabitBody(body);
      return this.habitsService.createHabit(this.userId(req), dto);
    } catch (err) {
      this.logger.warn(
        `createHabit rejected for user=${this.userId(req)}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      throw err;
    }
  }

  /** PUT /habits/:id — update a habit */
  @Put(':id')
  updateHabit(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const dto = parseUpdateHabitBody(body);
    return this.habitsService.updateHabit(this.userId(req), id, dto);
  }

  /** DELETE /habits/:id — soft-delete a habit */
  @Delete(':id')
  deleteHabit(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.habitsService.deleteHabit(this.userId(req), id);
  }

  /** GET /habits/today — today's habits + completion for the dashboard widget */
  @Get('today')
  getTodaySummary(@Req() req: AuthedRequest) {
    return this.habitsService.getTodaySummary(this.userId(req));
  }

  /** GET /habits/week-stats — 7-day summary percentage */
  @Get('week-stats')
  getWeekStats(@Req() req: AuthedRequest) {
    return this.habitsService.getWeekStats(this.userId(req));
  }

  /** GET /habits/month?month=YYYY-MM — calendar data */
  @Get('month')
  getMonthData(
    @Req() req: AuthedRequest,
    @Query('month') month: string,
  ) {
    const m = month || new Date().toISOString().slice(0, 7);
    return this.habitsService.getMonthData(this.userId(req), m);
  }

  /** POST /habits/:id/log — mark a habit done for a date */
  @Post(':id/log')
  logHabit(
    @Req() req: AuthedRequest,
    @Param('id') habitId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const dto = parseLogHabitBody(body);
    return this.habitsService.logHabit(this.userId(req), habitId, dto);
  }

  /** DELETE /habits/:id/log/:date — undo a habit log */
  @Delete(':id/log/:date')
  deleteLog(
    @Req() req: AuthedRequest,
    @Param('id') habitId: string,
    @Param('date') date: string,
  ) {
    return this.habitsService.deleteLog(this.userId(req), habitId, date);
  }
}
