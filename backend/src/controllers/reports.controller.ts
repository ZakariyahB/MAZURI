import type { Request, Response } from 'express';

/**
 * Reports controller — stubs only. Private, admin-only member reports that get
 * AI-clustered + urgency-ranked later. No logic yet.
 */
export const reportsController = {
  list(_req: Request, res: Response): void {
    res.status(501).json({ error: 'Not implemented' });
  },
  create(_req: Request, res: Response): void {
    res.status(501).json({ error: 'Not implemented' });
  },
};
