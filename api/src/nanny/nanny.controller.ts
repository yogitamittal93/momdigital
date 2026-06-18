import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from 'src/auth/jwt.gaurd';
import { NannyService } from './nanny.service';

@Controller('nanny')
@UseGuards(JwtGuard)
export class NannyController {
  constructor(private readonly nannyService: NannyService) {}

  // ── Original checklist endpoints ──────────────────────────────────────────

  @Post('checklists')
  create(
    @Req() req: { user: { id: string } },
    @Body() body: { nannyName?: string },
  ) {
    return this.nannyService.createChecklist(req.user.id, body.nannyName);
  }

  @Get('checklists')
  list(@Req() req: { user: { id: string } }) {
    return this.nannyService.listChecklists(req.user.id);
  }

  @Get('checklists/:id')
  getOne(@Req() req: { user: { id: string } }, @Param('id') id: string) {
    return this.nannyService.ensureTodayLogs(id, req.user.id);
  }

  @Patch('checklists/:id/checks')
  toggle(
    @Req() req: { user: { id: string } },
    @Param('id') id: string,
    @Body()
    body: {
      checkItem: string;
      dayNumber: number;
      completed: boolean;
      note?: string;
    },
  ) {
    return this.nannyService.toggleCheck(
      id,
      req.user.id,
      body.checkItem,
      body.dayNumber,
      body.completed,
      body.note,
    );
  }

  // ── Scored check endpoints (used by nanny + chef tabs) ────────────────────

  /**
   * POST /nanny/check
   * Save a scored daily check for a nanny or chef.
   * Body: { helperType: "nanny"|"chef", checks: Record<string,boolean>, score: number, notes?: string }
   */
  @Post('check')
  saveCheck(
    @Req() req: { user: { userId: string } },
    @Body()
    body: {
      helperType: string;
      checks: Record<string, boolean>;
      score: number;
      notes?: string;
    },
  ) {
    return this.nannyService.saveCheck(
      req.user.userId,
      body.helperType,
      body.checks,
      body.score,
      body.notes,
    );
  }

  /**
   * GET /nanny/check?helperType=nanny&limit=10
   * Fetch recent saved checks for the authenticated user.
   */
  @Get('check')
  getChecks(
    @Req() req: { user: { userId: string } },
    @Query('helperType') helperType?: string,
    @Query('limit') limit?: string,
  ) {
    return this.nannyService.getChecks(
      req.user.userId,
      helperType,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  /**
   * GET /nanny/caregiver?helperType=nanny|chef
   * Fetch all caregivers of the specified helperType for the logged-in user.
   */
  @Get('caregiver')
  listCaregivers(
    @Req() req: { user: { userId: string } },
    @Query('helperType') helperType: string,
  ) {
    return this.nannyService.listCaregivers(req.user.userId, helperType);
  }

  /**
   * POST /nanny/caregiver
   * Register and assign a new caregiver.
   * Body: { name: string, helperType: string }
   */
  @Post('caregiver')
  createCaregiver(
    @Req() req: { user: { userId: string } },
    @Body() body: { name: string; helperType: string },
  ) {
    return this.nannyService.createCaregiver(
      req.user.userId,
      body.helperType,
      body.name,
    );
  }

  /**
   * POST /nanny/caregiver/:id/reset
   * Reset the trust streak and status of a caregiver.
   */
  @Post('caregiver/:id/reset')
  resetStreak(
    @Req() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.nannyService.resetCaregiverStreak(req.user.userId, id);
  }
}
