import { Card } from '../components/Card';

type AppView = 'landing' | 'communities' | 'auth' | 'member' | 'admin';

type LandingPageProps = {
  apiBaseUrl: string;
  onNavigate: (view: AppView) => void;
};

const highlights = [
  { title: 'Suggestions up', body: 'Public ideas get upvoted so the strongest priorities rise first.' },
  { title: 'Reports private', body: 'Sensitive issues stay admin-only and are triaged by severity.' },
  { title: 'Announcements down', body: 'Admins close the loop with visible updates when work is done.' },
];

export function LandingPage({ apiBaseUrl, onNavigate }: LandingPageProps): JSX.Element {
  return (
    <section className="cb-landing" aria-labelledby="landing-title">
      <section className="cb-hero">
        <div>
          <p className="cb-eyebrow">Community feedback platform</p>
          <h1 id="landing-title">Give communities a structured way to be heard.</h1>
          <p className="cb-hero-copy">
            Nafr. keeps suggestions public, reports private, and announcements visible so action is traceable.
            Standalone mode runs at {apiBaseUrl}.
          </p>

          <div className="cb-action-row cb-action-row--hero">
            <button type="button" className="cb-button cb-button--primary" onClick={() => onNavigate('communities')}>
              Explore communities
            </button>
            <button type="button" className="cb-button cb-button--secondary" onClick={() => onNavigate('auth')}>
              Join the platform
            </button>
          </div>
        </div>

        <div className="cb-hero-panel">
          <span className="cb-status">Standalone site</span>
          <strong>Built for embed first, but ready as a hosted website.</strong>
          <p>
            The same core design can live inside a community website or operate as the public product.
          </p>
          <button type="button" className="cb-link-button cb-link-button--block" onClick={() => onNavigate('member')}>
            See the member experience
          </button>
        </div>
      </section>

      <div className="cb-grid cb-grid--three cb-grid--feature">
        {highlights.map((item) => (
          <Card key={item.title}>
            <div className="cb-card-stack">
              <span className="cb-card-kicker">Core flow</span>
              <h3>{item.title}</h3>
              <p className="cb-muted">{item.body}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="cb-grid cb-grid--two">
        <Card>
          <div className="cb-card-stack">
            <span className="cb-card-kicker">What it solves</span>
            <h3>One clean loop from feedback to action</h3>
            <p className="cb-muted">
              Suggestions and reports arrive separately, admins triage in one place, and the public sees what changed.
            </p>
            <div className="cb-action-row">
              <button type="button" className="cb-button cb-button--ghost" onClick={() => onNavigate('communities')}>
                View communities
              </button>
              <button type="button" className="cb-button cb-button--ghost" onClick={() => onNavigate('admin')}>
                Open admin queue
              </button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="cb-card-stack">
            <span className="cb-card-kicker">Why now</span>
            <h3>Cheap AI makes community triage practical</h3>
            <p className="cb-muted">
              The user picks the category; the model groups similar reports and surfaces the patterns.
            </p>
            <div className="cb-action-row">
              <button type="button" className="cb-button cb-button--primary" onClick={() => onNavigate('auth')}>
                Start a pilot
              </button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}