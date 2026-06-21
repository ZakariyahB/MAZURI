import type { Request, Response } from 'express';
import { membershipModel } from '../models/membership.model';
import { str } from '../utils/validation';
import { notFound } from '../utils/errors';

export const membershipsController = {
  /** List members of a community (admin only) — supports the "add admin" UI. */
  async list(req: Request, res: Response): Promise<void> {
    const members = await membershipModel.listMembers(req.params.communityId);
    res.json({ members });
  },

  /**
   * Promote an existing member to admin. Admins can ONLY add admins —
   * there is no demote and no remove.
   */
  async promote(req: Request, res: Response): Promise<void> {
    const targetUserId = str(req.body?.user_id ?? req.body?.userId, 'user_id');
    const membership = await membershipModel.promoteToAdmin(targetUserId, req.params.communityId);
    if (!membership) throw notFound('That user is not a member of this community');
    res.json({ membership });
  },
};
