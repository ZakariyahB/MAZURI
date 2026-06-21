import { useState } from 'react';
import { Card } from '../components/Card';

type AppView = 'landing' | 'communities' | 'auth' | 'member' | 'admin';

type MemberViewProps = {
  onNavigate: (view: AppView) => void;
};

type MemberPanel = 'feed' | 'report' | 'events';

/**
 * Member view (stub). Lives under core/ so it ships in both standalone and
 * embedded modes. Will host: the suggestion feed + upvotes, the report form,
 * and event voting.
 */
export function MemberView({ onNavigate }: MemberViewProps): JSX.Element {
  const [panel, setPanel] = useState<MemberPanel>('feed');
  const [voted, setVoted] = useState(false);

  return (
    <section className="cb-page" aria-labelledby="member-view-title">
      <header className="cb-view-header">
        <div>
          <p className="cb-eyebrow">Member view</p>
          <h2 id="member-view-title">Raise issues, vote on priorities, and stay informed.</h2>
        </div>

        <div className="cb-action-row">
          <button type="button" className="cb-button cb-button--secondary" onClick={() => onNavigate('landing')}>
            Back to home
          </button>
          <button type="button" className="cb-button cb-button--ghost" onClick={() => onNavigate('auth')}>
            Switch account
          </button>
        </div>
      </header>

      <div className="cb-view-toolbar" role="tablist" aria-label="Member sections">
        <button type="button" className={panel === 'feed' ? 'cb-tab cb-tab--active' : 'cb-tab'} onClick={() => setPanel('feed')}>
          Suggestions
        </button>
        <button type="button" className={panel === 'report' ? 'cb-tab cb-tab--active' : 'cb-tab'} onClick={() => setPanel('report')}>
          Reports
        </button>
        <button type="button" className={panel === 'events' ? 'cb-tab cb-tab--active' : 'cb-tab'} onClick={() => setPanel('events')}>
          Events
        </button>
      </div>

      {panel === 'feed' ? (
        <div className="cb-grid cb-grid--two">
          <Card>
            <div className="cb-card-stack">
              <div>
                <span className="cb-card-kicker">Suggestion feed</span>
                <h3>What members want next</h3>
              </div>

              <article className="cb-feed-item">
                <div className="cb-feed-topline">
                  <strong>Better lighting in the prayer hall</strong>
                  <span className="cb-pill cb-pill--gold">28 votes</span>
                </div>
                <p>Members have asked for softer, warmer lighting before winter prayers.</p>
              </article>

              <article className="cb-feed-item">
                <div className="cb-feed-topline">
                  <strong>Weekly halaqa on Friday evenings</strong>
                  <span className="cb-pill cb-pill--teal">Approved</span>
                </div>
                <p>The committee confirmed a recurring session and shared the room booking.</p>
              </article>
            </div>
          </Card>

          <Card>
            <div className="cb-card-stack">
              <span className="cb-card-kicker">Closed loop</span>
              <h3>Announcements show what changed</h3>
              <p className="cb-muted">
                Once a suggestion is implemented, members can see the response immediately in the feed.
              </p>
              <div className="cb-action-row">
                <button type="button" className="cb-button cb-button--primary" onClick={() => setPanel('report')}>
                  Raise a suggestion
                </button>
                <button type="button" className="cb-button cb-button--secondary" onClick={() => setPanel('events')}>
                  View events
                </button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {panel === 'report' ? (
        <div className="cb-grid cb-grid--two">
          <Card>
            <div className="cb-card-stack">
              <div>
                <span className="cb-card-kicker">Private report</span>
                <h3>Flag safety or facilities issues discreetly</h3>
              </div>

              <div className="cb-note">
                Safety reports are prioritised, while general issues stay private to admins.
              </div>

              <div className="cb-field-grid">
                <label className="cb-field">
                  <span>Issue</span>
                  <div className="cb-field-input">Blocked exit near the side entrance</div>
                </label>
                <label className="cb-field">
                  <span>Severity</span>
                  <div className="cb-field-input">RED</div>
                </label>
              </div>

              <div className="cb-action-row">
                <button
                  type="button"
                  className="cb-button cb-button--primary"
                  onClick={() => setPanel('feed')}
                >
                  Submit privately
                </button>
                <button type="button" className="cb-button cb-button--secondary" onClick={() => setPanel('feed')}>
                  Save draft
                </button>
              </div>
            </div>
          </Card>

          <Card>
            <div className="cb-card-stack">
              <span className="cb-card-kicker">Queue priority</span>
              <h3>Safety {">"} Facilities {">"} General</h3>
              <p className="cb-muted">The category you choose helps triage urgent reports into the right queue.</p>
              <div className="cb-action-row">
                <button type="button" className="cb-button cb-button--ghost" onClick={() => setPanel('events')}>
                  See voting
                </button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {panel === 'events' ? (
        <Card>
          <div className="cb-card-stack">
            <div>
              <span className="cb-card-kicker">Upcoming events</span>
              <h3>Vote on what to fund next</h3>
            </div>

            <div className="cb-event-list">
              <article className="cb-event-item">
                <div>
                  <strong>Ramadan family dinner</strong>
                  <p>Saturday, 7:30pm · Community hall</p>
                </div>
                <div className="cb-event-meta">
                  <span className="cb-pill cb-pill--teal">{voted ? '73% yes' : '72% yes'}</span>
                  <button type="button" className="cb-link-button" onClick={() => setVoted((value) => !value)}>
                    {voted ? 'Undo vote' : 'Vote'}
                  </button>
                </div>
              </article>

              <article className="cb-event-item">
                <div>
                  <strong>Youth mentoring circle</strong>
                  <p>Sunday, 5:00pm · Learning room</p>
                </div>
                <div className="cb-event-meta">
                  <span className="cb-pill cb-pill--gold">65% yes</span>
                  <button type="button" className="cb-link-button" onClick={() => setPanel('feed')}>
                    Back to feed
                  </button>
                </div>
              </article>
            </div>
          </div>
        </Card>
      ) : null}
    </section>
  );
}
