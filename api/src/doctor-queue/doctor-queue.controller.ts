import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { JwtGuard } from 'src/auth/jwt.gaurd';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { DoctorQueueService } from './doctor-queue.service';
import { DoctorSpecialty } from '@prisma/client';

@Controller('doctors')
@UseGuards(JwtGuard)
export class DoctorQueueController {
  constructor(private readonly doctorQueueService: DoctorQueueService) {}

  @Post('register')
  async register(
    @Req() req: { user: { id: string } },
    @Body()
    body: {
      specialization: DoctorSpecialty;
      registrationNo?: string;
      hospitalAffiliation?: string;
      yearsExperience?: number;
    },
  ) {
    return this.doctorQueueService.registerDoctor(req.user.id, body);
  }

  @Get('queue')
  async getQueue(@Req() req: { user: { id: string } }) {
    const profile = await this.doctorQueueService.getDoctorProfileByUserId(
      req.user.id,
    );
    if (!profile) {
      throw new NotFoundException('Doctor profile not found');
    }
    return this.doctorQueueService.getDoctorQueue(profile.id);
  }

  @Post('queue/:id/review')
  async submitReview(
    @Req() req: { user: { id: string } },
    @Param('id') reviewId: string,
    @Body()
    body: {
      approved: boolean;
      editedAnswer?: string;
      note?: string;
    },
  ) {
    const profile = await this.doctorQueueService.getDoctorProfileByUserId(
      req.user.id,
    );
    if (!profile) {
      throw new NotFoundException('Doctor profile not found');
    }
    return this.doctorQueueService.submitReview(reviewId, profile.id, body);
  }

  @Get('stats')
  async getStats(@Req() req: { user: { id: string } }) {
    const profile = await this.doctorQueueService.getDoctorProfileByUserId(
      req.user.id,
    );
    if (!profile) {
      throw new NotFoundException('Doctor profile not found');
    }
    return this.doctorQueueService.getDoctorStats(profile.id);
  }

  @Patch('availability')
  async setAvailability(
    @Req() req: { user: { id: string } },
    @Body() body: { isAvailable: boolean },
  ) {
    const profile = await this.doctorQueueService.getDoctorProfileByUserId(
      req.user.id,
    );
    if (!profile) {
      throw new NotFoundException('Doctor profile not found');
    }
    return this.doctorQueueService.setAvailability(
      profile.id,
      body.isAvailable,
    );
  }
}

@Controller('admin/doctors')
@UseGuards(JwtGuard, AdminGuard)
export class AdminDoctorsController {
  constructor(private readonly doctorQueueService: DoctorQueueService) {}

  @Get()
  getAll() {
    return this.doctorQueueService.getAllDoctors();
  }

  @Post(':id/approve')
  approve(@Param('id') id: string) {
    return this.doctorQueueService.approveDoctorRegistration(id);
  }
}
