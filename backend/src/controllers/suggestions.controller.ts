import type { Request, Response } from 'express';
import { withTransaction, isUniqueViolation } from '../config/db';
import { suggestionModel } from '../models/suggestion.model';
import { str, oneOf } from '../utils/validation';
import { conflict } from '../utils/errors';
import { loadInCommunity } from '../utils/loadInCommunity';

export const suggestionsController = {
  async create(req: Request, res: Response): Promise<void> {
    const body = str(req.body?.body, 'body');
    const suggestion = await suggestionModel.create(
      req.params.communityId,
      req.user!.userId,
      body,
    );
    res.status(201).json({ suggestion });
  },

  /** Public feed: approved suggestions, most upvoted first. */
  async list(req: Request, res: Response): Promise<void> {
    res.json({ suggestions: await suggestionModel.listApproved(req.params.communityId) });
  },

  /** Admin moderation queue: pending suggestions. */
  async queue(req: Request, res: Response): Promise<void> {
    res.json({ suggestions: await suggestionModel.listPending(req.params.communityId) });
  },

  async upvote(req: Request, res: Response): Promise<void> {
    const { communityId, suggestionId } = req.params;
    await loadInCommunity(suggestionModel, suggestionId, communityId, 'Suggestion');

    try {
      const updated = await withTransaction((client) =>
        suggestionModel.addVote(suggestionId, req.user!.userId, client),
      );
      res.json({ suggestion: updated });
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw conflict('You have already upvoted this suggestion');
      }
      throw err;
    }
  },

  /** Admin approve/reject from the moderation queue. */
  async moderate(req: Request, res: Response): Promise<void> {
    const { communityId, suggestionId } = req.params;
    const decision = oneOf(req.body?.decision, 'decision', ['approve', 'reject'] as const);
    await loadInCommunity(suggestionModel, suggestionId, communityId, 'Suggestion');

    const status = decision === 'approve' ? 'approved' : 'rejected';
    const updated = await suggestionModel.setStatus(suggestionId, status);
    res.json({ suggestion: updated });
  },
};
