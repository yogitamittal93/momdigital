import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { DoctorSpecialty, ApprovedAnswer } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class DoctorQueueService {
  constructor(private readonly prisma: PrismaService) {}

  async queueForReview(params: {
    contentRequestId: string;
    originalAnswer: string;
    category: string;
    confidence: string;
  }) {
    const specialty = this.mapCategoryToSpecialty(params.category);

    const availableDoctor = await this.prisma.doctorProfile.findFirst({
      where: {
        specialization: specialty,
        isAvailable: true,
      },
      orderBy: { reviewsCompleted: 'asc' },
    });

    if (!availableDoctor) {
      return {
        status: 'PENDING_DOCTOR_AVAILABILITY',
        message: 'No doctor currently available. Answer held for review.',
        reviewId: null,
      };
    }

    const review = await this.prisma.doctorReview.create({
      data: {
        doctorProfileId: availableDoctor.id,
        contentRequestId: params.contentRequestId,
        originalAnswer: params.originalAnswer,
        status: 'PENDING',
      },
    });

    return {
      status: 'QUEUED_FOR_REVIEW',
      reviewId: review.id,
      estimatedResponseHours: availableDoctor.avgResponseHours ?? 24,
    };
  }

  async submitReview(
    reviewId: string,
    doctorProfileId: string,
    params: {
      approved: boolean;
      editedAnswer?: string;
      note?: string;
    },
  ) {
    const existing = await this.prisma.doctorReview.findUnique({
      where: { id: reviewId },
    });

    if (!existing) {
      throw new NotFoundException('Review not found');
    }

    if (existing.doctorProfileId !== doctorProfileId) {
      throw new ForbiddenException('Not assigned to this review');
    }

    const review = await this.prisma.doctorReview.update({
      where: { id: reviewId },
      data: {
        status: params.approved ? 'APPROVED' : 'FLAGGED',
        reviewedAnswer: params.editedAnswer ?? undefined,
        doctorNote: params.note,
        reviewedAt: new Date(),
      },
    });

    await this.prisma.doctorProfile.update({
      where: { id: doctorProfileId },
      data: { reviewsCompleted: { increment: 1 } },
    });

    if (params.approved) {
      const contentRequest = await this.prisma.contentRequest.findUnique({
        where: { id: review.contentRequestId },
      });

      if (contentRequest?.questionText) {
        const hash = this.hashQuestion(contentRequest.questionText);
        const ctx = (contentRequest.context as Record<string, unknown>) ?? {};
        const category =
          typeof ctx.category === 'string' ? ctx.category : 'general';
        const sources = Array.isArray(ctx.sources)
          ? (ctx.sources as string[])
          : [];

        await this.prisma.approvedAnswer.upsert({
          where: { questionHash: hash },
          create: {
            questionHash: hash,
            question: contentRequest.questionText,
            answer: params.editedAnswer || review.originalAnswer,
            approvedBy: doctorProfileId,
            category,
            sources,
          },
          update: {
            answer: params.editedAnswer || review.originalAnswer,
            approvedBy: doctorProfileId,
            approvedAt: new Date(),
          },
        });
      }
    }

    return review;
  }

  async getApprovedAnswer(question: string): Promise<ApprovedAnswer | null> {
    const hash = this.hashQuestion(question);
    const approved = await this.prisma.approvedAnswer.findUnique({
      where: { questionHash: hash },
    });

    if (approved) {
      await this.prisma.approvedAnswer.update({
        where: { id: approved.id },
        data: { useCount: { increment: 1 } },
      });
    }

    return approved;
  }

  async registerDoctor(
    userId: string,
    data: {
      specialization: DoctorSpecialty;
      registrationNo?: string;
      hospitalAffiliation?: string;
      yearsExperience?: number;
    },
  ) {
    return this.prisma.doctorProfile.upsert({
      where: { userId },
      create: {
        userId,
        specialization: data.specialization,
        registrationNo: data.registrationNo,
        hospitalAffiliation: data.hospitalAffiliation,
        yearsExperience: data.yearsExperience,
        isAvailable: false,
      },
      update: {
        specialization: data.specialization,
        registrationNo: data.registrationNo,
        hospitalAffiliation: data.hospitalAffiliation,
        yearsExperience: data.yearsExperience,
      },
    });
  }

  async getDoctorQueue(doctorProfileId: string) {
    return this.prisma.doctorReview.findMany({
      where: {
        doctorProfileId,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'asc' },
      include: {
        contentRequest: {
          select: {
            questionText: true,
            context: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async getDoctorStats(doctorProfileId: string) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { id: doctorProfileId },
      include: {
        reviews: {
          where: { status: { in: ['APPROVED', 'FLAGGED'] } },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Doctor profile not found');
    }

    const approved = profile.reviews.filter(
      (r) => r.status === 'APPROVED',
    ).length;
    const flagged = profile.reviews.filter(
      (r) => r.status === 'FLAGGED',
    ).length;

    return {
      reviewsCompleted: profile.reviewsCompleted,
      approved,
      flagged,
      isAvailable: profile.isAvailable,
      avgResponseHours: profile.avgResponseHours,
    };
  }

  async setAvailability(doctorProfileId: string, isAvailable: boolean) {
    return this.prisma.doctorProfile.update({
      where: { id: doctorProfileId },
      data: { isAvailable },
    });
  }

  async getAllDoctors() {
    return this.prisma.doctorProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            expertStatus: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveDoctorRegistration(doctorProfileId: string) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { id: doctorProfileId },
      include: { user: true },
    });

    if (!profile) {
      throw new NotFoundException('Doctor profile not found');
    }

    await this.prisma.user.update({
      where: { id: profile.userId },
      data: { expertStatus: 'APPROVED' },
    });

    return profile;
  }

  async getDoctorProfileByUserId(userId: string) {
    return this.prisma.doctorProfile.findUnique({ where: { userId } });
  }

  hashQuestion(question: string): string {
    const normalised = question
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return crypto.createHash('md5').update(normalised).digest('hex');
  }

  private mapCategoryToSpecialty(category: string): DoctorSpecialty {
    const map: Record<string, DoctorSpecialty> = {
      maternal: 'OBGYN',
      pediatric: 'PEDIATRICIAN',
      ayurvedic: 'AYURVEDA_VAIDYA',
      nutrition: 'NUTRITIONIST',
    };
    return map[category] ?? 'GENERAL_PHYSICIAN';
  }
}
