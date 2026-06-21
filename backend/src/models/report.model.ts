import type { Urgency } from '../services/ai/clustering.service';

/**
 * A private, admin-only member report. Gets AI-clustered and urgency-ranked
 * later; `clusterId` / `urgency` are populated by the clustering service.
 */
export interface Report {
  id: string;
  orgId: string;
  authorId: string;
  category: string;
  body: string;
  urgency: Urgency | null;
  clusterId: string | null;
  createdAt: string;
}

// Data-layer stub — real pg queries wired later.
export const reportModel = {
  async listByOrg(_orgId: string): Promise<Report[]> {
    return [];
  },
};
