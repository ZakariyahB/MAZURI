import type { Request, Response } from 'express';
import { announcementModel } from '../models/announcement.model';
import { str } from '../utils/validation';

export const announcementsController = {
  /** Admin posts an announcement (closes the loop on suggestions/reports). */
  async create(req: Request, res: Response): Promise<void> {
    const body = str(req.body?.body, 'body');
    const announcement = await announcementModel.create(
      req.params.communityId,
      req.user!.userId,
      body,
    );
    res.status(201).json({ announcement });
  },

  async list(req: Request, res: Response): Promise<void> {
    res.json({ announcements: await announcementModel.listByCommunity(req.params.communityId) });
  },
};
