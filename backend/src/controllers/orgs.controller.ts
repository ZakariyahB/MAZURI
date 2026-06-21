import type { Request, Response } from 'express';

/**
 * Orgs (tenants) controller — stubs only. Every other resource is scoped to an
 * org. No logic yet.
 */
export const orgsController = {
  list(_req: Request, res: Response): void {
    res.status(501).json({ error: 'Not implemented' });
  },
  create(_req: Request, res: Response): void {
    res.status(501).json({ error: 'Not implemented' });
  },
  get(_req: Request, res: Response): void {
    res.status(501).json({ error: 'Not implemented' });
  },
};
