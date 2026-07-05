import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LEADERBOARD_WEIGHTS } from '../config/constants';

const query = vi.hoisted(() => vi.fn());
vi.mock('../config/db', () => ({ query }));

import { computeLeaderboard } from './leaderboard.service';

interface RawRow {
  id: string;
  name: string;
  reported_30d: number;
  resolved_30d: number;
  events_30d: number;
  avg_rating: number;
  suggestions_30d: number;
}

const row = (over: Partial<RawRow> & Pick<RawRow, 'id' | 'name'>): RawRow => ({
  reported_30d: 0,
  resolved_30d: 0,
  events_30d: 0,
  avg_rating: 0,
  suggestions_30d: 0,
  ...over,
});

const mockRows = (rows: RawRow[]) => query.mockResolvedValueOnce({ rows });

beforeEach(() => {
  query.mockReset();
});

describe('computeLeaderboard', () => {
  it('returns an empty list when there are no communities', async () => {
    mockRows([]);
    await expect(computeLeaderboard()).resolves.toEqual([]);
  });

  it('queries over the configured rolling window', async () => {
    mockRows([]);
    await computeLeaderboard();
    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0][1]).toEqual(['30 days']);
  });

  it('computes the resolved ratio, capping it at 1', async () => {
    mockRows([
      row({ id: 'a', name: 'A', reported_30d: 4, resolved_30d: 2 }),
      // more resolved than reported (windowing artefact) => ratio capped at 1
      row({ id: 'b', name: 'B', reported_30d: 1, resolved_30d: 3 }),
    ]);
    const result = await computeLeaderboard();
    const a = result.find((e) => e.communityId === 'a')!;
    const b = result.find((e) => e.communityId === 'b')!;
    expect(a.metrics.resolvedRatio).toBe(0.5);
    expect(b.metrics.resolvedRatio).toBe(1);
  });

  it('gives a zero resolved ratio when nothing was reported', async () => {
    mockRows([row({ id: 'a', name: 'A', reported_30d: 0, resolved_30d: 0 })]);
    const [entry] = await computeLeaderboard();
    expect(entry.metrics.resolvedRatio).toBe(0);
    expect(entry.components.resolved).toBe(0);
  });

  it('min-max normalises events and suggestions across communities', async () => {
    mockRows([
      row({ id: 'lo', name: 'Lo', events_30d: 0, suggestions_30d: 0 }),
      row({ id: 'hi', name: 'Hi', events_30d: 10, suggestions_30d: 20 }),
    ]);
    const result = await computeLeaderboard();
    const hi = result.find((e) => e.communityId === 'hi')!;
    const lo = result.find((e) => e.communityId === 'lo')!;
    // max normalises to 1 => weight * 1; min normalises to 0.
    expect(hi.components.events).toBeCloseTo(LEADERBOARD_WEIGHTS.events, 5);
    expect(hi.components.activity).toBeCloseTo(LEADERBOARD_WEIGHTS.activity, 5);
    expect(lo.components.events).toBe(0);
    expect(lo.components.activity).toBe(0);
  });

  it('scales average rating to [0,1] before weighting', async () => {
    mockRows([row({ id: 'a', name: 'A', avg_rating: 5 })]);
    const [entry] = await computeLeaderboard();
    // full 5-star rating => rating component equals the full rating weight
    expect(entry.components.rating).toBeCloseTo(LEADERBOARD_WEIGHTS.rating, 5);
    expect(entry.metrics.avgRating).toBe(5);
  });

  it('sorts entries by score descending', async () => {
    mockRows([
      row({ id: 'weak', name: 'Weak', reported_30d: 2, resolved_30d: 0 }),
      row({ id: 'strong', name: 'Strong', reported_30d: 2, resolved_30d: 2, avg_rating: 5 }),
    ]);
    const result = await computeLeaderboard();
    expect(result.map((e) => e.communityId)).toEqual(['strong', 'weak']);
    expect(result[0].score).toBeGreaterThan(result[1].score);
  });

  it('rounds the score to 4 decimal places', async () => {
    mockRows([row({ id: 'a', name: 'A', reported_30d: 3, resolved_30d: 1 })]);
    const [entry] = await computeLeaderboard();
    // 0.4 * (1/3) = 0.1333...
    expect(entry.score).toBe(0.1333);
  });
});
