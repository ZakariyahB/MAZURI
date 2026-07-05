import { describe, expect, it } from 'vitest';
import { AppError } from './errors';
import { intInRange, isoDate, oneOf, optionalStr, str } from './validation';

describe('str', () => {
  it('returns the trimmed value', () => {
    expect(str('  hello  ', 'name')).toBe('hello');
  });

  it('throws a 400 for a non-string', () => {
    expect(() => str(42, 'name')).toThrowError(AppError);
    try {
      str(42, 'name');
    } catch (err) {
      expect((err as AppError).statusCode).toBe(400);
      expect((err as AppError).message).toBe('name is required');
    }
  });

  it('throws for an empty / whitespace-only string', () => {
    expect(() => str('', 'name')).toThrow('name is required');
    expect(() => str('   ', 'name')).toThrow('name is required');
  });
});

describe('optionalStr', () => {
  it('trims a provided string', () => {
    expect(optionalStr('  hi ')).toBe('hi');
  });

  it('returns the default fallback when absent', () => {
    expect(optionalStr(undefined)).toBe('');
    expect(optionalStr(null)).toBe('');
    expect(optionalStr(123)).toBe('');
  });

  it('honours a custom fallback', () => {
    expect(optionalStr(undefined, 'n/a')).toBe('n/a');
  });
});

describe('intInRange', () => {
  it('accepts an in-range integer', () => {
    expect(intInRange(3, 'rating', 1, 5)).toBe(3);
  });

  it('coerces a numeric string', () => {
    expect(intInRange('4', 'rating', 1, 5)).toBe(4);
  });

  it('accepts the boundaries', () => {
    expect(intInRange(1, 'rating', 1, 5)).toBe(1);
    expect(intInRange(5, 'rating', 1, 5)).toBe(5);
  });

  it('rejects out-of-range values', () => {
    expect(() => intInRange(0, 'rating', 1, 5)).toThrow(
      'rating must be an integer between 1 and 5',
    );
    expect(() => intInRange(6, 'rating', 1, 5)).toThrow(AppError);
  });

  it('rejects non-integers and non-numbers', () => {
    expect(() => intInRange(2.5, 'rating', 1, 5)).toThrow(AppError);
    expect(() => intInRange('abc', 'rating', 1, 5)).toThrow(AppError);
  });
});

describe('oneOf', () => {
  const roles = ['admin', 'member'] as const;

  it('returns an allowed value', () => {
    expect(oneOf('admin', 'role', roles)).toBe('admin');
  });

  it('rejects a disallowed value', () => {
    expect(() => oneOf('owner', 'role', roles)).toThrow(
      'role must be one of: admin, member',
    );
  });

  it('rejects a non-string', () => {
    expect(() => oneOf(1, 'role', roles)).toThrow(AppError);
  });
});

describe('isoDate', () => {
  it('normalises a date string to ISO', () => {
    expect(isoDate('2026-07-05T12:00:00.000Z', 'date')).toBe('2026-07-05T12:00:00.000Z');
  });

  it('accepts a numeric timestamp', () => {
    expect(isoDate(0, 'date')).toBe('1970-01-01T00:00:00.000Z');
  });

  it('rejects a non-string / non-number', () => {
    expect(() => isoDate({}, 'date')).toThrow('date is required');
  });

  it('rejects an unparseable date', () => {
    expect(() => isoDate('not-a-date', 'date')).toThrow('date must be a valid date');
  });
});
