import { query } from '../config/db';
import type { EventStatus } from '../config/constants';

export interface EventProposal {
  id: string;
  community_id: string;
  title: string;
  description: string;
  event_date: string;
  status: EventStatus;
  created_at: string;
}

export interface EventRating {
  id: string;
  event_id: string;
  user_id: string;
  rating: number;
  created_at: string;
}

export const eventModel = {
  async create(
    communityId: string,
    title: string,
    description: string,
    eventDate: string,
    status: EventStatus,
  ): Promise<EventProposal> {
    const { rows } = await query<EventProposal>(
      `INSERT INTO events (community_id, title, description, event_date, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [communityId, title, description, eventDate, status],
    );
    return rows[0];
  },

  async listByCommunity(communityId: string): Promise<EventProposal[]> {
    const { rows } = await query<EventProposal>(
      'SELECT * FROM events WHERE community_id = $1 ORDER BY event_date DESC',
      [communityId],
    );
    return rows;
  },

  async findById(id: string): Promise<EventProposal | null> {
    const { rows } = await query<EventProposal>('SELECT * FROM events WHERE id = $1', [id]);
    return rows[0] ?? null;
  },

  /** Upserts the caller's rating (one per user per event). */
  async rate(eventId: string, userId: string, rating: number): Promise<EventRating> {
    const { rows } = await query<EventRating>(
      `INSERT INTO event_ratings (event_id, user_id, rating)
       VALUES ($1, $2, $3)
       ON CONFLICT (event_id, user_id) DO UPDATE SET rating = EXCLUDED.rating
       RETURNING *`,
      [eventId, userId, rating],
    );
    return rows[0];
  },
};
