import { useEffect, useState } from 'react';
import './core.css';
import { createApiClient } from '../api/client';
import { AuthPage } from '../pages/AuthPage';
import { CommunitiesPage } from '../pages/CommunitiesPage';
import { LandingPage } from '../pages/LandingPage';
import { CommunityPage } from '../pages/CommunityPage';

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

type View = 'landing' | 'auth' | 'communities' | 'community';
type AuthMode = 'login' | 'signup';

/**
 * CoreApp — the self-contained heart of the product.
 *
 * It renders entirely inside a single scoped container (.cb-root) and styles
 * ONLY its own subtree (see core.css), so it behaves identically as a standalone
 * page or embedded in a host site it does not control.
 *
 * The current flow is a click-through prototype: landing → log in / sign up →
 * "my communities" → a single community workspace with a Member / Admin toggle.
 */
export function CoreApp({ config }: { config: CoreAppConfig }): JSX.Element {
  const [view, setView] = useState<View>('landing');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [community, setCommunity] = useState<string | null>(null);

  // API client built from injected config (token-based, configurable URL).
  // Wired but unused until live data lands.
  const api = createApiClient(config.apiBaseUrl);
  if (config.authToken) {
    api.setToken(config.authToken);
  }
  void api;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view, community]);

  const isLanding = view === 'landing';

  const openAuth = (mode: AuthMode): void => {
    setAuthMode(mode);
    setView('auth');
  };

  const openCommunity = (name: string): void => {
    setCommunity(name);
    setView('community');
  };

  const chrome = !isLanding ? (
    <nav className="cb-nav" aria-label="Primary">
      <div className="cb-brand-block">
        <button type="button" className="cb-brand" onClick={() => setView('landing')}>
          nafr.
        </button>
        <span className="cb-brand-subtitle">Community feedback platform</span>
      </div>

      {view !== 'auth' ? (
        <div className="cb-nav-actions">
          <button
            type="button"
            className={view === 'communities' ? 'cb-tab cb-tab--active' : 'cb-tab'}
            onClick={() => setView('communities')}
          >
            My communities
          </button>
          <button type="button" className="cb-tab" onClick={() => setView('landing')}>
            Sign out
          </button>
        </div>
      ) : null}
    </nav>
  ) : null;

  const main = (
    <main className={isLanding ? 'cb-content cb-content--flush' : 'cb-content'}>
      {view === 'landing' ? <LandingPage onAuth={openAuth} /> : null}

      {view === 'auth' ? (
        <AuthPage
          mode={authMode}
          onModeChange={setAuthMode}
          onAuthenticated={() => setView('communities')}
          onBack={() => setView('landing')}
        />
      ) : null}

      {view === 'communities' ? <CommunitiesPage onOpenCommunity={openCommunity} /> : null}

      {view === 'community' && community ? (
        <CommunityPage key={community} communityName={community} onBack={() => setView('communities')} />
      ) : null}
    </main>
  );

  // The premium landing is full-bleed; every in-app view sits in a centered,
  // max-width shell so content doesn't sprawl on wide screens.
  return (
    <div className={isLanding ? 'cb-root cb-root--flush' : 'cb-root'}>
      {isLanding ? (
        main
      ) : (
        <div className="cb-shell">
          {chrome}
          {main}
        </div>
      )}
    </div>
  );
}
