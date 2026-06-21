type CommunitiesPageProps = {
  onOpenCommunity: (name: string) => void;
};

const myCommunities = [
  { name: 'East London Mosque', role: 'Admin · Member', blurb: 'Whitechapel, London E1' },
  { name: 'South Kensington Youth Football', role: 'Member', blurb: 'Youth sports club, SW7' },
  { name: 'East Ham Community Centre', role: 'Member', blurb: 'Community hub, E6' },
];

export function CommunitiesPage({ onOpenCommunity }: CommunitiesPageProps): JSX.Element {
  return (
    <section className="cb-page" aria-labelledby="communities-title">
      <header className="cb-view-header cb-view-header--stacked">
        <div>
          <p className="cb-eyebrow">My communities</p>
          <h2 id="communities-title">Pick up where your community left off.</h2>
        </div>
      </header>

      <div className="cb-community-grid">
        {myCommunities.map((community) => (
          <button
            key={community.name}
            type="button"
            className="cb-community-card"
            onClick={() => onOpenCommunity(community.name)}
          >
            <div className="cb-community-banner">
              <div className="cb-community-badge">{community.role}</div>
            </div>
            <div className="cb-card-stack">
              <div>
                <span className="cb-card-kicker">{community.blurb}</span>
                <h3>{community.name}</h3>
                <p className="cb-muted">Structured feedback, event voting, and updates in one place.</p>
              </div>
              <span className="cb-link-button">Open community →</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
