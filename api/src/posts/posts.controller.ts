import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import type { Request } from 'express';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtGuard, JwtPayload } from 'src/auth/jwt.gaurd';

@Controller('posts')
@UseGuards(JwtGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // ── Posts ─────────────────────────────────────────────────────────────────

  /** GET /api/posts?page=1&limit=20 */
  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.postsService.findAll(page, Math.min(limit, 100));
  }

  /** GET /api/posts/:id */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  /** POST /api/posts */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Req() req: Request & { user: JwtPayload },
    @Body() dto: CreatePostDto,
  ) {
    return this.postsService.create(req.user.userId, dto);
  }

  /** POST /api/posts/:id/like — toggle */
  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  like(@Param('id') id: string, @Req() req: Request & { user: JwtPayload }) {
    return this.postsService.toggleLike(id, req.user.userId);
  }

  // ── Comments ──────────────────────────────────────────────────────────────

  /** GET /api/posts/:id/comments */
  @Get(':id/comments')
  listComments(@Param('id') postId: string) {
    return this.postsService.listComments(postId);
  }

  /** POST /api/posts/:id/comments */
  @Post(':id/comments')
  @HttpCode(HttpStatus.CREATED)
  addComment(
    @Param('id') postId: string,
    @Req() req: Request & { user: JwtPayload },
    @Body() dto: CreateCommentDto,
  ) {
    return this.postsService.createComment(
      postId,
      req.user.userId,
      dto.content,
    );
  }

  /** DELETE /api/posts/:postId/comments/:commentId */
  @Delete(':postId/comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteComment(
    @Param('commentId') commentId: string,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.postsService.deleteComment(commentId, req.user.userId);
  }
}
