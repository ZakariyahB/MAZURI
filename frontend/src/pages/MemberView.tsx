import { Card } from '../components/Card';

/**
 * Member view (stub). Lives under core/ so it ships in both standalone and
 * embedded modes. Will host: the suggestion feed + upvotes, the report form,
 * and event voting.
 */
export function MemberView(): JSX.Element {
  return (
    <section className="cb-view" aria-labelledby="member-view-title">
      <header className="cb-view-header">
        <div>
          <p className="cb-eyebrow">Member view</p>
          <h2 id="member-view-title">Raise issues, vote on priorities, and stay informed.</h2>
        </div>
        <div className="cb-metric-row">
          <div className="cb-metric">
            <span className="cb-metric-label">Open suggestions</span>
            <strong>18</strong>
          </div>
          <div className="cb-metric">
            <span className="cb-metric-label">Incidents reported</span>
            <strong>4</strong>
          </div>
          <div className="cb-metric">
            <span className="cb-metric-label">Events this month</span>
            <strong>6</strong>
          </div>
        </div>
      </header>

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
              <button type="button" className="cb-button cb-button--primary">
                Submit privately
              </button>
              <button type="button" className="cb-button cb-button--secondary">
                Save draft
              </button>
            </div>
          </div>
        </Card>
      </div>

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
                <span className="cb-pill cb-pill--teal">72% yes</span>
                <button type="button" className="cb-link-button">
                  Vote
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
                <button type="button" className="cb-link-button">
                  Vote
                </button>
              </div>
            </article>
          </div>
        </div>
      </Card>
    </section>
  );
}
