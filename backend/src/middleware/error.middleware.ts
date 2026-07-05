import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors';
import { isUniqueViolation } from '../config/db';

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
  if (isUniqueViolation(err)) {
    res.status(409).json({ error: 'Resource already exists' });
    return;
  }

  // Multer upload errors (e.g. file too large) → 400 rather than a server error.
  if (err instanceof Error && err.name === 'MulterError') {
    const message =
      (err as { code?: string }).code === 'LIMIT_FILE_SIZE'
        ? 'Image is too large — 5 MB maximum'
        : `Upload error: ${err.message}`;
    res.status(400).json({ error: message });
    return;
  }

  console.error(err);
  const message = err instanceof Error ? err.message : 'Internal Server Error';
  res.status(500).json({ error: message });
}
