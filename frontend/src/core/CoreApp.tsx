import { useState } from 'react';
import './core.css';
import { createApiClient } from '../api/client';
import { MemberView } from '../pages/MemberView';
import { AdminDashboard } from '../pages/AdminDashboard';

/**
 * Config injected by whichever shell mounts the core app (the standalone page
 * today, an embeddable widget later). The core makes NO assumptions about where
 * the API lives or how auth is obtained — both are passed in.
 */
export interface CoreAppConfig {
  /** Base URL of the Community Bridge API (token-based). */
  apiBaseUrl: string;
  /** Optional JWT; an embed shell may inject one from the host site. */
  authToken?: string;
}

type View = 'member' | 'admin';

/**
 * CoreApp — the self-contained heart of the product.
 *
 * It renders entirely inside a single scoped container (.cb-root) and styles
 * ONLY its own subtree (see core.css — no html/body/global selectors), so it
 * behaves identically as a standalone page or embedded in a host site it does
 * not control.
 */
export function CoreApp({ config }: { config: CoreAppConfig }): JSX.Element {
  const [view, setView] = useState<View>('member');

  // API client built from injected config (token-based, configurable URL).
  // Wired but unused until feature work lands.
  const api = createApiClient({ baseUrl: config.apiBaseUrl, token: config.authToken });
  void api;

  return (
    <div className="cb-root">
      <nav className="cb-nav">
        <span className="cb-brand">Community Bridge</span>
        <div className="cb-nav-actions">
          <button
            type="button"
            className={view === 'member' ? 'cb-tab cb-tab--active' : 'cb-tab'}
            onClick={() => setView('member')}
          >
            Member
          </button>
          <button
            type="button"
            className={view === 'admin' ? 'cb-tab cb-tab--active' : 'cb-tab'}
            onClick={() => setView('admin')}
          >
            Admin
          </button>
        </div>
      </nav>

      <main className="cb-content">
        {view === 'member' ? <MemberView /> : <AdminDashboard />}
      </main>
    </div>
  );
}
