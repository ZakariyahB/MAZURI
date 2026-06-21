import type { ReactNode } from 'react';

/**
 * Shared presentational card (stub). Uses only scoped `cb-` classes (see
 * core.css), so it's safe in embedded contexts.
 */
export function Card({ children }: { children: ReactNode }): JSX.Element {
  return <div className="cb-card">{children}</div>;
}
