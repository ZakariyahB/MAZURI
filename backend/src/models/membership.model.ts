import { pool, query, type Executor } from '../config/db';
import type { Role } from '../config/constants';

export interface Membership {
  id: string;
  user_id: string;
  community_id: string;
  role: Role;
  joined_at: string;
}

/** A community in a user's list, with the user's role in it. */
export interface CommunityWithRole {
  id: string;
  name: string;
  join_code: string;
  created_at: string;
  role: Role;
  joined_at: string;
}

/** A member of a community, with their email. */
export interface CommunityMember {
  user_id: string;
  email: string;
  role: Role;
  joined_at: string;
}

export const membershipModel = {
  async create(
    userId: string,
    communityId: string,
    role: Role,
    executor: Executor = pool,
  ): Promise<Membership> {
    const { rows } = await executor.query<Membership>(
      'INSERT INTO memberships (user_id, community_id, role) VALUES ($1, $2, $3) RETURNING *',
      [userId, communityId, role],
    );
    return rows[0];
  },

  async find(userId: string, communityId: string): Promise<Membership | null> {
    const { rows } = await query<Membership>(
      'SELECT * FROM memberships WHERE user_id = $1 AND community_id = $2',
      [userId, communityId],
    );
    return rows[0] ?? null;
  },

  async listForUser(userId: string): Promise<CommunityWithRole[]> {
    const { rows } = await query<CommunityWithRole>(
      `SELECT c.id, c.name, c.join_code, c.created_at, m.role, m.joined_at
       FROM memberships m
       JOIN communities c ON c.id = m.community_id
       WHERE m.user_id = $1
       ORDER BY m.joined_at DESC`,
      [userId],
    );
    return rows;
  },

  async listMembers(communityId: string): Promise<CommunityMember[]> {
    const { rows } = await query<CommunityMember>(
      `SELECT m.user_id, u.email, m.role, m.joined_at
       FROM memberships m
       JOIN users u ON u.id = m.user_id
       WHERE m.community_id = $1
       ORDER BY m.role, u.email`,
      [communityId],
    );
    return rows;
  },

  /** Promotes an existing member to admin. Returns null if they aren't a member. */
  async promoteToAdmin(userId: string, communityId: string): Promise<Membership | null> {
    const { rows } = await query<Membership>(
      `UPDATE memberships SET role = 'admin'
       WHERE user_id = $1 AND community_id = $2
       RETURNING *`,
      [userId, communityId],
    );
    return rows[0] ?? null;
  },
};
