import { useState } from 'react';
import { Card } from '../components/Card';

type AppView = 'landing' | 'communities' | 'auth' | 'member' | 'admin';

type AdminDashboardProps = {
  onNavigate: (view: AppView) => void;
};

type AdminPanel = 'reports' | 'approvals' | 'announcements';

/**
 * Admin dashboard (stub). Will host: the prioritised report queue + AI clusters,
 * the announcements composer, the event creator, and content flagging.
 */
export function AdminDashboard({ onNavigate }: AdminDashboardProps): JSX.Element {
  const [panel, setPanel] = useState<AdminPanel>('reports');
  const [resolved, setResolved] = useState(false);

  return (
    <section className="cb-page" aria-labelledby="admin-dashboard-title">
      <header className="cb-view-header">
        <div>
          <p className="cb-eyebrow">Admin dashboard</p>
          <h2 id="admin-dashboard-title">Prioritise urgent work and keep the community informed.</h2>
        </div>

        <div className="cb-action-row">
          <button type="button" className="cb-button cb-button--secondary" onClick={() => onNavigate('landing')}>
            Back to home
          </button>
          <button type="button" className="cb-button cb-button--ghost" onClick={() => onNavigate('member')}>
            Preview member view
          </button>
        </div>
      </header>

      <div className="cb-view-toolbar" role="tablist" aria-label="Admin sections">
        <button type="button" className={panel === 'reports' ? 'cb-tab cb-tab--active' : 'cb-tab'} onClick={() => setPanel('reports')}>
          Reports
        </button>
        <button type="button" className={panel === 'approvals' ? 'cb-tab cb-tab--active' : 'cb-tab'} onClick={() => setPanel('approvals')}>
          Approvals
        </button>
        <button
          type="button"
          className={panel === 'announcements' ? 'cb-tab cb-tab--active' : 'cb-tab'}
          onClick={() => setPanel('announcements')}
        >
          Announcements
        </button>
      </div>

      {panel === 'reports' ? (
        <div className="cb-grid cb-grid--two">
          <Card>
            <div className="cb-card-stack">
              <div>
                <span className="cb-card-kicker">Priority queue</span>
                <h3>Resolve the most urgent reports first</h3>
              </div>

              <article className={`cb-queue-item ${resolved ? '' : 'cb-queue-item--urgent'}`}>
                <div>
                  <strong>Fire door obstructed</strong>
                  <p>{resolved ? 'Resolved just now · RED' : 'Reported 12 minutes ago · RED'}</p>
                </div>
                <button type="button" className="cb-button cb-button--ghost" onClick={() => setResolved((value) => !value)}>
                  {resolved ? 'Undo' : 'Mark resolved'}
                </button>
              </article>

              <article className="cb-queue-item">
                <div>
                  <strong>Toilet cleaning rota request</strong>
                  <p>Reported 1 hour ago · AMBER</p>
                </div>
                <button type="button" className="cb-button cb-button--ghost" onClick={() => setPanel('approvals')}>
                  Review
                </button>
              </article>
            </div>
          </Card>

          <Card>
            <div className="cb-card-stack">
              <span className="cb-card-kicker">AI clusters</span>
              <h3>Group duplicates before they pile up</h3>
              <p className="cb-muted">The model surfaces repeated incidents so a human admin can act faster.</p>
              <div className="cb-action-row">
                <button type="button" className="cb-button cb-button--primary" onClick={() => setPanel('announcements')}>
                  Draft response
                </button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {panel === 'approvals' ? (
        <div className="cb-grid cb-grid--two">
          <Card>
            <div className="cb-card-stack">
              <span className="cb-card-kicker">Moderation</span>
              <h3>Approval queue</h3>
              <p className="cb-muted">Review community membership requests and admin access applications.</p>
              <div className="cb-action-row">
                <button type="button" className="cb-button cb-button--primary" onClick={() => setPanel('reports')}>
                  Approve
                </button>
                <button type="button" className="cb-button cb-button--secondary" onClick={() => setPanel('reports')}>
                  Reject
                </button>
              </div>
            </div>
          </Card>

          <Card>
            <div className="cb-card-stack">
              <span className="cb-card-kicker">Events</span>
              <h3>Create and promote events</h3>
              <p className="cb-muted">Coordinate talks, iftars, and youth sessions from the same workspace.</p>
              <div className="cb-action-row">
                <button type="button" className="cb-button cb-button--ghost" onClick={() => setPanel('announcements')}>
                  Open composer
                </button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {panel === 'announcements' ? (
        <div className="cb-grid cb-grid--two">
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
                <button type="button" className="cb-button cb-button--primary" onClick={() => setPanel('reports')}>
                  Publish update
                </button>
                <button type="button" className="cb-button cb-button--secondary" onClick={() => setPanel('reports')}>
                  Save as draft
                </button>
              </div>
            </div>
          </Card>

          <Card>
            <div className="cb-card-stack">
              <span className="cb-card-kicker">Insights</span>
              <h3>Watch the cluster trends</h3>
              <p className="cb-muted">Recurring issues are grouped so the team can solve root causes.</p>
              <div className="cb-action-row">
                <button type="button" className="cb-button cb-button--ghost" onClick={() => onNavigate('member')}>
                  Preview member view
                </button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </section>
  );
}
