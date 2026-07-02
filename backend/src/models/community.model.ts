import { pool, query, type Executor } from '../config/db';
import type { Tier } from '../config/constants';

export interface Community {
  id: string;
  name: string;
  join_code: string;
  join_password_hash: string;
  tier: Tier;
  created_at: string;
}

/** Community without the join-password hash — safe to return in API responses. */
export interface PublicCommunity {
  id: string;
  name: string;
  join_code: string;
  tier: Tier;
  created_at: string;
}

export const toPublicCommunity = (c: Community): PublicCommunity => ({
  id: c.id,
  name: c.name,
  join_code: c.join_code,
  tier: c.tier,
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

  /** Switch subscription tier (billing itself is mocked — see README §12). */
  async setTier(id: string, tier: Tier): Promise<Community | null> {
    const { rows } = await query<Community>(
      'UPDATE communities SET tier = $2 WHERE id = $1 RETURNING *',
      [id, tier],
    );
    return rows[0] ?? null;
  },
};
