import { query, withTransaction } from '../config/db';
import type { PoolClient } from 'pg';

export interface Announcement {
  id: string;
  community_id: string;
  author_id: string;
  body: string;
  /** Public URLs of attached images (Supabase Storage), ordered. Usually 0 or 1. */
  images: string[];
  /** Edit timestamp, or null if never edited (drives the "Edited" indicator). */
  edited_at: string | null;
  created_at: string;
}

// SELECT that aggregates each announcement's image URLs (ordered) into a JSON
// array, so callers get a ready-to-use `images: string[]` field.
const SELECT_WITH_IMAGES = `
  SELECT a.*,
    COALESCE(
      (SELECT json_agg(i.url ORDER BY i.position, i.created_at)
       FROM announcement_images i WHERE i.announcement_id = a.id),
      '[]'::json
    ) AS images
  FROM announcements a`;

/** Replaces an announcement's images with the given ordered URLs (inside a txn). */
async function replaceImages(
  client: PoolClient,
  announcementId: string,
  imageUrls: string[],
): Promise<void> {
  await client.query('DELETE FROM announcement_images WHERE announcement_id = $1', [announcementId]);
  for (let i = 0; i < imageUrls.length; i += 1) {
    await client.query(
      'INSERT INTO announcement_images (announcement_id, url, position) VALUES ($1, $2, $3)',
      [announcementId, imageUrls[i], i],
    );
  }
}

export const announcementModel = {
  async create(
    communityId: string,
    authorId: string,
    body: string,
    imageUrls: string[] = [],
  ): Promise<Announcement> {
    return withTransaction(async (client) => {
      const {
        rows: [{ id }],
      } = await client.query<{ id: string }>(
        `INSERT INTO announcements (community_id, author_id, body)
         VALUES ($1, $2, $3) RETURNING id`,
        [communityId, authorId, body],
      );
      if (imageUrls.length > 0) await replaceImages(client, id, imageUrls);

      const { rows } = await client.query<Announcement>(`${SELECT_WITH_IMAGES} WHERE a.id = $1`, [
        id,
      ]);
      return rows[0];
    });
  },

  async listByCommunity(communityId: string): Promise<Announcement[]> {
    const { rows } = await query<Announcement>(
      `${SELECT_WITH_IMAGES} WHERE a.community_id = $1 ORDER BY a.created_at DESC`,
      [communityId],
    );
    return rows;
  },

  /** Announcements created by a specific admin (their own, for the manage list). */
  async listByAuthor(communityId: string, authorId: string): Promise<Announcement[]> {
    const { rows } = await query<Announcement>(
      `${SELECT_WITH_IMAGES}
       WHERE a.community_id = $1 AND a.author_id = $2
       ORDER BY a.created_at DESC`,
      [communityId, authorId],
    );
    return rows;
  },

  async findById(id: string): Promise<Announcement | null> {
    const { rows } = await query<Announcement>(`${SELECT_WITH_IMAGES} WHERE a.id = $1`, [id]);
    return rows[0] ?? null;
  },

  /**
   * Edits an announcement's body (and optionally replaces its images), stamping
   * edited_at. Passing `imageUrls === undefined` leaves images untouched.
   */
  async update(id: string, body: string, imageUrls?: string[]): Promise<Announcement> {
    return withTransaction(async (client) => {
      await client.query(
        'UPDATE announcements SET body = $2, edited_at = now() WHERE id = $1',
        [id, body],
      );
      if (imageUrls !== undefined) await replaceImages(client, id, imageUrls);

      const { rows } = await client.query<Announcement>(`${SELECT_WITH_IMAGES} WHERE a.id = $1`, [
        id,
      ]);
      return rows[0];
    });
  },
};
