import { useEffect, useMemo, useState } from 'react';
import './core.css';
import { createApiClient } from '../api/client';
import type { AuthResult, CommunityWithRole, User } from '../api/types';
import { AuthPage } from '../pages/AuthPage';
import { CommunitiesPage } from '../pages/CommunitiesPage';
import { LandingPage } from '../pages/LandingPage';
import { CommunityPage } from '../pages/CommunityPage';

/**
 * Config injected by whichever shell mounts the core app (the standalone page
 * today, the embeddable widget). The core makes NO assumptions about where
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

// localStorage key for the session JWT (persists across reloads).
const TOKEN_KEY = 'cb.token';

/**
 * CoreApp — the self-contained heart of the product.
 *
 * It renders entirely inside a single scoped container (.cb-root) and styles
 * ONLY its own subtree (see core.css), so it behaves identically as a standalone
 * page or embedded in a host site it does not control.
 *
 * Flow: landing → log in / sign up (JWT stored, session restored on reload) →
 * "my communities" (live) → a community workspace driven by the real API.
 */
export function CoreApp({ config }: { config: CoreAppConfig }): JSX.Element {
  const [view, setView] = useState<View>('landing');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [user, setUser] = useState<User | null>(null);
  const [community, setCommunity] = useState<CommunityWithRole | null>(null);
  const [restoring, setRestoring] = useState(true);

  // API client built from injected config (token-based, configurable URL).
  const api = useMemo(() => createApiClient(config.apiBaseUrl), [config.apiBaseUrl]);

  // Restore the session on load: host-injected token first, then localStorage.
  useEffect(() => {
    const token = config.authToken ?? localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setRestoring(false);
      return;
    }
    api.setToken(token);
    api
      .me()
      .then((me) => {
        setUser(me);
        setView('communities');
      })
      .catch(() => {
        // Expired/invalid token — drop it and start signed out.
        api.setToken(null);
        localStorage.removeItem(TOKEN_KEY);
      })
      .finally(() => setRestoring(false));
  }, [api, config.authToken]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view, community]);

  const isLanding = view === 'landing';

  const openAuth = (mode: AuthMode): void => {
    setAuthMode(mode);
    setView('auth');
  };

  const handleAuthenticated = (result: AuthResult): void => {
    api.setToken(result.token);
    localStorage.setItem(TOKEN_KEY, result.token);
    setUser(result.user);
    setView('communities');
  };

  const signOut = (): void => {
    api.setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setCommunity(null);
    setView('landing');
  };

  const openCommunity = (next: CommunityWithRole): void => {
    setCommunity(next);
    setView('community');
  };

  const chrome = !isLanding ? (
    <nav className="cb-nav" aria-label="Primary">
      <div className="cb-brand-block">
        <button type="button" className="cb-brand" onClick={() => setView(user ? 'communities' : 'landing')}>
          nafr.
        </button>
        <span className="cb-brand-subtitle">Community feedback platform</span>
      </div>

      {view !== 'auth' && user ? (
        <div className="cb-nav-actions">
          <button
            type="button"
            className={view === 'communities' ? 'cb-tab cb-tab--active' : 'cb-tab'}
            onClick={() => setView('communities')}
          >
            My communities
          </button>
          <button type="button" className="cb-tab" onClick={signOut}>
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
          api={api}
          mode={authMode}
          onModeChange={setAuthMode}
          onAuthenticated={handleAuthenticated}
          onBack={() => setView('landing')}
        />
      ) : null}

      {view === 'communities' ? <CommunitiesPage api={api} onOpenCommunity={openCommunity} /> : null}

      {view === 'community' && community ? (
        <CommunityPage
          key={community.id}
          api={api}
          community={community}
          onBack={() => setView('communities')}
        />
      ) : null}
    </main>
  );

  if (restoring) {
    return <div className="cb-root" />;
  }

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
