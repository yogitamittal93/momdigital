import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Delete,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterExpertDto } from './dto/register-expert.dto';

class ForgotPasswordDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;
}

class ResetPasswordDto {
  @IsNotEmpty({ message: 'Token is required' })
  token!: string;

  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;
}
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CareerPlanDto } from './dto/career-plan.dto';
import type { Response, Request } from 'express';
import { JwtPayload } from './jwt.gaurd';
import { UseGuards } from '@nestjs/common';
import { JwtGuard } from './jwt.gaurd';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { GoogleOAuthGuard, GitHubOAuthGuard } from './guards/oauth.guard';
import { PrismaService } from 'prisma/prisma.service';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private getCookieOptions(maxAge: number) {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
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
    const cookieOptions = this.getCookieOptions(15 * 60 * 1000);
    res.cookie('access_token', accessToken, cookieOptions);
    res.cookie(
      'refresh_token',
      refreshToken,
      this.getCookieOptions(7 * 24 * 60 * 60 * 1000),
    );
  }

  private clearSessionCookies(res: Response) {
    const cookieOptions = {
      ...this.getCookieOptions(0),
      expires: new Date(0),
    };
    res.clearCookie('access_token', cookieOptions);
    res.clearCookie('refresh_token', cookieOptions);
  }

  /** Public origin for uploaded files (no /api prefix). */
  private buildPublicOrigin(req: Request): string {
    const configured = this.configService.get<string>('API_PUBLIC_ORIGIN');
    if (configured) return configured.replace(/\/$/, '');

    const forwardedProto = req.headers['x-forwarded-proto'];
    const protocol =
      typeof forwardedProto === 'string'
        ? forwardedProto.split(',')[0].trim()
        : (req.protocol ?? 'http');
    const host =
      req.get('host') ??
      `localhost:${this.configService.get<number>('PORT') ?? 3001}`;
    return `${protocol}://${host}`;
  }

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.register(dto);
    const loginResult = await this.authService.login(
      { email: dto.email, password: dto.password },
      typeof req.headers['user-agent'] === 'string'
        ? req.headers['user-agent']
        : undefined,
      req.ip,
    );
    this.setSessionCookies(
      res,
      loginResult.access_token,
      loginResult.refresh_token,
    );
    return {
      message: 'Mom registered successfully',
      user: loginResult.user,
    };
  }

  @Post('login')
  @Throttle({
    default: {
      limit: process.env.NODE_ENV === 'test' ? 200 : 5,
      ttl: 60000,
    },
  })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userAgentHeader = req.headers['user-agent'];
    const userAgent =
      typeof userAgentHeader === 'string' ? userAgentHeader : undefined;

    const result = await this.authService.login(dto, userAgent, req.ip);
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
    const cookies = req.cookies as Record<string, string> | undefined;
    const refreshToken = cookies?.refresh_token ?? '';
    const tokens = await this.authService.refreshAccessToken(refreshToken);
    this.setSessionCookies(res, tokens.access_token, tokens.refresh_token);
    return { message: 'Token refreshed' };
  }

  @Get('me')
  @UseGuards(JwtGuard)
  async getMe(@Req() req: Request & { user: JwtPayload }) {
    return this.authService.getUserProfile(req.user.userId);
  }

  @Patch('me')
  @UseGuards(JwtGuard)
  async updateProfile(
    @Req() req: Request & { user: JwtPayload },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(req.user.userId, dto);
  }

  @Get('career-plan')
  @UseGuards(JwtGuard)
  async getCareerPlan(@Req() req: Request & { user: JwtPayload }) {
    return this.authService.getCareerPlan(req.user.userId);
  }

  @Post('career-plan')
  @UseGuards(JwtGuard)
  async upsertCareerPlan(
    @Req() req: Request & { user: JwtPayload },
    @Body() dto: CareerPlanDto,
  ) {
    return this.authService.upsertCareerPlan(req.user.userId, dto);
  }

  @Get('sessions')
  @UseGuards(JwtGuard)
  async getSessions(@Req() req: Request & { user: JwtPayload }) {
    return this.authService.listSessions(req.user.userId, req.user.sessionId);
  }

  @Post('logout')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  async logoutCurrentSession(
    @Req() req: Request & { user: JwtPayload },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutSession(req.user.userId, req.user.sessionId);
    this.clearSessionCookies(res);
    return { message: 'Logged out from current device' };
  }

  @Delete('sessions/:sessionId')
  @UseGuards(JwtGuard)
  async logoutSpecificSession(
    @Req() req: Request & { user: JwtPayload },
    @Param('sessionId') sessionId: string,
  ) {
    await this.authService.logoutSession(req.user.userId, sessionId);
    return { message: 'Session revoked' };
  }

  @Post('logout-all')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @Req() req: Request & { user: JwtPayload },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutAll(req.user.userId);
    this.clearSessionCookies(res);
    return { message: 'Logged out from all devices' };
  }

  // ─── Expert Registration ──────────────────────────────────────────────────

  @Post('register-expert')
  @UseInterceptors(
    FileInterceptor('credential', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max for credential docs
    }),
  )
  async registerExpert(
    @Body() dto: RegisterExpertDto,
    @UploadedFile() credential?: Express.Multer.File,
  ) {
    let credentialUrl: string | undefined;

    if (credential) {
      const uploadDir =
        this.configService.get<string>('CREDENTIAL_UPLOAD_DIR') ??
        'uploads/credentials';
      await mkdir(uploadDir, { recursive: true });
      const filename = `${randomUUID()}-${credential.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      await writeFile(join(uploadDir, filename), credential.buffer);
      credentialUrl = `${uploadDir}/${filename}`;
    }

    return this.authService.registerExpert(dto, credentialUrl);
  }

  // ─── Avatar Upload ─────────────────────────────────────────────────────────

  @Post('avatar')
  @UseGuards(JwtGuard)
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
    }),
  )
  async uploadAvatar(
    @Req() req: Request & { user: JwtPayload },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      return { message: 'No file provided.' };
    }
    const allowed = new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ]);
    if (!allowed.has(file.mimetype)) {
      return { message: 'Only JPEG, PNG, WEBP, and GIF are allowed.' };
    }

    const uploadDir =
      this.configService.get<string>('AVATAR_UPLOAD_DIR') ?? 'uploads/avatars';
    await mkdir(uploadDir, { recursive: true });
    const ext = file.originalname.split('.').pop()?.toLowerCase() ?? 'jpg';
    const filename = `${req.user.userId}-${randomUUID()}.${ext}`;
    await writeFile(join(uploadDir, filename), file.buffer);

    const profileImageUrl = `${this.buildPublicOrigin(req)}/uploads/avatars/${filename}`;

    await this.prisma.user.update({
      where: { id: req.user.userId },
      data: { profileImage: profileImageUrl, avatarUrl: profileImageUrl },
    });
    await this.authService.invalidateProfileCache(req.user.userId);

    return { profileImageUrl };
  }

  // ─── Admin: Expert Approval ───────────────────────────────────────────────

  @Get('admin/experts')
  @UseGuards(JwtGuard, AdminGuard)
  async listExperts() {
    const experts = await this.prisma.user.findMany({
      where: {
        role: { not: 'MOTHER' },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        expertStatus: true,
        specialization: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return { experts };
  }

  @Patch('admin/experts/:expertId/approve')
  @UseGuards(JwtGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  async approveExpert(@Param('expertId') expertId: string) {
    await this.prisma.user.update({
      where: { id: expertId },
      data: { expertStatus: 'APPROVED' },
    });
    return { message: 'Expert approved successfully.' };
  }

  @Patch('admin/experts/:expertId/suspend')
  @UseGuards(JwtGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  async suspendExpert(@Param('expertId') expertId: string) {
    await this.prisma.user.update({
      where: { id: expertId },
      data: { expertStatus: 'SUSPENDED' },
    });
    return { message: 'Expert suspended.' };
  }
  // ── Google OAuth ───────────────────────────────────────────────────────────

  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  googleLogin() {
    // Passport redirects to Google — nothing to do here
  }

  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  async googleCallback(
    @Req() req: Request & { user: { id: string } },
    @Res() res: Response,
  ) {
    const { access_token, refresh_token } =
      await this.authService.loginOAuthUser(req.user.id);

    this.setSessionCookies(
      res as unknown as import('express').Response,
      access_token,
      refresh_token,
    );

    const clientUrl =
      this.configService.get<string>('CLIENT_URL') ?? 'http://localhost:3000';
    return (res as unknown as import('express').Response).redirect(
      `${clientUrl}/dashboard`,
    );
  }

  // ── GitHub OAuth ───────────────────────────────────────────────────────────

  @Get('github')
  @UseGuards(GitHubOAuthGuard)
  githubLogin() {
    // Passport redirects to GitHub — nothing to do here
  }

  @Get('github/callback')
  @UseGuards(GitHubOAuthGuard)
  async githubCallback(
    @Req() req: Request & { user: { id: string } },
    @Res() res: Response,
  ) {
    const { access_token, refresh_token } =
      await this.authService.loginOAuthUser(req.user.id);

    this.setSessionCookies(
      res as unknown as import('express').Response,
      access_token,
      refresh_token,
    );

    const clientUrl =
      this.configService.get<string>('CLIENT_URL') ?? 'http://localhost:3000';
    return (res as unknown as import('express').Response).redirect(
      `${clientUrl}/dashboard`,
    );
  }

  // ── Password Reset ─────────────────────────────────────────────────────────

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
