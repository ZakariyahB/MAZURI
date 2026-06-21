import type { Request, Response } from 'express';

/**
 * Events controller — stubs only. Admin-created event proposals that members
 * vote yes/no on. No logic yet.
 */
export const eventsController = {
  list(_req: Request, res: Response): void {
    res.status(501).json({ error: 'Not implemented' });
  },
  create(_req: Request, res: Response): void {
    res.status(501).json({ error: 'Not implemented' });
  },
  vote(_req: Request, res: Response): void {
    res.status(501).json({ error: 'Not implemented' });
  },
};
