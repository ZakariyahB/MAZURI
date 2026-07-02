import type { PoolClient } from 'pg';
import { pool, withTransaction } from '../config/db';
import { runMigrations } from './migrate';
import { hashSecret } from '../services/auth.service';

/**
 * Seeds one realistic demo org — East London Mosque — for the pitch demo loop
 * (README §10): suggestions with real vote counts, a moderation queue, a
 * cluster-friendly incident queue (three near-duplicate heating reports), a
 * resolved incident inside the 30-day window so "% addressed" is non-zero,
 * events (one rateable past, one upcoming), announcements and posts.
 *
 * Idempotent-by-guard: exits cleanly if the demo community already exists.
 * Run with: npm run db:seed
 */

const JOIN_CODE = 'ELM2026';
const PASSWORD = 'password123'; // every demo account
const JOIN_PASSWORD = 'welcome1';

const daysAgo = (n: number): Date => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const daysAhead = (n: number): Date => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

async function insertUser(client: PoolClient, email: string, hash: string): Promise<string> {
  const { rows } = await client.query<{ id: string }>(
    `INSERT INTO users (email, password_hash) VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
     RETURNING id`,
    [email, hash],
  );
  return rows[0].id;
}

async function seed(): Promise<void> {
  await runMigrations();

  const existing = await pool.query('SELECT 1 FROM communities WHERE join_code = $1', [JOIN_CODE]);
  if (existing.rowCount) {
    console.log(`Demo community already seeded (join code ${JOIN_CODE}) — nothing to do.`);
    return;
  }

  const passwordHash = await hashSecret(PASSWORD);
  const joinPasswordHash = await hashSecret(JOIN_PASSWORD);

  await withTransaction(async (client) => {
    // People
    const imam = await insertUser(client, 'imam@demo.local', passwordHash);
    const amina = await insertUser(client, 'amina@demo.local', passwordHash);
    const yusuf = await insertUser(client, 'yusuf@demo.local', passwordHash);
    const fatima = await insertUser(client, 'fatima@demo.local', passwordHash);

    // The org — seeded on the Insights tier so the AI triage demo works out of the box.
    const {
      rows: [{ id: elm }],
    } = await client.query<{ id: string }>(
      `INSERT INTO communities (name, join_code, join_password_hash, tier, created_at)
       VALUES ($1, $2, $3, 'insights', $4) RETURNING id`,
      ['East London Mosque', JOIN_CODE, joinPasswordHash, daysAgo(60)],
    );

    for (const [userId, role] of [
      [imam, 'admin'],
      [amina, 'member'],
      [yusuf, 'member'],
      [fatima, 'member'],
    ] as const) {
      await client.query(
        `INSERT INTO memberships (user_id, community_id, role, joined_at) VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, community_id) DO NOTHING`,
        [userId, elm, role, daysAgo(55)],
      );
    }

    // Suggestions — three approved (with genuine one-vote-per-user rows), one pending.
    const suggestions: [string, string, number, string[], 'approved' | 'pending'][] = [
      ['Earlier Fajr congregation during the long summer days.', imam, 45, [amina, yusuf, fatima], 'approved'],
      ['Warmer, dimmable lighting in the main prayer hall for evening prayers.', amina, 30, [yusuf, fatima], 'approved'],
      ['A small Islamic library bookshelf for the sisters’ section.', fatima, 12, [amina], 'approved'],
      ['Secure bike racks at the main entrance for members who cycle to prayers.', yusuf, 2, [], 'pending'],
    ];
    for (const [body, author, ageDays, voters, status] of suggestions) {
      const {
        rows: [{ id: sid }],
      } = await client.query<{ id: string }>(
        `INSERT INTO suggestions (community_id, author_id, body, upvote_count, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [elm, author, body, voters.length, status, daysAgo(ageDays)],
      );
      for (const voter of voters) {
        await client.query(
          'INSERT INTO suggestion_votes (suggestion_id, user_id, created_at) VALUES ($1, $2, $3)',
          [sid, voter, daysAgo(ageDays - 1)],
        );
      }
    }

    // Incident reports — three near-duplicate heating reports (the AI clustering
    // demo), one RED safety issue, one GREEN, and one resolved within 30 days so
    // the accountability metric is non-zero.
    const incidents: [string, string, 'RED' | 'AMBER' | 'GREEN', number, number | null][] = [
      ['Boxes are stacked against the fire exit next to the wudu area — it cannot be opened.', amina, 'RED', 2, null],
      ['The heating in the main hall has not worked since Friday. It was freezing at Isha.', yusuf, 'AMBER', 4, null],
      ['Main hall radiators are stone cold again — elderly members are struggling.', fatima, 'AMBER', 3, null],
      ['No heat in the prayer hall this morning, third time this month.', amina, 'AMBER', 1, null],
      ['The light in the back corner of the car park is flickering.', yusuf, 'GREEN', 6, null],
      ['Second sink from the left in the men’s wudu area drips constantly.', fatima, 'AMBER', 20, 15],
    ];
    for (const [body, reporter, severity, createdDaysAgo, resolvedDaysAgo] of incidents) {
      await client.query(
        `INSERT INTO incident_reports (community_id, reporter_id, body, severity, status, created_at, resolved_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          elm,
          reporter,
          body,
          severity,
          resolvedDaysAgo === null ? 'open' : 'resolved',
          daysAgo(createdDaysAgo),
          resolvedDaysAgo === null ? null : daysAgo(resolvedDaysAgo),
        ],
      );
    }

    // Events — one past (rateable), one upcoming proposal.
    const {
      rows: [{ id: iftar }],
    } = await client.query<{ id: string }>(
      `INSERT INTO events (community_id, title, description, event_date, status, created_at)
       VALUES ($1, $2, $3, $4, 'confirmed', $5) RETURNING id`,
      [elm, 'Community Iftar', 'Shared iftar in the main hall — all welcome.', daysAgo(10), daysAgo(30)],
    );
    for (const [user, rating] of [
      [amina, 5],
      [yusuf, 4],
      [fatima, 5],
    ] as const) {
      await client.query(
        'INSERT INTO event_ratings (event_id, user_id, rating, created_at) VALUES ($1, $2, $3, $4)',
        [iftar, user, rating, daysAgo(9)],
      );
    }
    await client.query(
      `INSERT INTO events (community_id, title, description, event_date, status, created_at)
       VALUES ($1, $2, $3, $4, 'potential', $5)`,
      [elm, 'Youth football tournament', 'Proposed five-a-side tournament at Mile End park.', daysAhead(14), daysAgo(5)],
    );

    // Announcements — the "loop closed" posts — and a community post.
    for (const [body, ageDays] of [
      ['Warm dimmable LEDs are now fitted in the main prayer hall — thank you for the 30 upvotes that made the case.', 2],
      ['The dripping tap in the men’s wudu area has been repaired.', 14],
    ] as const) {
      await client.query(
        'INSERT INTO announcements (community_id, author_id, body, created_at) VALUES ($1, $2, $3, $4)',
        [elm, imam, body, daysAgo(ageDays)],
      );
    }
    await client.query(
      'INSERT INTO posts (community_id, author_id, body, created_at) VALUES ($1, $2, $3, $4)',
      [
        elm,
        imam,
        'Jumu’ah overflow parking moves to the rear lot from this Friday — please follow the stewards.',
        daysAgo(3),
      ],
    );
  });

  console.log('Seeded demo org "East London Mosque".');
  console.log(`  Join code: ${JOIN_CODE}   Join password: ${JOIN_PASSWORD}`);
  console.log('  Accounts (password for all: password123):');
  console.log('    imam@demo.local   (admin)');
  console.log('    amina@demo.local  (member)');
  console.log('    yusuf@demo.local  (member)');
  console.log('    fatima@demo.local (member)');
}

seed()
  .then(() => pool.end())
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
