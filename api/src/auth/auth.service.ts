import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // ✅ TOKEN GENERATOR (WITH SESSION ID)
  private generateTokens(userId: string, email: string, sessionId: string) {
    const payload = { userId, email, sessionId };

    const access_token = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '15m',
    });

    const refresh_token = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    return { access_token, refresh_token };
  }
  async getUserProfile(userId: string) {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new UnauthorizedException('User not found.');
  }

  const { password, ...safeUser } = user;

  return { user: safeUser };
}
  // ✅ REGISTER
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

  // ✅ LOGIN (MULTI-DEVICE + SESSION BINDING)
  async login(dto: LoginDto) {
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

    // ✅ CREATE SESSION FIRST
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: 'temp', // placeholder
      },
    });

    const tokens = this.generateTokens(user.id, user.email, session.id);

    // ✅ SAVE HASHED TOKEN
    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        refreshToken: await bcrypt.hash(tokens.refresh_token, 10),
      },
    });

    const { password, ...safeUser } = user;

    return {
      user: safeUser,
      ...tokens,
    };
  }

  // ✅ REFRESH TOKEN (SECURE + ROTATION + REUSE DETECTION)
  async refreshAccessToken(oldRefreshToken: string) {
    try {
      const payload = this.jwtService.verify<{
        userId: string;
        email: string;
        sessionId: string;
      }>(oldRefreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
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

      // 🚨 REUSE DETECTION
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

      // ✅ ROTATE TOKEN
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

  // ✅ GOOGLE LOGIN (SESSION SAFE)
  async validateGoogleUser(email: string, name: string) {
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name,
          password: null,
        },
      });
    }

    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: 'temp',
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
      ...tokens,
    };
  }

  // ✅ LOGOUT ALL DEVICES
  async logout(userId: string) {
    await this.prisma.session.deleteMany({
      where: { userId },
    });
  }

  // ✅ LOGOUT SINGLE DEVICE
  async logoutSingleSession(sessionId: string) {
    await this.prisma.session.delete({
      where: { id: sessionId },
    });
  }
}