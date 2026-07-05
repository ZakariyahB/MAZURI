import type { Request, Response } from 'express';
import { eventModel } from '../models/event.model';
import { EVENT_KINDS } from '../config/constants';
import { str, optionalStr, isoDate, intInRange, oneOf } from '../utils/validation';
import { badRequest } from '../utils/errors';
import { loadInCommunity } from '../utils/loadInCommunity';

export const eventsController = {
  /**
   * Admin creates an event. `kind` selects the flow:
   *   - 'proposed' → floated for interest; members up/downvote.
   *   - 'past'     → already happened; members rate 1-5.
   */
  async create(req: Request, res: Response): Promise<void> {
    const title = str(req.body?.title, 'title');
    const description = optionalStr(req.body?.description);
    const eventDate = isoDate(req.body?.event_date ?? req.body?.eventDate, 'event_date');
    const kind =
      req.body?.kind === undefined ? 'past' : oneOf(req.body?.kind, 'kind', EVENT_KINDS);

    const event = await eventModel.create(
      req.params.communityId,
      title,
      description,
      eventDate,
      kind,
    );
    res.status(201).json({ event });
  },

  async list(req: Request, res: Response): Promise<void> {
    res.json({ events: await eventModel.listByCommunity(req.params.communityId) });
  },

  /** Members rate a PAST event they attended (1–5). */
  async rate(req: Request, res: Response): Promise<void> {
    const { communityId, eventId } = req.params;
    const rating = intInRange(req.body?.rating, 'rating', 1, 5);

    const event = await loadInCommunity(eventModel, eventId, communityId, 'Event');
    if (event.kind !== 'past') throw badRequest('Only past events can be rated');

    res.status(201).json({ rating: await eventModel.rate(eventId, req.user!.userId, rating) });
  },

  /** Members up/downvote a PROPOSED event to gauge interest. */
  async vote(req: Request, res: Response): Promise<void> {
    const { communityId, eventId } = req.params;
    const direction = oneOf(req.body?.direction, 'direction', ['up', 'down'] as const);

    const event = await loadInCommunity(eventModel, eventId, communityId, 'Event');
    if (event.kind !== 'proposed') throw badRequest('Only proposed events can be voted on');

    const updated = await eventModel.vote(eventId, req.user!.userId, direction === 'up' ? 1 : -1);
    res.status(201).json({ event: updated });
  },
};
