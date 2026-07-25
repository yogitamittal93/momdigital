import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from 'src/auth/jwt.gaurd';
import { getCookieValuesPreferringLast } from 'src/auth/cookie.util';

import type { Request } from 'express';

@Injectable()
export class ChatbotAuthGuard implements CanActivate {
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
      request.user = { userId: testUserId } as Express.User;
      return true;
    }

    const cookieHeader =
      typeof request.headers.cookie === 'string'
        ? request.headers.cookie
        : undefined;
    const cookieTokens = getCookieValuesPreferringLast(
      cookieHeader,
      'access_token',
    );
    const authHeader = request.headers['authorization'];
    const bearerToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : undefined;

    const candidates = [
      ...cookieTokens,
      ...(bearerToken ? [bearerToken] : []),
    ];

    if (candidates.length === 0) {
      throw new UnauthorizedException('No token provided');
    }

    const secret = this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
    for (const token of candidates) {
      try {
        const decoded = this.jwtService.verify<JwtPayload>(token, { secret });
        request.user = decoded;
        return true;
      } catch {
        // try next
      }
    }

    throw new UnauthorizedException('Invalid or expired token');
  }
}
