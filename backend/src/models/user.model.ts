import { query } from '../config/db';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
}

/** User without the password hash — safe to return in API responses. */
export interface PublicUser {
  id: string;
  email: string;
  created_at: string;
}

export const toPublicUser = (u: User): PublicUser => ({
  id: u.id,
  email: u.email,
  created_at: u.created_at,
});

export const userModel = {
  async create(email: string, passwordHash: string): Promise<User> {
    const { rows } = await query<User>(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *',
      [email, passwordHash],
    );
    return rows[0];
  },

  async findByEmail(email: string): Promise<User | null> {
    const { rows } = await query<User>('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0] ?? null;
  },

  async findById(id: string): Promise<User | null> {
    const { rows } = await query<User>('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0] ?? null;
  },
};
