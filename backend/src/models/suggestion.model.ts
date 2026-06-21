import { query, type Executor } from '../config/db';
import type { SuggestionStatus } from '../config/constants';

export interface Suggestion {
  id: string;
  community_id: string;
  author_id: string;
  body: string;
  upvote_count: number;
  status: SuggestionStatus;
  created_at: string;
}

export const suggestionModel = {
  async create(communityId: string, authorId: string, body: string): Promise<Suggestion> {
    const { rows } = await query<Suggestion>(
      `INSERT INTO suggestions (community_id, author_id, body)
       VALUES ($1, $2, $3) RETURNING *`,
      [communityId, authorId, body],
    );
    return rows[0];
  },

  /** Approved suggestions, crowd-prioritised (most upvotes first). */
  async listApproved(communityId: string): Promise<Suggestion[]> {
    const { rows } = await query<Suggestion>(
      `SELECT * FROM suggestions
       WHERE community_id = $1 AND status = 'approved'
       ORDER BY upvote_count DESC, created_at DESC`,
      [communityId],
    );
    return rows;
  },

  /** Pending suggestions for the admin moderation queue (oldest first). */
  async listPending(communityId: string): Promise<Suggestion[]> {
    const { rows } = await query<Suggestion>(
      `SELECT * FROM suggestions
       WHERE community_id = $1 AND status = 'pending'
       ORDER BY created_at ASC`,
      [communityId],
    );
    return rows;
  },

  async findById(id: string): Promise<Suggestion | null> {
    const { rows } = await query<Suggestion>('SELECT * FROM suggestions WHERE id = $1', [id]);
    return rows[0] ?? null;
  },

  async setStatus(id: string, status: SuggestionStatus): Promise<Suggestion | null> {
    const { rows } = await query<Suggestion>(
      'UPDATE suggestions SET status = $2 WHERE id = $1 RETURNING *',
      [id, status],
    );
    return rows[0] ?? null;
  },

  /** Records a vote and bumps the cached count, within a caller-supplied tx. */
  async addVote(
    suggestionId: string,
    userId: string,
    executor: Executor,
  ): Promise<Suggestion> {
    await executor.query(
      'INSERT INTO suggestion_votes (suggestion_id, user_id) VALUES ($1, $2)',
      [suggestionId, userId],
    );
    const { rows } = await executor.query<Suggestion>(
      'UPDATE suggestions SET upvote_count = upvote_count + 1 WHERE id = $1 RETURNING *',
      [suggestionId],
    );
    return rows[0];
  },
};
