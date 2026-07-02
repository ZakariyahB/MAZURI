import { useState } from 'react';
import { Card } from '../components/Card';
import type { ApiClient } from '../api/client';
import type { AuthResult } from '../api/types';

type AuthMode = 'login' | 'signup';

type AuthPageProps = {
  api: ApiClient;
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onAuthenticated: (result: AuthResult) => void;
  onBack: () => void;
};

/**
 * Auth entry — signs up / logs in against /api/auth and hands the JWT + user
 * back to the shell, which stores the token and switches to "My communities".
 */
export function AuthPage({ api, mode, onModeChange, onAuthenticated, onBack }: AuthPageProps): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (next: AuthMode): void => {
    setError(null);
    onModeChange(next);
  };

  const submit = async (): Promise<void> => {
    setError(null);
    setSubmitting(true);
    try {
      const result =
        mode === 'login' ? await api.login(email, password) : await api.signup(email, password);
      onAuthenticated(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="cb-page cb-auth-page" aria-labelledby="auth-title">
      <header className="cb-view-header cb-view-header--stacked">
        <div>
          <p className="cb-eyebrow">Welcome to nafr.</p>
          <h2 id="auth-title">{mode === 'login' ? 'Log in to your communities.' : 'Create your account.'}</h2>
        </div>

        <div className="cb-action-row">
          <button type="button" className="cb-button cb-button--secondary" onClick={onBack}>
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
              aria-selected={mode === 'login'}
              className={mode === 'login' ? 'cb-tab cb-tab--active' : 'cb-tab'}
              onClick={() => switchMode('login')}
            >
              Log in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              className={mode === 'signup' ? 'cb-tab cb-tab--active' : 'cb-tab'}
              onClick={() => switchMode('signup')}
            >
              Sign up
            </button>
          </div>

          <form
            className="cb-form-grid"
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <label className="cb-field">
              <span>Email address</span>
              <input
                className="cb-field-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="cb-field">
              <span>Password</span>
              <input
                className="cb-field-input"
                type="password"
                placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={mode === 'signup' ? 6 : undefined}
              />
            </label>

            {error ? (
              <p className="cb-form-error" role="alert">
                {error}
              </p>
            ) : null}

            <div className="cb-action-row">
              <button type="submit" className="cb-button cb-button--primary" disabled={submitting}>
                {submitting ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
              </button>
            </div>
          </form>
        </div>
      </Card>
    </section>
  );
}
