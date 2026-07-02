import { randomUUID, randomBytes, createHash } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { RegisterExpertDto } from './dto/register-expert.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CareerPlanDto } from './dto/career-plan.dto';
import { RedisService } from 'src/common/redis.service';
import { ExpertStatus, UserRole, Prisma } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  private generateTokens(
    userId: string,
    email: string,
    sessionId: string,
    role: string | undefined,
    isAdmin: boolean,
    expertStatus?: string,
  ) {
    const payload = { userId, email, sessionId, role, isAdmin, expertStatus };

    const access_token = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: '15m',
    });

    const refresh_token = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    return { access_token, refresh_token };
  }

  private profileCacheKey(userId: string) {
    return `auth:profile:${userId}`;
  }

  async invalidateProfileCache(userId: string) {
    await this.redisService.del(this.profileCacheKey(userId));
  }

  async getUserProfile(userId: string) {
    const cacheKey = this.profileCacheKey(userId);
    const cached = await this.redisService.get<{ user: unknown }>(cacheKey);
    if (cached) return cached;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        dueDate: true,
        babyBirthDate: true,
        babyName: true,
        deliveryType: true,
        weight: true,
        height: true,
        role: true,
        expertStatus: true,
        isAdmin: true,
        specialization: true,
        externalLink: true,
        profileImage: true,
        avatarUrl: true,

        contributionCount: true,
        isFeatured: true,
        featuredAt: true,
        createdAt: true,
        updatedAt: true,
        careerPlan: {
          select: {
            profession: true,
            employer: true,
            breakStartDate: true,
            returnDate: true,
            planItems: true,
          },
        },
        // credentialUrl intentionally excluded from profile response
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    const payload = { user };
    await this.redisService.set(cacheKey, payload, 120);
    return payload;
  }

  async register(dto: RegisterDto) {
    if (!dto.dueDate && !dto.babyBirthDate) {
      throw new BadRequestException(
        'Either due date or baby birth date must be provided.',
      );
    }

    if (!dto.password) {
      throw new BadRequestException('Password is required');
    }

    const normalizedEmail = dto.email.toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('User already exists.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        ...dto,
        email: normalizedEmail,
        password: hashedPassword,
        // role field not in current schema
      },
    });

    const safeUser = { ...user };
    delete (safeUser as { password?: string | null }).password;

    return {
      message: 'Mom registered successfully',
      user: safeUser,
    };
  }

  async login(dto: LoginDto, userAgent?: string, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(dto.password, user.password);

    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: 'temp',
        userAgent,
        ipAddress,
      },
    });

    const tokens = this.generateTokens(
      user.id,
      user.email,
      session.id,
      user.role,
      user.isAdmin,
      user.expertStatus ?? undefined,
    );

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        refreshToken: await bcrypt.hash(tokens.refresh_token, 10),
      },
    });

    const safeUser = { ...user };
    delete (safeUser as { password?: string | null }).password;

    return {
      user: safeUser,
      sessionId: session.id,
      ...tokens,
    };
  }

  async refreshAccessToken(oldRefreshToken: string) {
    if (!oldRefreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    try {
      const payload = this.jwtService.verify<{
        userId: string;
        email: string;
        sessionId: string;
        role: UserRole;
        isAdmin: boolean;
        expertStatus?: ExpertStatus;
      }>(oldRefreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });

      const session = await this.prisma.session.findUnique({
        where: { id: payload.sessionId },
      });

      if (!session) {
        throw new UnauthorizedException();
      }

      const isMatch = await bcrypt.compare(
        oldRefreshToken,
        session.refreshToken,
      );

      if (!isMatch) {
        await this.prisma.session.delete({
          where: { id: session.id },
        });

        throw new UnauthorizedException('Token reuse detected');
      }

      const tokens = this.generateTokens(
        payload.userId,
        payload.email,
        session.id,
        payload.role,
        payload.isAdmin,
        payload.expertStatus,
      );

      await this.prisma.session.update({
        where: { id: session.id },
        data: {
          refreshToken: await bcrypt.hash(tokens.refresh_token, 10),
        },
      });

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async listSessions(userId: string, currentSessionId?: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      sessions: sessions.map((session) => ({
        ...session,
        isCurrent: currentSessionId === session.id,
      })),
    };
  }

  async logoutAll(userId: string) {
    await this.prisma.session.deleteMany({
      where: { userId },
    });
    await this.redisService.del(this.profileCacheKey(userId));
  }

  async logoutSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
      select: { id: true },
    });

    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    await this.prisma.session.delete({ where: { id: sessionId } });
    await this.redisService.del(this.profileCacheKey(userId));
  }

  // ─── Expert Registration ───────────────────────────────────────────────────

  async registerExpert(dto: RegisterExpertDto, credentialUrl?: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already in use.');
    }

    if (!dto.password) {
      throw new BadRequestException('Password is required');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        role: dto.role,
        specialization: dto.specialization,
        externalLink: dto.externalLink,
        credentialUrl,
        expertStatus: ExpertStatus.PENDING_APPROVAL,
      },
    });

    const safeUser = { ...user };
    delete (safeUser as { password?: string | null }).password;

    return {
      message:
        'Expert account created. Your credentials are under review. You will be notified once approved.',
      user: safeUser,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.babyName !== undefined && { babyName: dto.babyName }),
        ...(dto.deliveryType !== undefined && {
          deliveryType: dto.deliveryType,
        }),
        ...(dto.whatsappNumber !== undefined && {
          whatsappNumber: dto.whatsappNumber,
        }),
        ...(dto.dueDate && { dueDate: new Date(dto.dueDate) }),
        ...(dto.babyBirthDate && {
          babyBirthDate: new Date(dto.babyBirthDate),
        }),
        ...((dto.avatarUrl ?? dto.profileImage) !== undefined && {
          profileImage: dto.avatarUrl ?? dto.profileImage,
        }),
        // Vitals — written when provided; never overwrite with undefined
        ...(dto.weight !== undefined && { weight: dto.weight }),
        ...(dto.height !== undefined && { height: dto.height }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        babyName: true,
        dueDate: true,
        babyBirthDate: true,
        deliveryType: true,
        profileImage: true,
        weight: true,
        height: true,
        role: true,
        onboardingDone: true,
      },
    });

    await this.redisService.del(this.profileCacheKey(userId));
    return { user };
  }

  async getCareerPlan(userId: string) {
    return this.prisma.careerPlan.findUnique({
      where: { userId },
      select: {
        profession: true,
        employer: true,
        breakStartDate: true,
        returnDate: true,
        planItems: true,
      },
    });
  }

  async upsertCareerPlan(userId: string, dto: CareerPlanDto) {
    const now = new Date();
    const updateData: Record<string, unknown> = {
      profession: dto.profession,
      employer: dto.employer,
      breakStartDate: dto.breakStartDate
        ? new Date(dto.breakStartDate)
        : undefined,
      returnDate: dto.returnDate ? new Date(dto.returnDate) : undefined,
      planItems: dto.planItems as Prisma.InputJsonValue,
    };

    const createData: Record<string, unknown> = {
      user: { connect: { id: userId } },
      profession: dto.profession ?? 'Career plan',
      employer: dto.employer ?? null,
      breakStartDate: dto.breakStartDate ? new Date(dto.breakStartDate) : now,
      returnDate: dto.returnDate ? new Date(dto.returnDate) : now,
      planItems: (dto.planItems ?? {}) as Prisma.InputJsonValue,
    };

    const careerPlan = await this.prisma.careerPlan.upsert({
      where: { userId },
      create: createData as unknown as Prisma.CareerPlanCreateInput,
      update: updateData as unknown as Prisma.CareerPlanUpdateInput,
    });

    await this.redisService.del(this.profileCacheKey(userId));
    return careerPlan;
  }
  // ── OAuth ──────────────────────────────────────────────────────────────────

  /**
   * Called by both Google and GitHub strategies after provider authentication.
   *
   * Logic:
   *  1. Find an existing OAuthAccount for this provider + providerId
   *  2. If found → return the linked User (login flow)
   *  3. If not found but email matches an existing User → link the account
   *  4. If no user at all → create a new User + OAuthAccount (sign-up flow)
   *
   * Returns a minimal user object (id + email) used to mint JWT tokens.
   */
  async findOrCreateOAuthUser(params: {
    provider: string;
    providerId: string;
    email: string;
    name: string;
    profileImage: string | null;
    accessToken: string;
    refreshToken: string | null;
  }) {
    const {
      provider,
      providerId,
      email,
      name,
      profileImage,
      accessToken,
      refreshToken,
    } = params;

    // 1. Check for existing linked account
    const existing = await this.prisma.oAuthAccount.findUnique({
      where: { provider_providerId: { provider, providerId } },
      include: { user: true },
    });

    if (existing) {
      // Keep tokens fresh
      await this.prisma.oAuthAccount.update({
        where: { id: existing.id },
        data: { accessToken, refreshToken },
      });
      return existing.user;
    }

    // 2. Check if a user with this email already exists (link accounts)
    let user = email
      ? await this.prisma.user.findUnique({ where: { email } })
      : null;

    // 3. Create new user if none found
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name,
          profileImage,
          password: null, // no password for OAuth users
          onboardingDone: false,
        },
      });
    }

    // 4. Link the OAuth account to the user
    await this.prisma.oAuthAccount.create({
      data: {
        userId: user.id,
        provider,
        providerId,
        email,
        accessToken,
        refreshToken,
      },
    });

    return user;
  }

  /**
   * Mint JWT tokens for an OAuth-authenticated user.
   * Called from the OAuth callback controller routes.
   */
  async loginOAuthUser(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    // Generate a session-like ID (we don't use the Session table in this schema)
    const sessionId = randomUUID();

    const { access_token, refresh_token } = this.generateTokens(
      user.id,
      user.email,
      sessionId,
      user.role,
      user.isAdmin,
      user.expertStatus ?? undefined,
    );

    return { access_token, refresh_token, user };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return {
        message:
          'If the email exists, a password reset link has been generated.',
      };
    }

    const token = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpires: expires,
      },
    });

    Logger.warn(
      `Password reset requested for ${user.email}. Token is: ${token}`,
      'AuthService',
    );

    return {
      message: 'If the email exists, a password reset link has been generated.',
      token,
    };
  }

  async resetPassword(dto: { token: string; password: string }) {
    if (!dto.token || !dto.password) {
      throw new BadRequestException('Token and password are required.');
    }

    const hashedToken = createHash('sha256').update(dto.token).digest('hex');

    const user = await this.prisma.user.findUnique({
      where: { resetToken: hashedToken },
    });

    if (
      !user ||
      !user.resetTokenExpires ||
      user.resetTokenExpires.getTime() < Date.now()
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    // Invalidate sessions on password change
    await this.prisma.session.deleteMany({
      where: { userId: user.id },
    });
    await this.redisService.del(this.profileCacheKey(user.id));

    return { message: 'Password has been reset successfully.' };
  }
}
