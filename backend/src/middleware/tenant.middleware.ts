import type { NextFunction, Request, Response } from 'express';

/**
 * Tenant-scoping middleware.
 *
 * Community Bridge is multi-tenant: every record is scoped to an org. This
 * middleware resolves the active org for the request so every downstream query
 * can be filtered by org_id and tenants stay isolated.
 *
 * STUB: no real resolution yet. Later this will derive orgId from req.user, an
 * X-Org-Id header, or the host subdomain, then enforce that all data access is
 * filtered by it.
 */
export function resolveTenant(_req: Request, _res: Response, next: NextFunction): void {
  // TODO: resolve and attach the active org, then enforce org-scoped access.
  next();
}
