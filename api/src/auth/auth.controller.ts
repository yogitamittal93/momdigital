import {
  Body,
  Controller,
  Post,
  Get,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { Response, Request } from 'express';
import { UseGuards } from '@nestjs/common';
import { JwtGuard } from './jwt.gaurd';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ✅ REGISTER
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // ✅ LOGIN (UPDATED)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);

    // ✅ ACCESS TOKEN COOKIE
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: false, // ⚠️ change to true in production
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 min
    });

    // ✅ REFRESH TOKEN COOKIE (IMPORTANT)
    res.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: false, // ⚠️ change to true in production
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // ❌ DO NOT return tokens
    return {
     message: 'Login successful',
      user: result.user,
    };
  }

  // ✅ REFRESH TOKEN (NEW)
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;

    const tokens = await this.authService.refreshAccessToken(refreshToken);

    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { message: 'Token refreshed' };
  }

  // ✅ CURRENT USER
@Get('me')
@UseGuards(JwtGuard)
async getMe(@Req() req: any) {
  return this.authService.getUserProfile(req.user.userId);
}
}