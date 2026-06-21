import type { Request, Response } from 'express';

/**
 * Announcements controller — stubs only. Admin posts that close the loop when a
 * suggestion is implemented or a report resolved. No logic yet.
 */
export const announcementsController = {
  list(_req: Request, res: Response): void {
    res.status(501).json({ error: 'Not implemented' });
  },
  create(_req: Request, res: Response): void {
    res.status(501).json({ error: 'Not implemented' });
  },
};
