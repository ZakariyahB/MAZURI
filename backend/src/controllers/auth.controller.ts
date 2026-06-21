import type { Request, Response } from 'express';

/**
 * Auth controller — stubs only.
 * register/login issue JWTs; me returns the current principal. No logic yet.
 */
export const authController = {
  register(_req: Request, res: Response): void {
    res.status(501).json({ error: 'Not implemented' });
  },
  login(_req: Request, res: Response): void {
    res.status(501).json({ error: 'Not implemented' });
  },
  me(_req: Request, res: Response): void {
    res.status(501).json({ error: 'Not implemented' });
  },
};
