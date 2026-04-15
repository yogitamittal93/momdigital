import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { AppConfigService } from 'src/common/app-config.service';
import { ExpertStatus, UserRole } from '@prisma/client';

@Injectable()
export class ExpertsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly appConfig: AppConfigService,
  ) {}

  /** Public: experts who have completed their quota */
  async getFeatured() {
    return this.prisma.user.findMany({
      where: { isFeatured: true, expertStatus: ExpertStatus.APPROVED },
      orderBy: { featuredAt: 'desc' },
      select: {
        id: true,
        name: true,
        role: true,
        specialization: true,
        externalLink: true,
        avatarUrl: true,
        isFeatured: true,
        featuredAt: true,
        contributionCount: true,
      },
    });
  }

  /** Admin: experts pending approval */
  async getPending() {
    return this.prisma.user.findMany({
      where: {
        expertStatus: ExpertStatus.PENDING_APPROVAL,
        role: { not: UserRole.MOTHER },
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        specialization: true,
        credentialUrl: true,
        createdAt: true,
      },
    });
  }

  /** Admin: all experts with full stats */
  async getAll() {
    return this.prisma.user.findMany({
      where: { role: { not: UserRole.MOTHER } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        expertStatus: true,
        specialization: true,
        contributionCount: true,
        isFeatured: true,
        credentialUrl: true,
        createdAt: true,
      },
    });
  }

  /** Admin: PII access audit log */
  async getPiiAuditLog() {
    return this.prisma.piiAuditLog.findMany({
      orderBy: { viewedAt: 'desc' },
      include: {
        expert: { select: { name: true, email: true, role: true } },
      },
    });
  }

  /** Admin: get all app config entries */
  async getConfig() {
    return this.appConfig.list();
  }

  /** Admin: update a config value */
  async setConfig(key: string, value: string) {
    await this.appConfig.set(key, value);
    return { key, value };
  }
}
