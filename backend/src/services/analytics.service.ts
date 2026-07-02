import { query } from '../config/db';
import { ACCOUNTABILITY_WINDOW_DAYS } from '../config/constants';

/**
 * Per-community accountability analytics — the public trust metric.
 *
 * "% addressed within 30 days" = share of ALL incident reports that were
 * resolved within ACCOUNTABILITY_WINDOW_DAYS of being raised. Suggestions have
 * no "implemented" state, so the metric is computed from incident reports;
 * suggestion counts are included for context.
 */
export interface CommunityAnalytics {
  incidents_total: number;
  incidents_resolved: number;
  incidents_resolved_within_window: number;
  /** null when the community has no reports yet. */
  addressed_within_window_pct: number | null;
  window_days: number;
  suggestions_total: number;
  suggestions_approved: number;
}

export async function computeAnalytics(communityId: string): Promise<CommunityAnalytics> {
  const { rows } = await query<{
    incidents_total: string;
    incidents_resolved: string;
    incidents_resolved_within_window: string;
    suggestions_total: string;
    suggestions_approved: string;
  }>(
    `SELECT
       (SELECT COUNT(*) FROM incident_reports WHERE community_id = $1) AS incidents_total,
       (SELECT COUNT(*) FROM incident_reports
         WHERE community_id = $1 AND status = 'resolved') AS incidents_resolved,
       (SELECT COUNT(*) FROM incident_reports
         WHERE community_id = $1 AND status = 'resolved'
           AND resolved_at <= created_at + make_interval(days => $2)) AS incidents_resolved_within_window,
       (SELECT COUNT(*) FROM suggestions WHERE community_id = $1) AS suggestions_total,
       (SELECT COUNT(*) FROM suggestions
         WHERE community_id = $1 AND status = 'approved') AS suggestions_approved`,
    [communityId, ACCOUNTABILITY_WINDOW_DAYS],
  );

  const r = rows[0];
  const total = Number(r.incidents_total);
  const withinWindow = Number(r.incidents_resolved_within_window);

  return {
    incidents_total: total,
    incidents_resolved: Number(r.incidents_resolved),
    incidents_resolved_within_window: withinWindow,
    addressed_within_window_pct: total > 0 ? Math.round((withinWindow / total) * 100) : null,
    window_days: ACCOUNTABILITY_WINDOW_DAYS,
    suggestions_total: Number(r.suggestions_total),
    suggestions_approved: Number(r.suggestions_approved),
  };
}
