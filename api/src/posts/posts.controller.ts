import {
  Controller,
  Get,
  Post,
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
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtGuard } from 'src/auth/jwt.gaurd';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  /** GET /api/posts?page=1&limit=20  — public feed */
  @Get()
  @UseGuards(JwtGuard)
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.postsService.findAll(page, Math.min(limit, 100));
  }

  /** GET /api/posts/:id */
  @Get(':id')
  @UseGuards(JwtGuard)
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  /** POST /api/posts */
  @Post()
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@Req() req: any, @Body() dto: CreatePostDto) {
    return this.postsService.create(req.user.userId, dto);
  }

  /** POST /api/posts/:id/like  — toggle like */
  @Post(':id/like')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  like(@Param('id') id: string, @Req() req: any) {
    return this.postsService.toggleLike(id, req.user.userId);
  }
}
