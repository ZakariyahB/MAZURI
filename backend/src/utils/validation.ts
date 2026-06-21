import { badRequest } from './errors';

/** Required non-empty string (trimmed). */
export function str(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw badRequest(`${field} is required`);
  }
  return value.trim();
}

/** Optional string (trimmed), falling back when absent. */
export function optionalStr(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

/** Integer within [min, max]. */
export function intInRange(value: unknown, field: string, min: number, max: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw badRequest(`${field} must be an integer between ${min} and ${max}`);
  }
  return n;
}

/** One of an allowed set of string literals. */
export function oneOf<T extends string>(value: unknown, field: string, allowed: readonly T[]): T {
  const s = typeof value === 'string' ? value : '';
  if (!allowed.includes(s as T)) {
    throw badRequest(`${field} must be one of: ${allowed.join(', ')}`);
  }
  return s as T;
}

/** A valid date, returned as an ISO string. */
export function isoDate(value: unknown, field: string): string {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw badRequest(`${field} is required`);
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw badRequest(`${field} must be a valid date`);
  }
  return d.toISOString();
}
