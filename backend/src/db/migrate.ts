import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pool } from '../config/db';

/**
 * Applies the (idempotent) schema. Safe to run repeatedly and on every boot.
 * Reads schema.sql relative to this file (works under tsx in dev).
 */
export async function runMigrations(): Promise<void> {
  const sql = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
}

// Allow running standalone: `npm run db:migrate`.
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migrations applied.');
      return pool.end();
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
