import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, ExpertStatus } from '@prisma/client';
import { JwtPayload } from 'src/auth/jwt.gaurd';

import type { Request } from 'express';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles?.length) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as JwtPayload;
    if (!user) return false;

    // Admin bypasses all role checks
    if (user.isAdmin) return true;

    // Expert must be approved to use expert-only routes
    if (
      user.expertStatus &&
      user.expertStatus !== ExpertStatus.APPROVED &&
      requiredRoles.some((r) => r !== UserRole.MOTHER)
    ) {
      return false;
    }

    return requiredRoles.includes(user.role);
  }
}
