import { UserRole, ExpertStatus } from '@prisma/client';

declare global {
  namespace Express {
    interface User {
      id?: string;
      userId?: string;
      email?: string;
      role?: UserRole;
      sessionId?: string;
      isAdmin?: boolean;
      expertStatus?: ExpertStatus | null;
    }
    interface Request {
      user?: User;
      cookies?: Record<string, string>;
    }
  }
}

export {};
