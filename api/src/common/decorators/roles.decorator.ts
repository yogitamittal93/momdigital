import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Attach allowed roles to a route handler or controller.
 * Used by RolesGuard to enforce access control.
 *
 * @example
 * @Roles(UserRole.MBBS, UserRole.AYURVEDA)
 * @Get('queue')
 * getQueue() { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
