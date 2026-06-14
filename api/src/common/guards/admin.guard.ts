import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import type { Request } from 'express';

/**
 * Blocks access if the authenticated user does not have isAdmin: true.
 * Must be used after JwtGuard.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as { isAdmin?: boolean } | undefined;

    if (!user?.isAdmin) {
      throw new ForbiddenException('Admin access required.');
    }

    return true;
  }
}
