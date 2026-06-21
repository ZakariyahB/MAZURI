import { Card } from '../components/Card';

type AuthMode = 'login' | 'signup';

type AuthPageProps = {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onAuthenticated: () => void;
  onBack: () => void;
};

/**
 * Auth entry (prototype). Both Log in and Sign up are fake — submitting either
 * drops the visitor into their "My communities" list.
 */
export function AuthPage({ mode, onModeChange, onAuthenticated, onBack }: AuthPageProps): JSX.Element {
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
              onClick={() => onModeChange('login')}
            >
              Log in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              className={mode === 'signup' ? 'cb-tab cb-tab--active' : 'cb-tab'}
              onClick={() => onModeChange('signup')}
            >
              Sign up
            </button>
          </div>

          <form
            className="cb-form-grid"
            onSubmit={(event) => {
              event.preventDefault();
              onAuthenticated();
            }}
          >
            {mode === 'signup' ? (
              <label className="cb-field">
                <span>Full name</span>
                <input className="cb-field-input" type="text" placeholder="Your name" />
              </label>
            ) : null}

            <label className="cb-field">
              <span>Email address</span>
              <input className="cb-field-input" type="email" placeholder="you@example.com" />
            </label>

            <label className="cb-field">
              <span>Password</span>
              <input className="cb-field-input" type="password" placeholder="Your password" />
            </label>

            <div className="cb-action-row">
              <button type="submit" className="cb-button cb-button--primary">
                {mode === 'login' ? 'Log in' : 'Create account'}
              </button>
            </div>
          </form>
        </div>
      </Card>
    </section>
  );
}
