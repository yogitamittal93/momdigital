import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Patch,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { JwtGuard, JwtPayload } from 'src/auth/jwt.gaurd';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ContentRequestsService } from './content-requests.service';
import { SubmitContentRequestDto } from './dto/submit-content-request.dto';
import { ReviewActionDto } from './dto/review-action.dto';

const CLINICIAN_ROLES = [
  UserRole.MBBS,
  UserRole.AYURVEDA,
  UserRole.NUTRITIONIST,
  UserRole.CHEF,
];

const ALL_EXPERT_ROLES = [
  ...CLINICIAN_ROLES,
  UserRole.YOGA_TRAINER,
  UserRole.WORKOUT_TRAINER,
];

@Controller('content-requests')
@UseGuards(JwtGuard)
export class ContentRequestsController {
  constructor(private readonly service: ContentRequestsService) {}

  // ─── Mother endpoints ──────────────────────────────────────────────────────

  @Post()
  submit(
    @Req() req: Request & { user: JwtPayload },
    @Body() dto: SubmitContentRequestDto,
  ) {
    return this.service.submit(req.user.userId, dto);
  }

  @Get()
  list(@Req() req: Request & { user: JwtPayload }) {
    return this.service.listForMother(req.user.userId);
  }

  // ─── Expert endpoints ──────────────────────────────────────────────────────

  @Get('queue')
  @UseGuards(RolesGuard)
  @Roles(...ALL_EXPERT_ROLES)
  getQueue(@Req() req: Request & { user: JwtPayload }) {
    return this.service.getQueue(req.user.userId);
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(...ALL_EXPERT_ROLES)
  getStats(@Req() req: Request & { user: JwtPayload }) {
    return this.service.getStats(req.user.userId);
  }

  @Get(':assignmentId/file')
  @UseGuards(RolesGuard)
  @Roles(...CLINICIAN_ROLES)
  async getScanFile(
    @Req() req: Request & { user: JwtPayload },
    @Param('assignmentId') assignmentId: string,
    @Res() res: Response,
  ) {
    const file = await this.service.getScanFile(req.user.userId, assignmentId);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${file.filename.replace(/"/g, '')}"`,
    );
    return res.send(file.fileBuffer);
  }

  @Post(':assignmentId/reveal-pii')
  @UseGuards(RolesGuard)
  @Roles(...CLINICIAN_ROLES)
  @HttpCode(HttpStatus.OK)
  revealPii(
    @Req() req: Request & { user: JwtPayload },
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.service.revealPii(req.user.userId, assignmentId);
  }

  @Patch(':assignmentId/approve')
  @UseGuards(RolesGuard)
  @Roles(...ALL_EXPERT_ROLES)
  @HttpCode(HttpStatus.OK)
  approve(
    @Req() req: Request & { user: JwtPayload },
    @Param('assignmentId') assignmentId: string,
    @Body() dto: ReviewActionDto,
  ) {
    return this.service.approve(req.user.userId, assignmentId, dto);
  }

  @Patch(':assignmentId/flag')
  @UseGuards(RolesGuard)
  @Roles(...ALL_EXPERT_ROLES)
  @HttpCode(HttpStatus.OK)
  flag(
    @Req() req: Request & { user: JwtPayload },
    @Param('assignmentId') assignmentId: string,
    @Body() dto: ReviewActionDto,
  ) {
    return this.service.flag(req.user.userId, assignmentId, dto);
  }

  @Patch(':assignmentId/note')
  @UseGuards(RolesGuard)
  @Roles(...ALL_EXPERT_ROLES)
  @HttpCode(HttpStatus.OK)
  addNote(
    @Req() req: Request & { user: JwtPayload },
    @Param('assignmentId') assignmentId: string,
    @Body() dto: ReviewActionDto,
  ) {
    return this.service.addNote(req.user.userId, assignmentId, dto);
  }
}
