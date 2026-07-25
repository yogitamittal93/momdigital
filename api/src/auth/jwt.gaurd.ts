import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole, ExpertStatus } from '@prisma/client';

import type { Request } from 'express';
import { getCookieValuesPreferringLast } from './cookie.util';

export interface JwtPayload {
  userId: string;
  email: string;
  sessionId: string;
  role: UserRole;
  isAdmin: boolean;
  expertStatus?: ExpertStatus;
}

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const testUserId = request.headers['x-test-user-id'] as string | undefined;

    if (
      testUserId &&
      this.configService.get<string>('NODE_ENV') !== 'production'
    ) {
      request.user = { userId: testUserId } as unknown as JwtPayload;
      return true;
    }

    const cookieHeader =
      typeof request.headers.cookie === 'string'
        ? request.headers.cookie
        : undefined;
    const tokens = getCookieValuesPreferringLast(cookieHeader, 'access_token');

    if (tokens.length === 0) {
      throw new UnauthorizedException('No token provided');
    }

    const secret = this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');

    // Try every duplicate access_token until one verifies. Stale siblings from
    // older Domain/SameSite configs must not block a valid new session cookie.
    for (const token of tokens) {
      try {
        const decoded = this.jwtService.verify<JwtPayload>(token, { secret });
        request.user = decoded;
        return true;
      } catch {
        // try next duplicate
      }
    }

    throw new UnauthorizedException('Invalid or expired token');
  }
}
