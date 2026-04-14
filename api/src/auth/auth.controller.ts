import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Delete,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { Response, Request } from 'express';
import { UseGuards } from '@nestjs/common';
import { JwtGuard } from './jwt.gaurd';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private getCookieOptions(maxAge: number) {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ('none' as const) : ('lax' as const),
      maxAge,
      path: '/',
    };
  }

  private setSessionCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    res.cookie(
      'access_token',
      accessToken,
      this.getCookieOptions(15 * 60 * 1000),
    );
    res.cookie(
      'refresh_token',
      refreshToken,
      this.getCookieOptions(7 * 24 * 60 * 60 * 1000),
    );
  }

  private clearSessionCookies(res: Response) {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
  }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userAgentHeader = req.headers['user-agent'];
    const userAgent =
      typeof userAgentHeader === 'string' ? userAgentHeader : undefined;

    const result = await this.authService.login(
      dto,
      userAgent,
      req.ip,
    );
    this.setSessionCookies(res, result.access_token, result.refresh_token);

    return {
      message: 'Login successful',
      user: result.user,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;
    const tokens = await this.authService.refreshAccessToken(refreshToken);
    this.setSessionCookies(res, tokens.access_token, tokens.refresh_token);
    return { message: 'Token refreshed' };
  }

  @Get('me')
  @UseGuards(JwtGuard)
  async getMe(@Req() req: any) {
    return this.authService.getUserProfile(req.user.userId);
  }

  @Get('sessions')
  @UseGuards(JwtGuard)
  async getSessions(@Req() req: any) {
    return this.authService.listSessions(req.user.userId, req.user.sessionId);
  }

  @Post('logout')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  async logoutCurrentSession(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutSession(req.user.userId, req.user.sessionId);
    this.clearSessionCookies(res);
    return { message: 'Logged out from current device' };
  }

  @Delete('sessions/:sessionId')
  @UseGuards(JwtGuard)
  async logoutSpecificSession(@Req() req: any, @Param('sessionId') sessionId: string) {
    await this.authService.logoutSession(req.user.userId, sessionId);
    return { message: 'Session revoked' };
  }

  @Post('logout-all')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  async logoutAll(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    await this.authService.logoutAll(req.user.userId);
    this.clearSessionCookies(res);
    return { message: 'Logged out from all devices' };
  }
}