import { useMemo, useState } from 'react';
import { Card } from '../components/Card';

type AppView = 'landing' | 'communities' | 'auth' | 'member' | 'admin';

type CommunitiesPageProps = {
  onNavigate: (view: AppView) => void;
};

const communities = [
  'Al-Noor Islamic Centre',
  'Croydon Muslim Association',
  'Green Lane Academy',
  'East London Mosque',
  'Imperial ISoc',
  'Leicester Community Centre',
];

export function CommunitiesPage({ onNavigate }: CommunitiesPageProps): JSX.Element {
  const [query, setQuery] = useState('');

  const filteredCommunities = useMemo(
    () => communities.filter((name) => name.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  return (
    <section className="cb-page" aria-labelledby="communities-title">
      <header className="cb-view-header cb-view-header--stacked">
        <div>
          <p className="cb-eyebrow">Communities on Nafr.</p>
          <h2 id="communities-title">Find your mosque, school, or community centre.</h2>
        </div>

        <div className="cb-action-row">
          <button type="button" className="cb-button cb-button--secondary" onClick={() => onNavigate('landing')}>
            Back
          </button>
        </div>
      </header>

      <div className="cb-search-row">
        <input
          className="cb-search-input"
          type="text"
          placeholder="Search by name or location..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button type="button" className="cb-button cb-button--primary" onClick={() => onNavigate('auth')}>
          Create account
        </button>
      </div>

      <div className="cb-community-grid">
        {filteredCommunities.map((community) => (
          <Card key={community}>
            <div className="cb-community-card">
              <div className="cb-community-banner">
                <div className="cb-community-badge">Community</div>
              </div>
              <div className="cb-card-stack">
                <div>
                  <span className="cb-card-kicker">Local organisation</span>
                  <h3>{community}</h3>
                  <p className="cb-muted">Structured feedback, announcements, and event voting in one place.</p>
                </div>
                <div className="cb-action-row">
                  <button type="button" className="cb-button cb-button--primary" onClick={() => onNavigate('member')}>
                    Join as member
                  </button>
                  <button type="button" className="cb-button cb-button--secondary" onClick={() => onNavigate('auth')}>
                    Request admin access
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}