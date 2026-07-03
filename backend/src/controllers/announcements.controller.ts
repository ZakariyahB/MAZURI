import type { Request, Response } from 'express';
import { announcementModel } from '../models/announcement.model';
import { str } from '../utils/validation';
import { badRequest, forbidden, notFound } from '../utils/errors';

/** Optional array of non-empty string URLs (announcement image links). */
function optionalUrlList(value: unknown): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value) || value.some((v) => typeof v !== 'string' || v.trim() === '')) {
    throw badRequest('image_urls must be an array of non-empty strings');
  }
  return (value as string[]).map((v) => v.trim());
}

export const announcementsController = {
  /** Admin posts an announcement (closes the loop on suggestions/reports). */
  async create(req: Request, res: Response): Promise<void> {
    const body = str(req.body?.body, 'body');
    const imageUrls = optionalUrlList(req.body?.image_urls) ?? [];
    const announcement = await announcementModel.create(
      req.params.communityId,
      req.user!.userId,
      body,
      imageUrls,
    );
    res.status(201).json({ announcement });
  },

  async list(req: Request, res: Response): Promise<void> {
    res.json({ announcements: await announcementModel.listByCommunity(req.params.communityId) });
  },

  /** Admin lists the announcements they authored (for the manage/edit view). */
  async listMine(req: Request, res: Response): Promise<void> {
    res.json({
      announcements: await announcementModel.listByAuthor(
        req.params.communityId,
        req.user!.userId,
      ),
    });
  },

  /** Admin edits their OWN announcement; stamps it as edited. */
  async update(req: Request, res: Response): Promise<void> {
    const { communityId, announcementId } = req.params;
    const existing = await announcementModel.findById(announcementId);
    if (!existing || existing.community_id !== communityId) throw notFound('Announcement not found');
    if (existing.author_id !== req.user!.userId) {
      throw forbidden('You can only edit announcements you created');
    }

    const body = str(req.body?.body, 'body');
    const imageUrls = optionalUrlList(req.body?.image_urls);
    res.json({ announcement: await announcementModel.update(announcementId, body, imageUrls) });
  },
};
