-- Community Bridge schema (idempotent). Applied by src/db/migrate.ts and on boot.
-- UUID PKs via gen_random_uuid() (built into PostgreSQL 13+).

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS communities (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL,
  join_code          TEXT UNIQUE NOT NULL,
  join_password_hash TEXT NOT NULL,
  -- Subscription tier: 'free' (core) or 'insights' (AI clustering + analytics).
  tier               TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'insights')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Additive migration for databases created before the tier column existed.
ALTER TABLE communities ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'free';

-- A user belongs to many communities; membership carries the per-community role.
CREATE TABLE IF NOT EXISTS memberships (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  role         TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, community_id)
);

CREATE TABLE IF NOT EXISTS suggestions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  author_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body         TEXT NOT NULL,
  upvote_count INTEGER NOT NULL DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One vote per user per suggestion (enforced by the unique constraint).
CREATE TABLE IF NOT EXISTS suggestion_votes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id UUID NOT NULL REFERENCES suggestions(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (suggestion_id, user_id)
);

CREATE TABLE IF NOT EXISTS incident_reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  reporter_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body         TEXT NOT NULL,
  severity     TEXT NOT NULL CHECK (severity IN ('RED', 'AMBER', 'GREEN')),
  status       TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  event_date   TIMESTAMPTZ NOT NULL,
  status       TEXT NOT NULL DEFAULT 'potential' CHECK (status IN ('potential', 'confirmed')),
  -- Content type: 'proposed' events are floated for interest (members up/downvote);
  -- 'past' events have already happened (members rate 1-5). These are two distinct
  -- admin creation flows, kept separate throughout the UI and backend.
  kind         TEXT NOT NULL DEFAULT 'past' CHECK (kind IN ('proposed', 'past')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Additive migration for databases created before the kind column existed.
-- Backfill: pre-existing 'potential' events were interest proposals.
ALTER TABLE events ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'past';
UPDATE events SET kind = 'proposed' WHERE status = 'potential' AND kind = 'past';

-- One rating per user per event (members rate PAST events they attended).
CREATE TABLE IF NOT EXISTS event_ratings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

-- One up/down vote per user per PROPOSED event (gauges interest before committing).
CREATE TABLE IF NOT EXISTS event_votes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote       SMALLINT NOT NULL CHECK (vote IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

CREATE TABLE IF NOT EXISTS announcements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  author_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body         TEXT NOT NULL,
  -- Set to the edit time when an announcement is edited; NULL means never edited
  -- (drives the "Edited" indicator in the feed).
  edited_at    TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Additive migration for databases created before edited_at existed.
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- Images attached to announcements, stored in Supabase Storage (only the public
-- URL is kept here). A separate table (rather than a column on announcements) so
-- supporting multiple images per announcement later is just more rows — no schema
-- change. `position` orders them; today the UI attaches at most one.
CREATE TABLE IF NOT EXISTS announcement_images (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  position        INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS posts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  author_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body         TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_community ON memberships(community_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_community ON suggestions(community_id);
CREATE INDEX IF NOT EXISTS idx_incidents_community ON incident_reports(community_id);
CREATE INDEX IF NOT EXISTS idx_events_community ON events(community_id);
CREATE INDEX IF NOT EXISTS idx_announcements_community ON announcements(community_id);
CREATE INDEX IF NOT EXISTS idx_announcement_images_announcement ON announcement_images(announcement_id);
CREATE INDEX IF NOT EXISTS idx_event_votes_event ON event_votes(event_id);
CREATE INDEX IF NOT EXISTS idx_posts_community ON posts(community_id);
