import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';
import { env } from './env';

/**
 * Shared PostgreSQL connection pool.
 *
 * pgvector lives in this same database (see docker/postgres/init.sql) so report
 * clustering can use embeddings later — no separate vector store.
 *
 * Managed Postgres (Supabase in production) requires TLS. We enable SSL when the
 * connection string asks for it (`sslmode=require`, as Supabase's string does) or
 * when DATABASE_SSL=true is set — and never for the local Docker/dev database.
 */
const useSsl =
  /sslmode=require/i.test(env.databaseUrl) || process.env.DATABASE_SSL === 'true';

export const pool = new Pool({
  connectionString: env.databaseUrl,
  // Supabase presents a certificate chain that isn't in the container's trust
  // store; rejectUnauthorized:false keeps TLS on the wire without pinning it.
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

/** Anything that can run a query — the pool, or a client inside a transaction. */
export type Executor = Pool | PoolClient;

/** Convenience query helper using the shared pool. */
export function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values?: unknown[],
): Promise<QueryResult<T>> {
  return pool.query<T>(text, values as unknown[]);
}

/**
 * Runs `fn` inside a transaction, committing on success and rolling back on any
 * error. Used where multiple writes must be atomic (e.g. create community +
 * creator membership, or insert vote + increment count).
 */
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Lightweight connectivity probe for health/readiness checks. */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
