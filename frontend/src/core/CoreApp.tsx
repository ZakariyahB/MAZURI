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
  const api = createApiClient(config.apiBaseUrl);
  if (config.authToken) {
    api.setToken(config.authToken);
  }
  void api;

  return (
    <div className="cb-root">
      <nav className="cb-nav" aria-label="Primary">
        <div className="cb-brand-block">
          <span className="cb-brand">Community Bridge</span>
          <span className="cb-brand-subtitle">Member and admin workspace</span>
        </div>

        <div className="cb-nav-actions" role="tablist" aria-label="Workspace view">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'member'}
            className={view === 'member' ? 'cb-tab cb-tab--active' : 'cb-tab'}
            onClick={() => setView('member')}
          >
            Member
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'admin'}
            className={view === 'admin' ? 'cb-tab cb-tab--active' : 'cb-tab'}
            onClick={() => setView('admin')}
          >
            Admin
          </button>
        </div>
      </nav>

      <main className="cb-content">
        <section className="cb-hero">
          <div>
            <p className="cb-eyebrow">Live preview</p>
            <h1>Designed for community feedback, moderation, and follow-through.</h1>
            <p className="cb-hero-copy">
              The same core surface can run as a standalone site or inside an embed.
              The current API base is {config.apiBaseUrl}.
            </p>
          </div>

          <div className="cb-hero-panel">
            <span className="cb-status">Connected</span>
            <strong>{view === 'member' ? 'Member workspace' : 'Admin workspace'}</strong>
            <p>
              {view === 'member'
                ? 'Suggestions, incident reporting, and event voting are arranged for fast member input.'
                : 'Queue triage, moderation, and announcements are organised for quick action.'}
            </p>
          </div>
        </section>

        {view === 'member' ? <MemberView /> : <AdminDashboard />}
      </main>
    </div>
  );
}
