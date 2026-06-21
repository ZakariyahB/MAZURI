import { pool, query, type Executor } from '../config/db';

export interface Community {
  id: string;
  name: string;
  join_code: string;
  join_password_hash: string;
  created_at: string;
}

/** Community without the join-password hash — safe to return in API responses. */
export interface PublicCommunity {
  id: string;
  name: string;
  join_code: string;
  created_at: string;
}

export const toPublicCommunity = (c: Community): PublicCommunity => ({
  id: c.id,
  name: c.name,
  join_code: c.join_code,
  created_at: c.created_at,
});

export const communityModel = {
  async create(
    name: string,
    joinCode: string,
    joinPasswordHash: string,
    executor: Executor = pool,
  ): Promise<Community> {
    const { rows } = await executor.query<Community>(
      'INSERT INTO communities (name, join_code, join_password_hash) VALUES ($1, $2, $3) RETURNING *',
      [name, joinCode, joinPasswordHash],
    );
    return rows[0];
  },

  async findByCode(joinCode: string): Promise<Community | null> {
    const { rows } = await query<Community>('SELECT * FROM communities WHERE join_code = $1', [
      joinCode,
    ]);
    return rows[0] ?? null;
  },

  async findById(id: string): Promise<Community | null> {
    const { rows } = await query<Community>('SELECT * FROM communities WHERE id = $1', [id]);
    return rows[0] ?? null;
  },
};
