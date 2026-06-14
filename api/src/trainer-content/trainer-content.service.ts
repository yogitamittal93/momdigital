import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { AppConfigService } from 'src/common/app-config.service';
import { CreateTrainerContentDto } from './dto/create-trainer-content.dto';

@Injectable()
export class TrainerContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly appConfig: AppConfigService,
  ) {}

  async create(authorId: string, dto: CreateTrainerContentDto) {
    const isPublished = dto.publish ?? false;
    const post = await this.prisma.trainerContent.create({
      data: {
        authorId,
        title: dto.title,
        body: dto.body,
        targetGroup: dto.targetGroup,
        mediaUrl: dto.mediaUrl,
        isPublished,
        publishedAt: isPublished ? new Date() : undefined,
      },
    });

    if (isPublished) {
      await this.incrementAndMaybeFeatured(authorId);
    }

    return post;
  }

  async publish(authorId: string, postId: string) {
    const post = await this.prisma.trainerContent.findFirst({
      where: { id: postId, authorId },
    });
    if (!post) throw new NotFoundException('Post not found');

    const updated = await this.prisma.trainerContent.update({
      where: { id: postId },
      data: { isPublished: true, publishedAt: new Date() },
    });

    await this.incrementAndMaybeFeatured(authorId);
    return updated;
  }

  async listPublic(targetGroup?: string) {
    return this.prisma.trainerContent.findMany({
      where: {
        isPublished: true,
        ...(targetGroup ? { targetGroup } : {}),
      },
      orderBy: { publishedAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            specialization: true,
            avatarUrl: true,
            isFeatured: true,
          },
        },
      },
    });
  }

  async listMine(authorId: string) {
    const posts = await this.prisma.trainerContent.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
    });

    const expert = await this.prisma.user.findUnique({
      where: { id: authorId },
      select: { contributionCount: true, isFeatured: true, role: true },
    });

    const quota = await this.appConfig.getNumber('FEATURED_CONTENT_QUOTA', 5);

    return {
      posts,
      stats: {
        published: expert?.contributionCount ?? 0,
        quota,
        isFeatured: expert?.isFeatured ?? false,
      },
    };
  }

  private async incrementAndMaybeFeatured(authorId: string) {
    const expert = await this.prisma.user.update({
      where: { id: authorId },
      data: { contributionCount: { increment: 1 } },
      select: { contributionCount: true, isFeatured: true, role: true },
    });

    if (!expert.isFeatured) {
      const quota = await this.appConfig.getNumber('FEATURED_CONTENT_QUOTA', 5);
      if (expert.contributionCount >= quota) {
        await this.prisma.user.update({
          where: { id: authorId },
          data: { isFeatured: true, featuredAt: new Date() },
        });
      }
    }
  }
}
