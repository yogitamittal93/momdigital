import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtGuard as JwtAuthGuard, JwtPayload } from 'src/auth/jwt.gaurd';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@Req() req: Request & { user: JwtPayload }) {
    return this.usersService.getMe(req.user.userId);
  }

  @Patch('me')
  updateMe(
    @Req() req: Request & { user: JwtPayload },
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateMe(req.user.userId, dto);
  }
}
