import type { Request, Response } from 'express';

/**
 * Suggestions controller — stubs only. Public, upvotable member posts.
 * No logic yet.
 */
export const suggestionsController = {
  list(_req: Request, res: Response): void {
    res.status(501).json({ error: 'Not implemented' });
  },
  create(_req: Request, res: Response): void {
    res.status(501).json({ error: 'Not implemented' });
  },
  upvote(_req: Request, res: Response): void {
    res.status(501).json({ error: 'Not implemented' });
  },
};
