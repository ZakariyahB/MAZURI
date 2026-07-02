import { useEffect, useState } from 'react';
import './communities.css';
import type { ApiClient } from '../api/client';
import type { CommunityWithRole, LeaderboardEntry } from '../api/types';
import { initials, timeAgo } from '../utils/time';

type CommunitiesPageProps = {
  api: ApiClient;
  onOpenCommunity: (community: CommunityWithRole) => void;
};

type Panel = null | 'create' | 'join' | 'leaderboard';

/**
 * "My communities" — live list from the API, plus create / join flows and the
 * cross-community leaderboard.
 */
export function CommunitiesPage({ api, onOpenCommunity }: CommunitiesPageProps): JSX.Element {
  const [communities, setCommunities] = useState<CommunityWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [panel, setPanel] = useState<Panel>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinPassword, setJoinPassword] = useState('');

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);

  const refresh = (): void => {
    setLoading(true);
    api
      .listMyCommunities()
      .then((list) => {
        setCommunities(list);
        setError(null);
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, [api]);

  const openPanel = (next: Panel): void => {
    setFormError(null);
    setName('');
    setJoinCode('');
    setJoinPassword('');
    setPanel(panel === next ? null : next);
    if (next === 'leaderboard' && panel !== 'leaderboard') {
      api.leaderboard().then(setLeaderboard).catch((err) => setFormError((err as Error).message));
    }
  };

  const submitCreate = async (): Promise<void> => {
    setFormError(null);
    setSubmitting(true);
    try {
      const { community, role } = await api.createCommunity({
        name,
        join_code: joinCode,
        join_password: joinPassword,
      });
      setPanel(null);
      setCommunities((prev) => [{ ...community, role, joined_at: community.created_at }, ...prev]);
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitJoin = async (): Promise<void> => {
    setFormError(null);
    setSubmitting(true);
    try {
      const { community, role } = await api.joinCommunity(joinCode, joinPassword);
      setPanel(null);
      setCommunities((prev) => [
        { ...community, role, joined_at: new Date().toISOString() },
        ...prev,
      ]);
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="cb-page" aria-labelledby="communities-title">
      <header className="cb-view-header cb-view-header--stacked">
        <div>
          <p className="cb-eyebrow">My communities</p>
          <h2 id="communities-title">Pick up where your community left off.</h2>
          <p className="cb-muted cb-communities-count">
            {loading ? 'Loading…' : `${communities.length} communit${communities.length === 1 ? 'y' : 'ies'}`}
          </p>
        </div>

        <div className="cb-action-row">
          <button type="button" className="cb-button cb-button--primary" onClick={() => openPanel('create')}>
            Create community
          </button>
          <button type="button" className="cb-button cb-button--secondary" onClick={() => openPanel('join')}>
            Join with a code
          </button>
          <button type="button" className="cb-button cb-button--ghost" onClick={() => openPanel('leaderboard')}>
            Leaderboard
          </button>
        </div>
      </header>

      {error ? (
        <div className="cb-note" role="alert">
          {error} — <button type="button" className="cb-link-button" onClick={refresh}>retry</button>
        </div>
      ) : null}

      {panel === 'create' || panel === 'join' ? (
        <form
          className="cb-composer"
          onSubmit={(e) => {
            e.preventDefault();
            void (panel === 'create' ? submitCreate() : submitJoin());
          }}
        >
          <h3 className="cb-comm-subhead">{panel === 'create' ? 'Create a community' : 'Join a community'}</h3>
          <div className="cb-note">
            {panel === 'create'
              ? 'You become the admin. Share the join code + password with your members.'
              : 'Ask your community admin for the join code and password.'}
          </div>
          {panel === 'create' ? (
            <label className="cb-field">
              <span>Community name</span>
              <input
                className="cb-field-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="East London Mosque"
                required
              />
            </label>
          ) : null}
          <label className="cb-field">
            <span>Join code</span>
            <input
              className="cb-field-input"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="ELM2026"
              required
            />
          </label>
          <label className="cb-field">
            <span>Join password</span>
            <input
              className="cb-field-input"
              type="password"
              value={joinPassword}
              onChange={(e) => setJoinPassword(e.target.value)}
              placeholder="Shared with members"
              required
            />
          </label>
          {formError ? (
            <p className="cb-form-error" role="alert">
              {formError}
            </p>
          ) : null}
          <div className="cb-action-row">
            <button type="submit" className="cb-button cb-button--primary" disabled={submitting}>
              {submitting ? 'Please wait…' : panel === 'create' ? 'Create' : 'Join'}
            </button>
            <button type="button" className="cb-button cb-button--secondary" onClick={() => setPanel(null)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {panel === 'leaderboard' ? (
        <div className="cb-item-list">
          <p className="cb-muted">
            Communities ranked by resolved reports, events held, ratings and activity (last 30 days).
          </p>
          {leaderboard === null ? (
            <p className="cb-muted">Loading leaderboard…</p>
          ) : (
            leaderboard.map((entry, i) => (
              <article key={entry.communityId} className="cb-feed-item">
                <div className="cb-feed-topline">
                  <strong>
                    #{i + 1} {entry.name}
                  </strong>
                  <span className="cb-pill cb-pill--gold">{Math.round(entry.score * 100)} pts</span>
                </div>
                <p className="cb-muted">
                  {entry.metrics.incidentsResolved}/{entry.metrics.incidentsReported} reports resolved ·{' '}
                  {entry.metrics.eventsHeld} events · avg rating {entry.metrics.avgRating.toFixed(1)} ·{' '}
                  {entry.metrics.suggestions} suggestions
                </p>
              </article>
            ))
          )}
        </div>
      ) : null}

      {!loading && communities.length === 0 && !error ? (
        <div className="cb-empty">
          <i className="ti ti-seedling" aria-hidden="true" />
          You&rsquo;re not in any communities yet — create one or join with a code.
        </div>
      ) : null}

      <div className="cb-communities-grid">
        {communities.map((community) => (
          <button
            key={community.id}
            type="button"
            className="cb-comm-card"
            onClick={() => onOpenCommunity(community)}
          >
            <div className="cb-comm-card-head">
              <span className="cb-comm-monogram" aria-hidden="true">
                {initials(community.name)}
              </span>
              <span className={`cb-role-pill cb-role-pill--${community.role}`}>
                {community.role === 'admin' ? 'Admin' : 'Member'}
              </span>
            </div>

            <div className="cb-comm-card-body">
              <span className="cb-comm-type">
                {community.tier === 'insights' ? 'Insights tier' : 'Free tier'}
              </span>
              <h3 className="cb-comm-name">{community.name}</h3>
              <p className="cb-comm-loc">
                <i className="ti ti-key" aria-hidden="true" />
                Join code: {community.join_code}
              </p>
            </div>

            <div className="cb-comm-card-foot">
              <span className="cb-comm-members">
                <i className="ti ti-clock" aria-hidden="true" />
                Joined {timeAgo(community.joined_at)}
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
