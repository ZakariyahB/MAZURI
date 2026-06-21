import type { Request, Response } from 'express';
import { eventModel } from '../models/event.model';
import { EVENT_STATUSES } from '../config/constants';
import { str, optionalStr, isoDate, intInRange, oneOf } from '../utils/validation';
import { badRequest, notFound } from '../utils/errors';

export const eventsController = {
  /** Admin posts an event proposal (defaults to 'potential'). */
  async create(req: Request, res: Response): Promise<void> {
    const title = str(req.body?.title, 'title');
    const description = optionalStr(req.body?.description);
    const eventDate = isoDate(req.body?.event_date ?? req.body?.eventDate, 'event_date');
    const status =
      req.body?.status === undefined
        ? 'potential'
        : oneOf(req.body?.status, 'status', EVENT_STATUSES);

    const event = await eventModel.create(
      req.params.communityId,
      title,
      description,
      eventDate,
      status,
    );
    res.status(201).json({ event });
  },

  async list(req: Request, res: Response): Promise<void> {
    res.json({ events: await eventModel.listByCommunity(req.params.communityId) });
  },

  /** Members rate an event they attended (1–5); past events only. */
  async rate(req: Request, res: Response): Promise<void> {
    const { communityId, eventId } = req.params;
    const rating = intInRange(req.body?.rating, 'rating', 1, 5);

    const event = await eventModel.findById(eventId);
    if (!event || event.community_id !== communityId) throw notFound('Event not found');
    if (new Date(event.event_date).getTime() > Date.now()) {
      throw badRequest('Cannot rate an event that has not occurred yet');
    }

    res.status(201).json({ rating: await eventModel.rate(eventId, req.user!.userId, rating) });
  },
};
