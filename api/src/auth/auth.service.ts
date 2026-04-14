import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RedisService } from 'src/common/redis.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  private generateTokens(userId: string, email: string, sessionId: string) {
    const payload = { userId, email, sessionId };

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

  async getUserProfile(userId: string) {
    const cacheKey = this.profileCacheKey(userId);
    const cached = await this.redisService.get<{ user: unknown }>(cacheKey);
    if (cached) return cached;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    const { password, ...safeUser } = user;
    const payload = { user: safeUser };
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

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        ...dto,
        password: hashedPassword,
      },
    });

    const { password, ...safeUser } = user;

    return {
      message: 'Mom registered successfully',
      user: safeUser,
    };
  }

  async login(dto: LoginDto, userAgent?: string, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
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

    const tokens = this.generateTokens(user.id, user.email, session.id);

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        refreshToken: await bcrypt.hash(tokens.refresh_token, 10),
      },
    });

    const { password, ...safeUser } = user;

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
}