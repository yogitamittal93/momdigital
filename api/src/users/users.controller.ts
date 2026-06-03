import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@Req() req) {
    return this.usersService.getMe(req.user.userId);
  }

  @Patch('me')
  updateMe(@Req() req, @Body() dto: UpdateUserDto) {
    return this.usersService.updateMe(req.user.userId, dto);
  }
}