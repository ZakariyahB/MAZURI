/**
 * AI clustering service — the load-bearing AI of the product.
 *
 * Takes a community's OPEN incident reports and, in a single structured-output
 * call to the Anthropic Messages API:
 *   1. Groups near-duplicate / related reports into clusters.
 *   2. Attaches an urgency rank on the ladder: Safety > Facilities > General.
 *   3. Writes a one-line summary per cluster so admins can triage at a glance.
 *
 * The proposed embeddings-into-pgvector pipeline (README §7) remains a future
 * optimisation; at community scale a single LLM call clusters more accurately
 * and needs no separate vector store.
 */
import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../config/env';
import { AI_CLUSTERING_MODEL } from '../../config/constants';
import { incidentModel, type IncidentReport } from '../../models/incident.model';
import { AppError } from '../../utils/errors';

export type Urgency = 'safety' | 'facilities' | 'general';

export interface ReportCluster {
  clusterId: string;
  orgId: string;
  reportIds: string[];
  urgency: Urgency;
  summary: string;
}

const URGENCY_ORDER: Record<Urgency, number> = { safety: 0, facilities: 1, general: 2 };

/** True when a real Anthropic API key is present (not the .env.example placeholder). */
export function isAiConfigured(): boolean {
  return env.aiApiKey !== '' && env.aiApiKey !== 'your-ai-api-key-here';
}

// Structured-output schema: the response is guaranteed to parse into this shape.
const CLUSTERS_SCHEMA = {
  type: 'object',
  properties: {
    clusters: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          report_ids: {
            type: 'array',
            items: { type: 'string' },
            description: 'IDs of the reports in this cluster, verbatim from the input.',
          },
          urgency: {
            type: 'string',
            enum: ['safety', 'facilities', 'general'],
            description: 'Urgency ladder: safety > facilities > general.',
          },
          summary: {
            type: 'string',
            description: 'One sentence an admin can act on, e.g. "3 reports of broken heating in the main hall".',
          },
        },
        required: ['report_ids', 'urgency', 'summary'],
        additionalProperties: false,
      },
    },
  },
  required: ['clusters'],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `You triage incident reports for a community organisation (mosque, community centre, student society).
Group the reports into clusters of near-duplicates or reports about the same underlying issue; a report that stands alone forms its own cluster of one. Every report must appear in exactly one cluster.
Rank each cluster on the urgency ladder: "safety" (danger to people — fire exits, hazards, safeguarding), then "facilities" (broken or degraded facilities), then "general" (everything else). The reporter's self-selected severity (RED/AMBER/GREEN) is a hint, not ground truth — judge from the content.`;

function formatReports(reports: IncidentReport[]): string {
  const lines = reports.map(
    (r) => `- id: ${r.id}\n  severity: ${r.severity}\n  reported: ${r.created_at}\n  report: ${r.body.replace(/\n/g, ' ')}`,
  );
  return `Cluster these ${reports.length} open incident reports:\n\n${lines.join('\n')}`;
}

/** Cluster a community's open reports. Throws AppError(503) if the AI call fails. */
export async function clusterReports(orgId: string): Promise<ReportCluster[]> {
  const open = (await incidentModel.listByCommunity(orgId)).filter((r) => r.status === 'open');
  if (open.length === 0) return [];

  const client = new Anthropic({ apiKey: env.aiApiKey });

  let response: Anthropic.Message;
  try {
    response = await client.messages.create({
      model: AI_CLUSTERING_MODEL,
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: formatReports(open) }],
      output_config: { format: { type: 'json_schema', schema: CLUSTERS_SCHEMA } },
    });
  } catch (err) {
    throw new AppError(503, `AI clustering failed: ${(err as Error).message}`);
  }

  if (response.stop_reason !== 'end_turn') {
    throw new AppError(503, `AI clustering returned no result (stop_reason: ${response.stop_reason})`);
  }

  const text = response.content.find((block) => block.type === 'text')?.text ?? '';
  let parsed: { clusters: { report_ids: string[]; urgency: Urgency; summary: string }[] };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new AppError(503, 'AI clustering returned unparseable output');
  }

  // Keep only IDs that actually belong to this community's open reports.
  const validIds = new Set(open.map((r) => r.id));
  const clusters = parsed.clusters
    .map((c) => ({ ...c, report_ids: c.report_ids.filter((id) => validIds.has(id)) }))
    .filter((c) => c.report_ids.length > 0)
    .sort((a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency]);

  return clusters.map((c, i) => ({
    clusterId: `cluster-${i + 1}`,
    orgId,
    reportIds: c.report_ids,
    urgency: c.urgency,
    summary: c.summary,
  }));
}
