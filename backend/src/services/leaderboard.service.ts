import { query } from '../config/db';
import { LEADERBOARD_WEIGHTS, LEADERBOARD_WINDOW_DAYS } from '../config/constants';

interface RawMetrics {
  id: string;
  name: string;
  reported_30d: number;
  resolved_30d: number;
  events_30d: number;
  avg_rating: number;
  suggestions_30d: number;
}

export interface LeaderboardEntry {
  communityId: string;
  name: string;
  score: number;
  metrics: {
    incidentsReported: number;
    incidentsResolved: number;
    resolvedRatio: number;
    eventsHeld: number;
    avgRating: number;
    suggestions: number;
  };
  components: {
    resolved: number;
    events: number;
    rating: number;
    activity: number;
  };
}

/** Min–max normalise to [0, 1]; returns 0 when all values are equal. */
function normalise(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return (value - min) / (max - min);
}

const round = (n: number, dp = 4): number => Number(n.toFixed(dp));

/**
 * Computes the cross-community leaderboard on read.
 *
 * Per community over a rolling window: a resolved-incident ratio, plus
 * min–max-normalised events-held and suggestion-activity counts, plus average
 * event rating scaled to [0, 1]. These are combined with the configured weights
 * (see config/constants.ts) and the list is returned sorted by score desc.
 */
export async function computeLeaderboard(): Promise<LeaderboardEntry[]> {
  const window = `${LEADERBOARD_WINDOW_DAYS} days`;

  const { rows } = await query<RawMetrics>(
    `
    SELECT
      c.id,
      c.name,
      COALESCE(rep.cnt, 0)::int   AS reported_30d,
      COALESCE(res.cnt, 0)::int   AS resolved_30d,
      COALESCE(ev.cnt, 0)::int    AS events_30d,
      COALESCE(rt.avg, 0)::float  AS avg_rating,
      COALESCE(sg.cnt, 0)::int    AS suggestions_30d
    FROM communities c
    LEFT JOIN (
      SELECT community_id, COUNT(*) cnt FROM incident_reports
      WHERE created_at >= now() - $1::interval
      GROUP BY community_id
    ) rep ON rep.community_id = c.id
    LEFT JOIN (
      SELECT community_id, COUNT(*) cnt FROM incident_reports
      WHERE status = 'resolved' AND resolved_at >= now() - $1::interval
      GROUP BY community_id
    ) res ON res.community_id = c.id
    LEFT JOIN (
      SELECT community_id, COUNT(*) cnt FROM events
      WHERE event_date >= now() - $1::interval AND event_date <= now()
      GROUP BY community_id
    ) ev ON ev.community_id = c.id
    LEFT JOIN (
      SELECT e.community_id, AVG(r.rating) avg FROM event_ratings r
      JOIN events e ON e.id = r.event_id
      WHERE e.event_date >= now() - $1::interval AND e.event_date <= now()
      GROUP BY e.community_id
    ) rt ON rt.community_id = c.id
    LEFT JOIN (
      SELECT community_id, COUNT(*) cnt FROM suggestions
      WHERE created_at >= now() - $1::interval
      GROUP BY community_id
    ) sg ON sg.community_id = c.id
    `,
    [window],
  );

  if (rows.length === 0) return [];

  const eventVals = rows.map((r) => r.events_30d);
  const suggVals = rows.map((r) => r.suggestions_30d);
  const eMin = Math.min(...eventVals);
  const eMax = Math.max(...eventVals);
  const sMin = Math.min(...suggVals);
  const sMax = Math.max(...suggVals);

  const entries = rows.map((r): LeaderboardEntry => {
    const resolvedRatio = r.reported_30d > 0 ? Math.min(r.resolved_30d / r.reported_30d, 1) : 0;
    const eventsNorm = normalise(r.events_30d, eMin, eMax);
    const ratingNorm = r.avg_rating / 5;
    const activityNorm = normalise(r.suggestions_30d, sMin, sMax);

    const resolved = LEADERBOARD_WEIGHTS.resolved * resolvedRatio;
    const events = LEADERBOARD_WEIGHTS.events * eventsNorm;
    const rating = LEADERBOARD_WEIGHTS.rating * ratingNorm;
    const activity = LEADERBOARD_WEIGHTS.activity * activityNorm;

    return {
      communityId: r.id,
      name: r.name,
      score: round(resolved + events + rating + activity),
      metrics: {
        incidentsReported: r.reported_30d,
        incidentsResolved: r.resolved_30d,
        resolvedRatio: round(resolvedRatio),
        eventsHeld: r.events_30d,
        avgRating: round(r.avg_rating, 2),
        suggestions: r.suggestions_30d,
      },
      components: {
        resolved: round(resolved),
        events: round(events),
        rating: round(rating),
        activity: round(activity),
      },
    };
  });

  entries.sort((a, b) => b.score - a.score);
  return entries;
}
