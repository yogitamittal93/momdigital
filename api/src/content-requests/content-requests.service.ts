import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { RoutingService } from 'src/routing/routing.service';
import { AppConfigService } from 'src/common/app-config.service';
import { SubmitContentRequestDto } from './dto/submit-content-request.dto';
import { ReviewActionDto } from './dto/review-action.dto';
import { ReviewStatus, UserRole } from '@prisma/client';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ContentRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly routing: RoutingService,
    private readonly appConfig: AppConfigService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Mother-facing ─────────────────────────────────────────────────────────

  async submit(userId: string, dto: SubmitContentRequestDto) {
    const context = dto.context ? JSON.parse(dto.context) : undefined;

    const { roles, mlResponse, mlConfidence } = await this.routing.route(
      dto.requestType,
      context,
    );

    // Create the ContentRequest
    const request = await this.prisma.contentRequest.create({
      data: {
        requestType: dto.requestType,
        uploadedById: userId,
        scanReportId: dto.scanReportId,
        questionText: dto.questionText,
        context,
        routedRoles: roles,
        mlResponse,
        mlConfidence,
        status: mlResponse ? ReviewStatus.ML_REVIEWED : ReviewStatus.PENDING,
      },
    });

    // Find approved experts in the target roles and create assignments
    const experts = await this.prisma.user.findMany({
      where: {
        role: { in: roles },
        expertStatus: 'APPROVED',
      },
      select: { id: true },
    });

    if (experts.length > 0) {
      await this.prisma.expertAssignment.createMany({
        data: experts.map((e) => ({
          requestId: request.id,
          expertId: e.id,
        })),
        skipDuplicates: true,
      });
    }

    return request;
  }

  async listForMother(userId: string) {
    return this.prisma.contentRequest.findMany({
      where: { uploadedById: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        requestType: true,
        questionText: true,
        status: true,
        mlResponse: true,
        routedRoles: true,
        createdAt: true,
        assignments: {
          select: {
            status: true,
            expertNote: true,
            reviewedAt: true,
            expert: {
              select: { name: true, role: true, specialization: true },
            },
          },
        },
      },
    });
  }

  // ─── Expert-facing ─────────────────────────────────────────────────────────

  async getQueue(expertId: string, expertRole: UserRole) {
    return this.prisma.expertAssignment.findMany({
      where: {
        expertId,
        status: ReviewStatus.PENDING,
      },
      orderBy: { createdAt: 'asc' },
      include: {
        request: {
          select: {
            id: true,
            requestType: true,
            questionText: true,
            mlResponse: true,
            mlConfidence: true,
            status: true,
            createdAt: true,
            // Anonymised: no name/email from uploadedBy
            uploadedBy: {
              select: { id: true, dueDate: true, babyBirthDate: true },
            },
            scanReport: {
              select: { id: true, originalName: true, mimeType: true, createdAt: true },
            },
          },
        },
      },
    });
  }

  async getStats(expertId: string) {
    const expert = await this.prisma.user.findUnique({
      where: { id: expertId },
      select: {
        contributionCount: true,
        isFeatured: true,
        role: true,
      },
    });

    if (!expert) throw new NotFoundException('Expert not found');

    const quotaKey =
      expert.role === UserRole.YOGA_TRAINER ||
      expert.role === UserRole.WORKOUT_TRAINER
        ? 'FEATURED_CONTENT_QUOTA'
        : 'FEATURED_REVIEW_QUOTA';

    const quota = await this.appConfig.getNumber(quotaKey, 40);

    return {
      reviewed: expert.contributionCount,
      quota,
      isFeatured: expert.isFeatured,
      remaining: Math.max(0, quota - expert.contributionCount),
    };
  }

  async getScanFile(expertId: string, assignmentId: string) {
    const assignment = await this.prisma.expertAssignment.findFirst({
      where: { id: assignmentId, expertId },
      include: {
        request: {
          include: { scanReport: true },
        },
      },
    });

    if (!assignment) throw new NotFoundException('Assignment not found');

    const scan = assignment.request.scanReport;
    if (!scan) throw new NotFoundException('No scan attached to this request');

    const uploadDir =
      this.configService.get<string>('SCAN_UPLOAD_DIR') ?? 'uploads/scans';
    const fileBuffer = await readFile(join(uploadDir, scan.storedName));
    return { fileBuffer, mimeType: scan.mimeType, filename: scan.originalName };
  }

  async revealPii(expertId: string, assignmentId: string) {
    const assignment = await this.prisma.expertAssignment.findFirst({
      where: { id: assignmentId, expertId },
      include: { request: { select: { id: true, uploadedById: true } } },
    });

    if (!assignment) throw new NotFoundException('Assignment not found');

    const now = new Date();

    // Record PII access in the assignment row
    await this.prisma.expertAssignment.update({
      where: { id: assignmentId },
      data: { piViewedAt: now },
    });

    // Create immutable audit log
    await this.prisma.piiAuditLog.create({
      data: {
        expertId,
        requestId: assignment.request.id,
      },
    });

    // Return full mother profile (admin is notified via audit log — 
    // real-time notification can be added when notification service exists)
    const mother = await this.prisma.user.findUnique({
      where: { id: assignment.request.uploadedById },
      select: { name: true, email: true, dueDate: true, babyBirthDate: true },
    });

    return { patient: mother };
  }

  // ─── Review Actions ────────────────────────────────────────────────────────

  async approve(expertId: string, assignmentId: string, dto: ReviewActionDto) {
    return this.performAction(expertId, assignmentId, ReviewStatus.APPROVED, dto.note);
  }

  async flag(expertId: string, assignmentId: string, dto: ReviewActionDto) {
    return this.performAction(expertId, assignmentId, ReviewStatus.FLAGGED, dto.note);
  }

  async addNote(expertId: string, assignmentId: string, dto: ReviewActionDto) {
    if (!dto.note) {
      throw new ForbiddenException('Note text is required');
    }
    return this.performAction(expertId, assignmentId, ReviewStatus.NEEDS_MORE_INFO, dto.note);
  }

  private async performAction(
    expertId: string,
    assignmentId: string,
    status: ReviewStatus,
    note?: string,
  ) {
    const assignment = await this.prisma.expertAssignment.findFirst({
      where: { id: assignmentId, expertId },
    });

    if (!assignment) throw new NotFoundException('Assignment not found');

    const updated = await this.prisma.expertAssignment.update({
      where: { id: assignmentId },
      data: {
        status,
        expertNote: note,
        reviewedAt: new Date(),
      },
    });

    // Increment contributionCount on APPROVED only
    if (status === ReviewStatus.APPROVED) {
      const expert = await this.prisma.user.update({
        where: { id: expertId },
        data: { contributionCount: { increment: 1 } },
        select: {
          contributionCount: true,
          isFeatured: true,
          role: true,
        },
      });

      await this.maybeSetFeatured(expertId, expert);
    }

    return updated;
  }

  private async maybeSetFeatured(
    expertId: string,
    expert: { contributionCount: number; isFeatured: boolean; role: UserRole },
  ) {
    if (expert.isFeatured) return;

    const quotaKey =
      expert.role === UserRole.YOGA_TRAINER ||
      expert.role === UserRole.WORKOUT_TRAINER
        ? 'FEATURED_CONTENT_QUOTA'
        : 'FEATURED_REVIEW_QUOTA';

    const quota = await this.appConfig.getNumber(quotaKey, 40);

    if (expert.contributionCount >= quota) {
      await this.prisma.user.update({
        where: { id: expertId },
        data: { isFeatured: true, featuredAt: new Date() },
      });
    }
  }
}
