import type { NextFunction, Request, Response } from 'express';
import { membershipModel, type Membership } from '../models/membership.model';
import { asyncHandler } from '../utils/asyncHandler';
import { forbidden } from '../utils/errors';

// Augment Express's Request with the caller's membership for the target community.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      membership?: Membership | null;
    }
  }
}

/**
 * Loads the caller's Membership for the community in the route (:communityId)
 * and attaches it to req.membership (null if not a member). This is the single
 * dependency every community-scoped route relies on for role checks.
 */
export const loadMembership = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const communityId = req.params.communityId;
    const userId = req.user?.userId;
    req.membership =
      communityId && userId ? await membershipModel.find(userId, communityId) : null;
    next();
  },
);

/** Requires the caller to be a member (any role) of the target community. */
export function requireMember(req: Request, _res: Response, next: NextFunction): void {
  if (!req.membership) {
    next(forbidden('You are not a member of this community'));
    return;
  }
  next();
}

/** Requires the caller to be an admin of the target community. */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.membership) {
    next(forbidden('You are not a member of this community'));
    return;
  }
  if (req.membership.role !== 'admin') {
    next(forbidden('Admin role required'));
    return;
  }
  next();
}
