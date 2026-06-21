import { query } from '../config/db';

export interface Announcement {
  id: string;
  community_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export const announcementModel = {
  async create(communityId: string, authorId: string, body: string): Promise<Announcement> {
    const { rows } = await query<Announcement>(
      `INSERT INTO announcements (community_id, author_id, body)
       VALUES ($1, $2, $3) RETURNING *`,
      [communityId, authorId, body],
    );
    return rows[0];
  },

  async listByCommunity(communityId: string): Promise<Announcement[]> {
    const { rows } = await query<Announcement>(
      'SELECT * FROM announcements WHERE community_id = $1 ORDER BY created_at DESC',
      [communityId],
    );
    return rows;
  },
};
