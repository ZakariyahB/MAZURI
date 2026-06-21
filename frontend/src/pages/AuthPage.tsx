import { useState } from 'react';
import { Card } from '../components/Card';

type AppView = 'landing' | 'communities' | 'auth' | 'member' | 'admin';

type AuthPageProps = {
  onNavigate: (view: AppView) => void;
};

type Mode = 'member' | 'admin';

export function AuthPage({ onNavigate }: AuthPageProps): JSX.Element {
  const [mode, setMode] = useState<Mode>('member');

  return (
    <section className="cb-page cb-auth-page" aria-labelledby="auth-title">
      <header className="cb-view-header cb-view-header--stacked">
        <div>
          <p className="cb-eyebrow">Join Nafr.</p>
          <h2 id="auth-title">Create a member account or request admin access.</h2>
        </div>

        <div className="cb-action-row">
          <button type="button" className="cb-button cb-button--secondary" onClick={() => onNavigate('landing')}>
            Back
          </button>
        </div>
      </header>

      <Card>
        <div className="cb-auth-shell">
          <div className="cb-auth-tabs" role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'member'}
              className={mode === 'member' ? 'cb-tab cb-tab--active' : 'cb-tab'}
              onClick={() => setMode('member')}
            >
              Member sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'admin'}
              className={mode === 'admin' ? 'cb-tab cb-tab--active' : 'cb-tab'}
              onClick={() => setMode('admin')}
            >
              Admin request
            </button>
          </div>

          {mode === 'member' ? (
            <div className="cb-form-grid">
              <div className="cb-note">Anyone can join a community as a member and start giving feedback immediately.</div>
              <label className="cb-field">
                <span>Full name</span>
                <div className="cb-field-input">Your name</div>
              </label>
              <label className="cb-field">
                <span>Email address</span>
                <div className="cb-field-input">you@example.com</div>
              </label>
              <label className="cb-field">
                <span>Password</span>
                <div className="cb-field-input">Your password</div>
              </label>

              <div className="cb-action-row">
                <button type="button" className="cb-button cb-button--primary" onClick={() => onNavigate('member')}>
                  Join as member
                </button>
              </div>
            </div>
          ) : (
            <div className="cb-form-grid">
              <div className="cb-note">Admin access is approved by the organisation's lead admin.</div>
              <label className="cb-field">
                <span>Full name</span>
                <div className="cb-field-input">Your name</div>
              </label>
              <label className="cb-field">
                <span>Community</span>
                <div className="cb-field-input">Select your community</div>
              </label>
              <label className="cb-field">
                <span>Role in the organisation</span>
                <div className="cb-field-input">Committee secretary, trustee...</div>
              </label>

              <div className="cb-action-row">
                <button type="button" className="cb-button cb-button--primary" onClick={() => onNavigate('admin')}>
                  Request admin access
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </section>
  );
}