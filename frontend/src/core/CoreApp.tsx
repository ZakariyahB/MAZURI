import { useEffect, useState } from 'react';
import './core.css';
import { createApiClient } from '../api/client';
import { AuthPage } from '../pages/AuthPage';
import { CommunitiesPage } from '../pages/CommunitiesPage';
import { LandingPage } from '../pages/LandingPage';
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

type View = 'landing' | 'communities' | 'auth' | 'member' | 'admin';

/**
 * CoreApp — the self-contained heart of the product.
 *
 * It renders entirely inside a single scoped container (.cb-root) and styles
 * ONLY its own subtree (see core.css — no html/body/global selectors), so it
 * behaves identically as a standalone page or embedded in a host site it does
 * not control.
 */
export function CoreApp({ config }: { config: CoreAppConfig }): JSX.Element {
  const [view, setView] = useState<View>(config.authToken ? 'member' : 'landing');

  // API client built from injected config (token-based, configurable URL).
  // Wired but unused until feature work lands.
  const api = createApiClient(config.apiBaseUrl);
  if (config.authToken) {
    api.setToken(config.authToken);
  }
  void api;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view]);

  const navigate = (nextView: View): void => {
    setView(nextView);
  };

  const isLanding = view === 'landing';

  return (
    <div className={isLanding ? 'cb-root cb-root--flush' : 'cb-root'}>
      {/* The premium landing owns its own transparent header (see LandingPage),
          so the app's tab-nav is shown only once the visitor is inside the app. */}
      {!isLanding ? (
        <nav className="cb-nav" aria-label="Primary">
          <div className="cb-brand-block">
            <button type="button" className="cb-brand" onClick={() => navigate('landing')}>
              Nafr.
            </button>
            <span className="cb-brand-subtitle">Community feedback platform</span>
          </div>

          <div className="cb-nav-actions" role="tablist" aria-label="Primary sections">
            <button
              type="button"
              role="tab"
              aria-selected={view === 'communities'}
              className={view === 'communities' ? 'cb-tab cb-tab--active' : 'cb-tab'}
              onClick={() => navigate('communities')}
            >
              Communities
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'auth'}
              className={view === 'auth' ? 'cb-tab cb-tab--active' : 'cb-tab'}
              onClick={() => navigate('auth')}
            >
              Join
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'member'}
              className={view === 'member' ? 'cb-tab cb-tab--active' : 'cb-tab'}
              onClick={() => navigate('member')}
            >
              Member
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'admin'}
              className={view === 'admin' ? 'cb-tab cb-tab--active' : 'cb-tab'}
              onClick={() => navigate('admin')}
            >
              Admin
            </button>
          </div>
        </nav>
      ) : null}

      <main className={isLanding ? 'cb-content cb-content--flush' : 'cb-content'}>
        {view === 'landing' ? (
          <LandingPage
            apiBaseUrl={config.apiBaseUrl}
            onNavigate={navigate}
          />
        ) : null}

        {view === 'communities' ? <CommunitiesPage onNavigate={navigate} /> : null}

        {view === 'auth' ? <AuthPage onNavigate={navigate} /> : null}

        {view === 'member' ? <MemberView onNavigate={navigate} /> : null}

        {view === 'admin' ? <AdminDashboard onNavigate={navigate} /> : null}
      </main>
    </div>
  );
}
