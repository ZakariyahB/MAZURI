import './communities.css';

type CommunitiesPageProps = {
  onOpenCommunity: (name: string) => void;
};

type Community = {
  name: string;
  initials: string;
  role: 'Admin' | 'Member';
  type: string;
  location: string;
  members: number;
};

const myCommunities: Community[] = [
  { name: 'East London Mosque', initials: 'EL', role: 'Admin', type: 'Mosque', location: 'Whitechapel, London E1', members: 412 },
  { name: 'South Kensington Youth Football', initials: 'SK', role: 'Member', type: 'Sports club', location: 'Kensington, London SW7', members: 86 },
  { name: 'East Ham Community Centre', initials: 'EH', role: 'Member', type: 'Community centre', location: 'East Ham, London E6', members: 240 },
];

export function CommunitiesPage({ onOpenCommunity }: CommunitiesPageProps): JSX.Element {
  return (
    <section className="cb-page" aria-labelledby="communities-title">
      <header className="cb-view-header cb-view-header--stacked">
        <div>
          <p className="cb-eyebrow">My communities</p>
          <h2 id="communities-title">Pick up where your community left off.</h2>
          <p className="cb-muted cb-communities-count">{myCommunities.length} communities</p>
        </div>
      </header>

      <div className="cb-communities-grid">
        {myCommunities.map((community) => (
          <button
            key={community.name}
            type="button"
            className="cb-comm-card"
            onClick={() => onOpenCommunity(community.name)}
          >
            <div className="cb-comm-card-head">
              <span className="cb-comm-monogram" aria-hidden="true">
                {community.initials}
              </span>
              <span className={`cb-role-pill cb-role-pill--${community.role.toLowerCase()}`}>
                {community.role}
              </span>
            </div>

            <div className="cb-comm-card-body">
              <span className="cb-comm-type">{community.type}</span>
              <h3 className="cb-comm-name">{community.name}</h3>
              <p className="cb-comm-loc">
                <i className="ti ti-map-pin" aria-hidden="true" />
                {community.location}
              </p>
            </div>

            <div className="cb-comm-card-foot">
              <span className="cb-comm-members">
                <i className="ti ti-users" aria-hidden="true" />
                {community.members} members
              </span>
              <span className="cb-comm-open">
                Open
                <i className="ti ti-arrow-right" aria-hidden="true" />
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
