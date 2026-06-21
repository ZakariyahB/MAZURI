import './landing.css';

type LandingPageProps = {
  onAuth: (mode: 'login' | 'signup') => void;
};

const stats = [
  { num: '24', label: 'communities on nafr.' },
  { num: '1,840', label: 'members across the UK' },
  { num: '73%', label: 'avg. issues addressed in 30 days' },
];

// Placeholder step cards — copy to be filled in. Kept as styled stubs so the
// "How Nafr. works" section reads as a finished three-step layout.
const steps = [
  { n: '01', title: 'Listen', body: 'Members raise suggestions and private reports in one structured place.' },
  { n: '02', title: 'Act', body: 'Admins triage by priority and severity, then resolve what matters most.' },
  { n: '03', title: 'Show', body: 'Visible announcements close the loop so action is always traceable.' },
];

export function LandingPage({ onAuth }: LandingPageProps): JSX.Element {
  return (
    <div className="cb-landing">
      {/* Hero — dark, full-bleed, with its own transparent header. */}
      <section className="cb-hero" aria-labelledby="landing-title">
        <header className="cb-landing-header">
          <span className="cb-landing-brand">nafr.</span>
        </header>

        <div className="cb-hero-inner">
          <span className="cb-hero-badge">
            <i className="ti ti-users" aria-hidden="true" />
            Community feedback, reimagined
          </span>

          <h1 id="landing-title" className="cb-hero-title">
            <span className="cb-hero-line-1">Every voice heard.</span>
            <span className="cb-hero-line-2">Every action visible.</span>
          </h1>

          <p className="cb-hero-sub">
            nafr. gives mosques, schools, and community centres a structured way to listen to their
            members — and a clear way to show they&rsquo;ve acted.
          </p>

          <div className="cb-hero-cta">
            <button type="button" className="cb-pill-btn cb-pill-btn--lg" onClick={() => onAuth('signup')}>
              <i className="ti ti-user-plus" aria-hidden="true" />
              Sign up
            </button>
            <button type="button" className="cb-signin-link" onClick={() => onAuth('login')}>
              Log in
            </button>
          </div>

          <dl className="cb-hero-stats">
            {stats.map((stat) => (
              <div className="cb-hero-stat" key={stat.label}>
                <dt className="cb-hero-stat-num">{stat.num}</dt>
                <dd className="cb-hero-stat-label">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Intro — cream, "How Nafr. works". */}
      <section className="cb-howitworks" aria-labelledby="how-title">
        <h2 id="how-title" className="cb-how-title">
          How nafr. works
        </h2>
        <p className="cb-how-sub">Three steps from problem to resolution</p>

        <div className="cb-how-grid">
          {steps.map((step) => (
            <article className="cb-how-card" key={step.n}>
              <span className="cb-how-num">{step.n}</span>
              <h3 className="cb-how-card-title">{step.title}</h3>
              <p className="cb-how-card-body">{step.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
