import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtGuard, JwtPayload } from 'src/auth/jwt.gaurd';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { TrainerContentService } from './trainer-content.service';
import { CreateTrainerContentDto } from './dto/create-trainer-content.dto';

const TRAINER_ROLES = [UserRole.YOGA_TRAINER, UserRole.WORKOUT_TRAINER];

@Controller('trainer-content')
export class TrainerContentController {
  constructor(private readonly service: TrainerContentService) {}

  /** Public feed — no auth required */
  @Get()
  listPublic(@Query('targetGroup') targetGroup?: string) {
    return this.service.listPublic(targetGroup);
  }

  /** Trainer: create a new post (can set publish: true to publish immediately) */
  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(...TRAINER_ROLES)
  create(
    @Req() req: Request & { user: JwtPayload },
    @Body() dto: CreateTrainerContentDto,
  ) {
    return this.service.create(req.user.userId, dto);
  }

  /** Trainer: list own posts with stats */
  @Get('my')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(...TRAINER_ROLES)
  listMine(@Req() req: Request & { user: JwtPayload }) {
    return this.service.listMine(req.user.userId);
  }

  /** Trainer: publish a draft post */
  @Patch(':postId/publish')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(...TRAINER_ROLES)
  @HttpCode(HttpStatus.OK)
  publish(
    @Req() req: Request & { user: JwtPayload },
    @Param('postId') postId: string,
  ) {
    return this.service.publish(req.user.userId, postId);
  }
}
