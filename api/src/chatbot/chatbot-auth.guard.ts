import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from 'src/auth/jwt.gaurd';

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

    const cookies = request.cookies as Record<string, string> | undefined;
    const cookieToken = cookies?.access_token;
    const authHeader = request.headers['authorization'];
    const bearerToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : undefined;
    const token = cookieToken || bearerToken;

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const decoded = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      request.user = decoded;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
