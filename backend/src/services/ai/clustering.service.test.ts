import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../../utils/errors';
import type { IncidentReport } from '../../models/incident.model';

const messagesCreate = vi.hoisted(() => vi.fn());
const listByCommunity = vi.hoisted(() => vi.fn());
const envMock = vi.hoisted(() => ({ aiApiKey: 'sk-test-key' }));

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { create: messagesCreate };
  },
}));
vi.mock('../../config/env', () => ({ env: envMock }));
vi.mock('../../models/incident.model', () => ({
  incidentModel: { listByCommunity },
}));

import { clusterReports, isAiConfigured } from './clustering.service';

const report = (id: string, over: Partial<IncidentReport> = {}): IncidentReport => ({
  id,
  community_id: 'org-1',
  reporter_id: 'user-1',
  body: 'the heating is broken',
  severity: 'AMBER',
  status: 'open',
  created_at: '2026-07-01T00:00:00.000Z',
  resolved_at: null,
  ...over,
});

const aiResponse = (clusters: unknown, stopReason = 'end_turn') => ({
  stop_reason: stopReason,
  content: [{ type: 'text', text: JSON.stringify({ clusters }) }],
});

beforeEach(() => {
  messagesCreate.mockReset();
  listByCommunity.mockReset();
  envMock.aiApiKey = 'sk-test-key';
});

describe('isAiConfigured', () => {
  it('is true for a real key', () => {
    envMock.aiApiKey = 'sk-real';
    expect(isAiConfigured()).toBe(true);
  });

  it('is false for an empty key', () => {
    envMock.aiApiKey = '';
    expect(isAiConfigured()).toBe(false);
  });

  it('is false for the .env.example placeholder', () => {
    envMock.aiApiKey = 'your-ai-api-key-here';
    expect(isAiConfigured()).toBe(false);
  });
});

describe('clusterReports', () => {
  it('returns an empty array without calling the AI when there are no open reports', async () => {
    listByCommunity.mockResolvedValue([report('r1', { status: 'resolved' })]);
    const result = await clusterReports('org-1');
    expect(result).toEqual([]);
    expect(messagesCreate).not.toHaveBeenCalled();
  });

  it('maps AI clusters into ReportCluster objects with generated ids', async () => {
    listByCommunity.mockResolvedValue([report('r1'), report('r2')]);
    messagesCreate.mockResolvedValue(
      aiResponse([{ report_ids: ['r1', 'r2'], urgency: 'facilities', summary: 'broken heating' }]),
    );
    const result = await clusterReports('org-1');
    expect(result).toEqual([
      {
        clusterId: 'cluster-1',
        orgId: 'org-1',
        reportIds: ['r1', 'r2'],
        urgency: 'facilities',
        summary: 'broken heating',
      },
    ]);
  });

  it('orders clusters by the urgency ladder (safety > facilities > general)', async () => {
    listByCommunity.mockResolvedValue([report('r1'), report('r2'), report('r3')]);
    messagesCreate.mockResolvedValue(
      aiResponse([
        { report_ids: ['r1'], urgency: 'general', summary: 'g' },
        { report_ids: ['r2'], urgency: 'safety', summary: 's' },
        { report_ids: ['r3'], urgency: 'facilities', summary: 'f' },
      ]),
    );
    const result = await clusterReports('org-1');
    expect(result.map((c) => c.urgency)).toEqual(['safety', 'facilities', 'general']);
    expect(result.map((c) => c.clusterId)).toEqual(['cluster-1', 'cluster-2', 'cluster-3']);
  });

  it('drops report ids the AI hallucinated and empty clusters', async () => {
    listByCommunity.mockResolvedValue([report('r1')]);
    messagesCreate.mockResolvedValue(
      aiResponse([
        { report_ids: ['r1', 'ghost'], urgency: 'general', summary: 'a' },
        { report_ids: ['only-ghosts'], urgency: 'general', summary: 'b' },
      ]),
    );
    const result = await clusterReports('org-1');
    expect(result).toHaveLength(1);
    expect(result[0].reportIds).toEqual(['r1']);
  });

  it('throws AppError(503) when the AI call rejects', async () => {
    listByCommunity.mockResolvedValue([report('r1')]);
    messagesCreate.mockRejectedValue(new Error('network down'));
    await expect(clusterReports('org-1')).rejects.toMatchObject({
      constructor: AppError,
      statusCode: 503,
    });
  });

  it('throws AppError(503) when the model stops early', async () => {
    listByCommunity.mockResolvedValue([report('r1')]);
    messagesCreate.mockResolvedValue(aiResponse([], 'max_tokens'));
    await expect(clusterReports('org-1')).rejects.toMatchObject({ statusCode: 503 });
  });

  it('throws AppError(503) on unparseable output', async () => {
    listByCommunity.mockResolvedValue([report('r1')]);
    messagesCreate.mockResolvedValue({
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: 'not json' }],
    });
    await expect(clusterReports('org-1')).rejects.toMatchObject({ statusCode: 503 });
  });
});
