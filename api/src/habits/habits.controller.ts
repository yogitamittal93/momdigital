import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from 'src/auth/jwt.gaurd';
import { HabitsService } from './habits.service';

// Re-export interfaces as classes for NestJS emitDecoratorMetadata compatibility
export class CreateHabitBody {
  name!: string;
  emoji?: string;
  category?: string;
  color?: string;
  targetQuantity?: number;
  unit?: string;
  sortOrder?: number;
  hasLoadingPhase?: boolean;
  loadingPhaseDays?: number;
  loadingStartDate?: string;
}

export class LogHabitBody {
  date!: string;
  quantity?: number;
}

@Controller('habits')
@UseGuards(JwtGuard)
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  /** GET /habits — list all active habits for the user */
  @Get()
  getHabits(@Req() req: { user: { id: string } }) {
    return this.habitsService.getHabits(req.user.id);
  }

  /** POST /habits — create a new habit */
  @Post()
  createHabit(
    @Req() req: { user: { id: string } },
    @Body() dto: CreateHabitBody,
  ) {
    return this.habitsService.createHabit(req.user.id, dto);
  }

  /** PUT /habits/:id — update a habit */
  @Put(':id')
  updateHabit(
    @Req() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: Partial<CreateHabitBody>,
  ) {
    return this.habitsService.updateHabit(req.user.id, id, dto);
  }

  /** DELETE /habits/:id — soft-delete a habit */
  @Delete(':id')
  deleteHabit(
    @Req() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.habitsService.deleteHabit(req.user.id, id);
  }

  /** GET /habits/today — today's habits + completion for the dashboard widget */
  @Get('today')
  getTodaySummary(@Req() req: { user: { id: string } }) {
    return this.habitsService.getTodaySummary(req.user.id);
  }

  /** GET /habits/week-stats — 7-day summary percentage */
  @Get('week-stats')
  getWeekStats(@Req() req: { user: { id: string } }) {
    return this.habitsService.getWeekStats(req.user.id);
  }

  /** GET /habits/month?month=YYYY-MM — calendar data */
  @Get('month')
  getMonthData(
    @Req() req: { user: { id: string } },
    @Query('month') month: string,
  ) {
    const m = month || new Date().toISOString().slice(0, 7);
    return this.habitsService.getMonthData(req.user.id, m);
  }

  /** POST /habits/:id/log — mark a habit done for a date */
  @Post(':id/log')
  logHabit(
    @Req() req: { user: { id: string } },
    @Param('id') habitId: string,
    @Body() dto: LogHabitBody,
  ) {
    return this.habitsService.logHabit(req.user.id, habitId, dto);
  }

  /** DELETE /habits/:id/log/:date — undo a habit log */
  @Delete(':id/log/:date')
  deleteLog(
    @Req() req: { user: { id: string } },
    @Param('id') habitId: string,
    @Param('date') date: string,
  ) {
    return this.habitsService.deleteLog(req.user.id, habitId, date);
  }
}
