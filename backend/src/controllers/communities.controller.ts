import type { Request, Response } from 'express';
import { withTransaction, isUniqueViolation } from '../config/db';
import { communityModel, toPublicCommunity } from '../models/community.model';
import { membershipModel } from '../models/membership.model';
import { hashSecret, verifySecret } from '../services/auth.service';
import { computeLeaderboard } from '../services/leaderboard.service';
import { computeAnalytics } from '../services/analytics.service';
import { TIERS } from '../config/constants';
import { str, oneOf } from '../utils/validation';
import { conflict, notFound } from '../utils/errors';

export const communitiesController = {
  /** Any logged-in user can create a community; the creator becomes its admin. */
  async create(req: Request, res: Response): Promise<void> {
    const name = str(req.body?.name, 'name');
    const joinCode = str(req.body?.join_code ?? req.body?.joinCode, 'join_code');
    const joinPassword = str(req.body?.join_password ?? req.body?.joinPassword, 'join_password');
    const userId = req.user!.userId;

    const joinPasswordHash = await hashSecret(joinPassword);

    let community;
    try {
      community = await withTransaction(async (client) => {
        const c = await communityModel.create(name, joinCode, joinPasswordHash, client);
        await membershipModel.create(userId, c.id, 'admin', client);
        return c;
      });
    } catch (err) {
      if (isUniqueViolation(err)) throw conflict('Join code already in use');
      throw err;
    }

    res.status(201).json({ community: toPublicCommunity(community), role: 'admin' });
  },

  /** Join by community CODE + PASSWORD; admitted as a member. */
  async join(req: Request, res: Response): Promise<void> {
    const joinCode = str(req.body?.join_code ?? req.body?.joinCode, 'join_code');
    const joinPassword = str(req.body?.join_password ?? req.body?.joinPassword, 'join_password');
    const userId = req.user!.userId;

    const community = await communityModel.findByCode(joinCode);
    if (!community || !(await verifySecret(joinPassword, community.join_password_hash))) {
      // Don't reveal whether it was the code or the password that was wrong.
      throw notFound('Community not found or password incorrect');
    }

    if (await membershipModel.find(userId, community.id)) {
      throw conflict('You are already a member of this community');
    }

    await membershipModel.create(userId, community.id, 'member');
    res.status(201).json({ community: toPublicCommunity(community), role: 'member' });
  },

  /** Communities the caller belongs to, each with their role. */
  async listMine(req: Request, res: Response): Promise<void> {
    const communities = await membershipModel.listForUser(req.user!.userId);
    res.json({ communities });
  },

  /** Community detail (caller must be a member; req.membership is loaded). */
  async get(req: Request, res: Response): Promise<void> {
    const community = await communityModel.findById(req.params.communityId);
    if (!community) throw notFound('Community not found');
    res.json({ community: toPublicCommunity(community), role: req.membership!.role });
  },

  /** Cross-community leaderboard (compute-on-read). Any logged-in user. */
  async leaderboard(_req: Request, res: Response): Promise<void> {
    res.json({ leaderboard: await computeLeaderboard() });
  },

  /** Public accountability analytics ("% addressed within 30 days"). Members. */
  async analytics(req: Request, res: Response): Promise<void> {
    res.json({ analytics: await computeAnalytics(req.params.communityId) });
  },

  /**
   * Switch subscription tier (admin). Billing is MOCKED — this flips the
   * feature gate; a payment provider slots in front of it later. Downgrading
   * locks paid features but never deletes data (read-only archive semantics).
   */
  async setSubscription(req: Request, res: Response): Promise<void> {
    const tier = oneOf(req.body?.tier, 'tier', TIERS);
    const community = await communityModel.setTier(req.params.communityId, tier);
    if (!community) throw notFound('Community not found');
    res.json({ community: toPublicCommunity(community), role: req.membership!.role });
  },
};
