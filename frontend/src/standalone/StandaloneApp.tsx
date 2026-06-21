import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CoreApp, type CoreAppConfig } from '../core';

/**
 * Standalone entry — the "our own website" path of the open A/B decision.
 *
 * It mounts the self-contained core app as a full hosted page. The embed path
 * (src/embed) will reuse CoreApp in exactly the same way, just inside a widget
 * shell, so this file stays standalone-specific.
 */
export function mountStandalone(container: HTMLElement): void {
  const config: CoreAppConfig = {
    // In standalone mode the API base URL comes from the build-time env.
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000',
  };

  createRoot(container).render(
    <StrictMode>
      <CoreApp config={config} />
    </StrictMode>,
  );
}
