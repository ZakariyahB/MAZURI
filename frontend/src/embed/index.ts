/**
 * Embeddable widget wrapper — path (A) of the open A/B decision (see README).
 *
 * Mounts the SAME CoreApp the standalone entry uses inside a host element on a
 * third-party site. The core styles only its own subtree (scoped `cb-` CSS) and
 * auth is JWT-bearer (no cookies), so it works on domains we don't control —
 * the host's origin just needs to be in the API's CORS_ALLOWED_ORIGINS.
 *
 * Built as a self-contained IIFE bundle (npm run build:embed → dist-embed/).
 * Drop-in snippet for a community's existing website:
 *
 *   <link rel="stylesheet" href="https://cdn.example.com/community-bridge.css">
 *   <div data-community-bridge data-api-base-url="https://api.example.com"></div>
 *   <script src="https://cdn.example.com/community-bridge.js"></script>
 *
 * Hosts that bundle their own JS can instead `import { mount } from ...` and
 * call it directly (optionally injecting a JWT from their own session).
 */
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { CoreApp, type CoreAppConfig } from '../core';

export interface EmbedOptions {
  /** Base URL of the Community Bridge API. Defaults to same-origin friendly localhost dev. */
  apiBaseUrl?: string;
  /** Optional JWT injected by the host site (skips the login screen). */
  authToken?: string;
}

/** Mount the widget into a host element. Returns an unmount function. */
export function mount(container: HTMLElement, options: EmbedOptions = {}): () => void {
  const config: CoreAppConfig = {
    apiBaseUrl: options.apiBaseUrl ?? 'http://localhost:4000',
    authToken: options.authToken,
  };
  const root = createRoot(container);
  root.render(createElement(CoreApp, { config }));
  return () => root.unmount();
}

/** Auto-mount every `[data-community-bridge]` element, reading config from data-* attributes. */
function autoMount(): void {
  document.querySelectorAll<HTMLElement>('[data-community-bridge]').forEach((el) => {
    if (el.dataset.cbMounted === 'true') return;
    el.dataset.cbMounted = 'true';
    mount(el, {
      apiBaseUrl: el.dataset.apiBaseUrl,
      authToken: el.dataset.authToken,
    });
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoMount);
  } else {
    autoMount();
  }
}
