import { query } from '../config/db';
import type { IncidentStatus, Severity } from '../config/constants';

export interface IncidentReport {
  id: string;
  community_id: string;
  reporter_id: string;
  body: string;
  severity: Severity;
  status: IncidentStatus;
  created_at: string;
  resolved_at: string | null;
}

export const incidentModel = {
  async create(
    communityId: string,
    reporterId: string,
    body: string,
    severity: Severity,
  ): Promise<IncidentReport> {
    const { rows } = await query<IncidentReport>(
      `INSERT INTO incident_reports (community_id, reporter_id, body, severity)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [communityId, reporterId, body, severity],
    );
    return rows[0];
  },

  /** Admin queue: open first, then by severity (RED > AMBER > GREEN), newest first. */
  async listByCommunity(communityId: string): Promise<IncidentReport[]> {
    const { rows } = await query<IncidentReport>(
      `SELECT * FROM incident_reports
       WHERE community_id = $1
       ORDER BY (status = 'open') DESC,
                CASE severity WHEN 'RED' THEN 0 WHEN 'AMBER' THEN 1 ELSE 2 END,
                created_at DESC`,
      [communityId],
    );
    return rows;
  },

  async findById(id: string): Promise<IncidentReport | null> {
    const { rows } = await query<IncidentReport>('SELECT * FROM incident_reports WHERE id = $1', [
      id,
    ]);
    return rows[0] ?? null;
  },

  /** Resolves an open incident. Returns null if it wasn't open. */
  async resolve(id: string): Promise<IncidentReport | null> {
    const { rows } = await query<IncidentReport>(
      `UPDATE incident_reports SET status = 'resolved', resolved_at = now()
       WHERE id = $1 AND status = 'open' RETURNING *`,
      [id],
    );
    return rows[0] ?? null;
  },
};
