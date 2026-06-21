import { Pool } from 'pg';
import { env } from './env';

/**
 * Shared PostgreSQL connection pool.
 *
 * pgvector lives in this same database (see docker/postgres/init.sql) so report
 * clustering can query embeddings later — no separate vector store.
 *
 * The pool connects lazily on first query, so importing this module does not
 * require the database to be up (the scaffold boots without a live DB).
 */
export const pool = new Pool({
  connectionString: env.databaseUrl,
});

/** Lightweight connectivity probe for later use in health/readiness checks. */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
