import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';
import { env } from './env';

/**
 * Shared PostgreSQL connection pool.
 *
 * pgvector lives in this same database (see docker/postgres/init.sql) so report
 * clustering can use embeddings later — no separate vector store.
 *
 * Managed Postgres (Supabase in production) requires TLS. We enable SSL when the
 * connection string asks for it (any `sslmode=`, as Supabase's string does), when
 * the host is a managed provider, or when DATABASE_SSL=true — and never for the
 * local Docker/dev database.
 */
const useSsl =
  /sslmode=/i.test(env.databaseUrl) ||
  /\b(supabase|neon|render|amazonaws|railway)\b/i.test(env.databaseUrl) ||
  process.env.DATABASE_SSL === 'true';

// node-postgres lets the connection string's `sslmode` override the explicit
// `ssl` option below, which re-enables cert verification and breaks on Supabase's
// self-signed chain. Strip `sslmode` from the URL so our ssl config is the sole
// authority over TLS behaviour.
const connectionString = env.databaseUrl.replace(/([?&])sslmode=[^&]*(&|$)/i, (_m, sep, tail) =>
  sep === '?' && tail === '&' ? '?' : sep === '?' ? '' : tail,
);

export const pool = new Pool({
  connectionString,
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

/** True when `err` is a Postgres unique-constraint violation (SQLSTATE 23505). */
export function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505';
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
