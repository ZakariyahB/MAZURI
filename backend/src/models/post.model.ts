import { query } from '../config/db';

export interface Post {
  id: string;
  community_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export const postModel = {
  async create(communityId: string, authorId: string, body: string): Promise<Post> {
    const { rows } = await query<Post>(
      'INSERT INTO posts (community_id, author_id, body) VALUES ($1, $2, $3) RETURNING *',
      [communityId, authorId, body],
    );
    return rows[0];
  },

  async listByCommunity(communityId: string): Promise<Post[]> {
    const { rows } = await query<Post>(
      'SELECT * FROM posts WHERE community_id = $1 ORDER BY created_at DESC',
      [communityId],
    );
    return rows;
  },
};
