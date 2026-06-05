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
import { ExerciseLogsService } from './exercise-logs.service';
import { CreateExerciseLogDto } from './dto/exercise-log.dto';

@Controller('exercise-logs')
@UseGuards(JwtGuard)
export class ExerciseLogsController {
  constructor(private readonly exerciseLogsService: ExerciseLogsService) {}

  /**
   * POST /exercise-logs
   * Mark one exercise as complete.
   *
   * Body: { exerciseId: string, phase: "pregnancy"|"postpartum", durationMins?: number }
   * Returns the created ExerciseLog record.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Req() req: { user: { userId: string } },
    @Body() dto: CreateExerciseLogDto,
  ) {
    return this.exerciseLogsService.create(req.user.userId, dto);
  }

  /**
   * GET /exercise-logs?month=YYYY-MM
   * Returns all logs for the given month (defaults to current month)
   * plus a calendarDays map for the heatmap.
   *
   * Response:
   *   {
   *     logs: ExerciseLog[],
   *     calendarDays: { "2025-06-04": ["deep-belly-breathing"], ... }
   *   }
   */
  @Get()
  findByMonth(
    @Req() req: { user: { userId: string } },
    @Query('month') month?: string,
  ) {
    return this.exerciseLogsService.findByMonth(req.user.userId, month);
  }

  /**
   * GET /exercise-logs/streak
   * Returns how many consecutive days (ending today) the user completed
   * at least one exercise.  Used for the "🔥 X day streak" badge.
   *
   * Response: { streak: number }
   */
  @Get('streak')
  async getStreak(@Req() req: { user: { userId: string } }) {
    const streak = await this.exerciseLogsService.getStreak(req.user.userId);
    return { streak };
  }
}
