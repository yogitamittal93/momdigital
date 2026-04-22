import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { randomUUID } from 'crypto';

/** Shape returned to the frontend — matches the Post Zod schema */
export interface PostResponse {
  id: string;
  content: string;
  category: string | null;
  authorId: string;
  author: { id: string; name: string; avatarUrl: string | null } | null;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── helpers ─────────────────────────────────────────────────────────────────

  /** Attach a `likes` count directly on the post object */
  private async withLikes(post: {
    id: string;
    content: string;
    category: string | null;
    authorId: string;
    author: { id: string; name: string; avatarUrl: string | null } | null;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<PostResponse> {
    const count = await this.prisma.postLike.count({
      where: { postId: post.id },
    });
    return { ...post, likes: count };
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────────

  async create(authorId: string, dto: CreatePostDto): Promise<PostResponse> {
    const post = await this.prisma.communityPost.create({
      data: {
        id: randomUUID(),
        authorId,
        content: dto.content,
        category: dto.category ?? null,
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
    return this.withLikes(post);
  }

  async findAll(page = 1, limit = 20): Promise<PostResponse[]> {
    const skip = (page - 1) * limit;
    const posts = await this.prisma.communityPost.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
    return Promise.all(posts.map((p) => this.withLikes(p)));
  }

  async findOne(id: string): Promise<PostResponse> {
    const post = await this.prisma.communityPost.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
    if (!post) throw new NotFoundException('Post not found');
    return this.withLikes(post);
  }

  async toggleLike(
    postId: string,
    userId: string,
  ): Promise<{ liked: boolean }> {
    const existing = await this.prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      await this.prisma.postLike.delete({
        where: { postId_userId: { postId, userId } },
      });
      return { liked: false };
    }

    await this.prisma.postLike.create({
      data: { id: randomUUID(), postId, userId },
    });
    return { liked: true };
  }
}
