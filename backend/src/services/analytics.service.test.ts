import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ACCOUNTABILITY_WINDOW_DAYS } from '../config/constants';

const query = vi.hoisted(() => vi.fn());
vi.mock('../config/db', () => ({ query }));

import { computeAnalytics } from './analytics.service';

interface Counts {
  incidents_total: string;
  incidents_resolved: string;
  incidents_resolved_within_window: string;
  suggestions_total: string;
  suggestions_approved: string;
}

const mockCounts = (c: Counts) => query.mockResolvedValueOnce({ rows: [c] });

beforeEach(() => {
  query.mockReset();
});

describe('computeAnalytics', () => {
  it('passes the community id and accountability window to the query', async () => {
    mockCounts({
      incidents_total: '0',
      incidents_resolved: '0',
      incidents_resolved_within_window: '0',
      suggestions_total: '0',
      suggestions_approved: '0',
    });
    await computeAnalytics('community-1');
    expect(query.mock.calls[0][1]).toEqual(['community-1', ACCOUNTABILITY_WINDOW_DAYS]);
  });

  it('coerces the string counts returned by pg into numbers', async () => {
    mockCounts({
      incidents_total: '10',
      incidents_resolved: '7',
      incidents_resolved_within_window: '5',
      suggestions_total: '4',
      suggestions_approved: '3',
    });
    const result = await computeAnalytics('c');
    expect(result).toMatchObject({
      incidents_total: 10,
      incidents_resolved: 7,
      incidents_resolved_within_window: 5,
      suggestions_total: 4,
      suggestions_approved: 3,
      window_days: ACCOUNTABILITY_WINDOW_DAYS,
    });
  });

  it('computes the addressed-within-window percentage, rounded', async () => {
    mockCounts({
      incidents_total: '8',
      incidents_resolved: '5',
      incidents_resolved_within_window: '5',
      suggestions_total: '0',
      suggestions_approved: '0',
    });
    const result = await computeAnalytics('c');
    // 5 / 8 = 62.5 => rounds to 63
    expect(result.addressed_within_window_pct).toBe(63);
  });

  it('returns null for the percentage when there are no incidents', async () => {
    mockCounts({
      incidents_total: '0',
      incidents_resolved: '0',
      incidents_resolved_within_window: '0',
      suggestions_total: '2',
      suggestions_approved: '1',
    });
    const result = await computeAnalytics('c');
    expect(result.addressed_within_window_pct).toBeNull();
  });
});
