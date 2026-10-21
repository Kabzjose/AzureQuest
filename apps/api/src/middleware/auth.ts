import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

export interface JwtPayload {
  sub: string;   // userId
  isGuest: boolean;
  type: 'access';
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; isGuest: boolean };
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError(401, 'UNAUTHORIZED', 'Missing or invalid Authorization header');
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');

  try {
    const payload = jwt.verify(token, secret) as JwtPayload;
    if (payload.type !== 'access') {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid token type');
    }
    req.user = { id: payload.sub, isGuest: payload.isGuest };
    next();
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired access token');
  }
}

export function requireFullAccount(req: Request, _res: Response, next: NextFunction): void {
  requireAuth(req, _res, () => {
    if (req.user?.isGuest) {
      throw new AppError(403, 'GUEST_ONLY', 'Create an account to access this feature');
    }
    next();
  });
}
