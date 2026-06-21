import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../services/auth.service';
import { unauthorized } from '../utils/errors';

// Augment Express's Request with the authenticated user id.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { userId: string };
    }
  }
}

/**
 * Verifies the Bearer JWT and attaches { userId } to req.user.
 *
 * Tokens carry only the user id — a user belongs to many communities, so the
 * per-community role is resolved per request by the membership middleware.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(unauthorized('Missing or malformed Authorization header'));
    return;
  }

  try {
    const payload = verifyToken(header.slice('Bearer '.length));
    req.user = { userId: payload.userId };
    next();
  } catch {
    next(unauthorized('Invalid or expired token'));
  }
}
