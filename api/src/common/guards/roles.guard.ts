import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, ExpertStatus } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Guards routes by checking:
 *  1. The user's role is in the @Roles() list (or the list is empty = any authenticated user).
 *  2. If the user is an expert (non-MOTHER role), their expertStatus must be APPROVED.
 *     Admins bypass the expertStatus check.
 *
 * Must be used AFTER JwtGuard (which populates req.user).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const user: {
      userId: string;
      role: UserRole;
      isAdmin: boolean;
      expertStatus?: ExpertStatus;
    } = request.user;

    if (!user) {
      throw new ForbiddenException('Unauthorised');
    }

    // Admin bypasses all role & status checks
    if (user.isAdmin) return true;

    // If specific roles are required, check membership
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.includes(user.role);
      if (!hasRole) {
        throw new ForbiddenException(
          `This resource requires one of: ${requiredRoles.join(', ')}`,
        );
      }
    }

    // Experts must be approved before accessing expert-only resources
    const isExpert = user.role !== UserRole.MOTHER;
    if (isExpert && user.expertStatus !== ExpertStatus.APPROVED) {
      throw new ForbiddenException(
        'Your expert account is pending admin approval.',
      );
    }

    return true;
  }
}
