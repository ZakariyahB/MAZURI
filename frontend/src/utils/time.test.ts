import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatDate, initials, timeAgo } from './time';

describe('timeAgo', () => {
  const now = new Date('2026-07-05T12:00:00.000Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();
  const SEC = 1000;
  const MIN = 60 * SEC;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;

  it('returns "just now" for < 60s', () => {
    expect(timeAgo(ago(30 * SEC))).toBe('just now');
  });

  it('returns minutes for < 60m', () => {
    expect(timeAgo(ago(5 * MIN))).toBe('5m ago');
    expect(timeAgo(ago(59 * MIN))).toBe('59m ago');
  });

  it('returns hours for < 24h', () => {
    expect(timeAgo(ago(3 * HOUR))).toBe('3h ago');
  });

  it('returns days for < 30d', () => {
    expect(timeAgo(ago(2 * DAY))).toBe('2d ago');
    expect(timeAgo(ago(29 * DAY))).toBe('29d ago');
  });

  it('falls back to a locale date for >= 30d', () => {
    const result = timeAgo(ago(40 * DAY));
    expect(result).not.toMatch(/ago|just now/);
    expect(result).toBe(new Date(ago(40 * DAY)).toLocaleDateString());
  });

  it('returns an empty string for an invalid date', () => {
    expect(timeAgo('not-a-date')).toBe('');
  });
});

describe('formatDate', () => {
  it('formats a valid ISO date', () => {
    const iso = '2026-06-12T18:00:00.000Z';
    expect(formatDate(iso)).toBe(
      new Date(iso).toLocaleString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    );
  });

  it('returns an empty string for an invalid date', () => {
    expect(formatDate('nope')).toBe('');
  });
});

describe('initials', () => {
  it('returns the uppercased first character', () => {
    expect(initials('amina@demo.local')).toBe('A');
    expect(initials('yusuf')).toBe('Y');
  });

  it('trims leading whitespace first', () => {
    expect(initials('  bilal')).toBe('B');
  });

  it('returns "?" for an empty string', () => {
    expect(initials('')).toBe('?');
    expect(initials('   ')).toBe('?');
  });
});
