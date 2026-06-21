import { Card } from '../components/Card';

/**
 * Admin dashboard (stub). Will host: the prioritised report queue + AI clusters,
 * the announcements composer, the event creator, and content flagging.
 */
export function AdminDashboard(): JSX.Element {
  return (
    <section className="cb-view" aria-labelledby="admin-dashboard-title">
      <header className="cb-view-header">
        <div>
          <p className="cb-eyebrow">Admin dashboard</p>
          <h2 id="admin-dashboard-title">Prioritise urgent work and keep the community informed.</h2>
        </div>
        <div className="cb-metric-row">
          <div className="cb-metric">
            <span className="cb-metric-label">Urgent reports</span>
            <strong>2</strong>
          </div>
          <div className="cb-metric">
            <span className="cb-metric-label">Pending approvals</span>
            <strong>5</strong>
          </div>
          <div className="cb-metric">
            <span className="cb-metric-label">Addressed this month</span>
            <strong>65%</strong>
          </div>
        </div>
      </header>

      <div className="cb-grid cb-grid--two">
        <Card>
          <div className="cb-card-stack">
            <div>
              <span className="cb-card-kicker">Priority queue</span>
              <h3>Resolve the most urgent reports first</h3>
            </div>

            <article className="cb-queue-item cb-queue-item--urgent">
              <div>
                <strong>Fire door obstructed</strong>
                <p>Reported 12 minutes ago · RED</p>
              </div>
              <button type="button" className="cb-button cb-button--ghost">
                Mark resolved
              </button>
            </article>

            <article className="cb-queue-item">
              <div>
                <strong>Toilet cleaning rota request</strong>
                <p>Reported 1 hour ago · AMBER</p>
              </div>
              <button type="button" className="cb-button cb-button--ghost">
                Review
              </button>
            </article>
          </div>
        </Card>

        <Card>
          <div className="cb-card-stack">
            <div>
              <span className="cb-card-kicker">Announcements</span>
              <h3>Draft updates before they go live</h3>
            </div>

            <div className="cb-note">
              Use short, clear language. Announcements are most effective when they reference one action.
            </div>

            <label className="cb-field">
              <span>Announcement copy</span>
              <div className="cb-field-input cb-field-input--textarea">
                Jumu'ah parking guidance will change from Friday.
              </div>
            </label>

            <div className="cb-action-row">
              <button type="button" className="cb-button cb-button--primary">
                Publish update
              </button>
              <button type="button" className="cb-button cb-button--secondary">
                Save as draft
              </button>
            </div>
          </div>
        </Card>
      </div>

      <div className="cb-grid cb-grid--three">
        <Card>
          <div className="cb-card-stack">
            <span className="cb-card-kicker">Moderation</span>
            <h3>Approval queue</h3>
            <p className="cb-muted">Review community membership requests and admin access applications.</p>
          </div>
        </Card>
        <Card>
          <div className="cb-card-stack">
            <span className="cb-card-kicker">Events</span>
            <h3>Create and promote events</h3>
            <p className="cb-muted">Coordinate talks, iftars, and youth sessions from the same workspace.</p>
          </div>
        </Card>
        <Card>
          <div className="cb-card-stack">
            <span className="cb-card-kicker">Insights</span>
            <h3>Watch the cluster trends</h3>
            <p className="cb-muted">Recurring issues are grouped so the team can solve root causes.</p>
          </div>
        </Card>
      </div>
    </section>
  );
}
