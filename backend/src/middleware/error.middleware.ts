import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors';

/** 404 handler for unmatched routes. Register after all routes. */
export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Not Found' });
}

/**
 * Central error handler. Must keep all four arguments so Express treats it as
 * error-handling middleware, and must be registered LAST.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Postgres unique-violation → 409.
  if (typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505') {
    res.status(409).json({ error: 'Resource already exists' });
    return;
  }

  console.error(err);
  const message = err instanceof Error ? err.message : 'Internal Server Error';
  res.status(500).json({ error: message });
}
