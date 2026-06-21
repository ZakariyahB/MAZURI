import type { NextFunction, Request, Response } from 'express';

/**
 * 404 handler for unmatched routes. Register after all routes.
 */
export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Not Found' });
}

/**
 * Central error handler. Must keep all four arguments so Express recognises it
 * as error-handling middleware, and must be registered LAST.
 *
 * STUB: real structured logging + status-code mapping comes later.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const message = err instanceof Error ? err.message : 'Internal Server Error';
  res.status(500).json({ error: message });
}
