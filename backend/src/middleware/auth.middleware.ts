import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

/** The authenticated principal attached to each request. */
export interface AuthenticatedUser {
  userId: string;
  orgId: string;
  role: 'member' | 'admin';
}

// Augment Express's Request so downstream handlers see req.user.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Verifies a Bearer JWT and attaches the principal to req.user.
 *
 * STUB: claim validation is illustrative only — real auth (issuing tokens,
 * checking roles/org membership) is wired up in a later phase.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header' });
    return;
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, env.jwtSecret) as Partial<AuthenticatedUser>;
    // TODO: validate required claims (userId, orgId, role) before trusting them.
    req.user = payload as AuthenticatedUser;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
