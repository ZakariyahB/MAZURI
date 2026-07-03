import { query } from '../config/db';
import type { EventStatus, EventKind } from '../config/constants';

export interface EventProposal {
  id: string;
  community_id: string;
  title: string;
  description: string;
  event_date: string;
  status: EventStatus;
  /** 'proposed' (members up/downvote) or 'past' (members rate 1-5). */
  kind: EventKind;
  /** Up/down vote tallies — only meaningful for proposed events. */
  upvotes: number;
  downvotes: number;
  created_at: string;
}

export interface EventRating {
  id: string;
  event_id: string;
  user_id: string;
  rating: number;
  created_at: string;
}

// SELECT that folds each event's up/down vote tallies in alongside the row.
const SELECT_WITH_VOTES = `
  SELECT e.*,
    COALESCE(SUM(CASE WHEN v.vote = 1  THEN 1 ELSE 0 END), 0)::int AS upvotes,
    COALESCE(SUM(CASE WHEN v.vote = -1 THEN 1 ELSE 0 END), 0)::int AS downvotes
  FROM events e
  LEFT JOIN event_votes v ON v.event_id = e.id`;

export const eventModel = {
  async create(
    communityId: string,
    title: string,
    description: string,
    eventDate: string,
    kind: EventKind,
  ): Promise<EventProposal> {
    // status mirrors kind for backward compatibility: proposed→potential, past→confirmed.
    const status: EventStatus = kind === 'past' ? 'confirmed' : 'potential';
    const {
      rows: [{ id }],
    } = await query<{ id: string }>(
      `INSERT INTO events (community_id, title, description, event_date, status, kind)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [communityId, title, description, eventDate, status, kind],
    );
    return (await this.findById(id))!;
  },

  async listByCommunity(communityId: string): Promise<EventProposal[]> {
    const { rows } = await query<EventProposal>(
      `${SELECT_WITH_VOTES}
       WHERE e.community_id = $1
       GROUP BY e.id
       ORDER BY e.event_date DESC`,
      [communityId],
    );
    return rows;
  },

  async findById(id: string): Promise<EventProposal | null> {
    const { rows } = await query<EventProposal>(
      `${SELECT_WITH_VOTES} WHERE e.id = $1 GROUP BY e.id`,
      [id],
    );
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

  /** Upserts the caller's up/down vote (one per user per proposed event). */
  async vote(eventId: string, userId: string, vote: 1 | -1): Promise<EventProposal> {
    await query(
      `INSERT INTO event_votes (event_id, user_id, vote)
       VALUES ($1, $2, $3)
       ON CONFLICT (event_id, user_id) DO UPDATE SET vote = EXCLUDED.vote`,
      [eventId, userId, vote],
    );
    return (await this.findById(eventId))!;
  },
};
