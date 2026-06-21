import { useState } from 'react';
import './community.css';

type CommunityPageProps = {
  communityName: string;
  onBack: () => void;
};

type Role = 'member' | 'admin';
type Status = 'todo' | 'in-progress' | 'done';
type Severity = 'RED' | 'AMBER' | 'GREEN';

type Suggestion = { id: number; title: string; body: string; votes: number; voted: boolean; status: Status };
type Report = { id: number; title: string; body: string; severity: Severity; status: Status };
type EventItem = { id: number; title: string; when: string; votes: number; voted: boolean };
type Update = { id: number; title: string; body: string; kind: 'implemented' | 'notice'; date: string };

const STATUS_LABEL: Record<Status, string> = {
  todo: 'To do',
  'in-progress': 'In progress',
  done: 'Done',
};

const STATUS_CLASS: Record<Status, string> = {
  todo: 'cb-tag--todo',
  'in-progress': 'cb-tag--progress',
  done: 'cb-tag--done',
};

// Full prototype content lives only on East London Mosque (the demo community).
const seedSuggestions = (): Suggestion[] => [
  { id: 1, title: 'Earlier Fajr congregation in summer', body: 'Members asked for an earlier jamaaʻah during the long summer days.', votes: 41, voted: false, status: 'done' },
  { id: 2, title: 'Softer lighting in the main prayer hall', body: 'Warmer, dimmable lighting for evening and night prayers.', votes: 28, voted: false, status: 'in-progress' },
  { id: 3, title: 'Add a bookshelf to the sisters’ section', body: 'A small Islamic library for the women’s prayer area.', votes: 19, voted: false, status: 'todo' },
  { id: 4, title: 'Bike racks at the main entrance', body: 'Secure cycle parking for members who ride to prayers.', votes: 12, voted: false, status: 'todo' },
];

const seedReports = (): Report[] => [
  { id: 1, title: 'Fire exit near the wudu area is blocked', body: 'Boxes stacked against the side fire door.', severity: 'RED', status: 'todo' },
  { id: 2, title: 'Leaking tap in the men’s wudu area', body: 'Second sink from the left drips constantly.', severity: 'AMBER', status: 'in-progress' },
  { id: 3, title: 'Flickering light in the car park', body: 'Back-corner light needs replacing.', severity: 'GREEN', status: 'todo' },
];

const seedEvents = (): EventItem[] => [
  { id: 1, title: 'Community Iftar — last 10 nights', when: 'Proposed for Ramadan · Main hall', votes: 64, voted: false },
  { id: 2, title: 'Youth football tournament', when: 'Proposed for August · Mile End park', votes: 38, voted: false },
  { id: 3, title: 'New Muslim welcome evening', when: 'Proposed monthly · Learning room', votes: 22, voted: false },
];

const seedUpdates = (): Update[] => [
  { id: 1, title: 'Softer prayer-hall lighting installed', body: 'Following 28 votes, warm dimmable LEDs are now fitted in the main hall.', kind: 'implemented', date: '2 days ago' },
  { id: 2, title: 'Earlier summer Fajr congregation now in place', body: 'Jamaaʻah brought forward for the summer timetable — see the noticeboard.', kind: 'implemented', date: '1 week ago' },
  { id: 3, title: 'Jumuʻah parking changes from this Friday', body: 'Overflow parking moves to the rear lot. Please follow the stewards.', kind: 'notice', date: '3 days ago' },
];

/** Lightweight dropdown: a trigger button that reveals a small menu of actions. */
function PostMenu({ label, options }: { label: string; options: { label: string; icon: string; onSelect: () => void }[] }): JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <div className="cb-post-menu">
      <button type="button" className="cb-button cb-button--primary" onClick={() => setOpen((v) => !v)}>
        <i className="ti ti-plus" aria-hidden="true" /> {label}
        <i className={open ? 'ti ti-chevron-up' : 'ti ti-chevron-down'} aria-hidden="true" />
      </button>
      {open ? (
        <div className="cb-post-menu-list" role="menu">
          {options.map((opt) => (
            <button
              key={opt.label}
              type="button"
              role="menuitem"
              className="cb-post-menu-item"
              onClick={() => {
                opt.onSelect();
                setOpen(false);
              }}
            >
              <i className={`ti ${opt.icon}`} aria-hidden="true" /> {opt.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CommunityPage({ communityName, onBack }: CommunityPageProps): JSX.Element {
  const hasContent = communityName === 'East London Mosque';

  const [role, setRole] = useState<Role>('member');
  const [suggestions, setSuggestions] = useState<Suggestion[]>(hasContent ? seedSuggestions : () => []);
  const [reports, setReports] = useState<Report[]>(hasContent ? seedReports : () => []);
  const [events, setEvents] = useState<EventItem[]>(hasContent ? seedEvents : () => []);
  const [updates, setUpdates] = useState<Update[]>(hasContent ? seedUpdates : () => []);

  const [memberTab, setMemberTab] = useState<'suggestions' | 'events' | 'updates'>('suggestions');
  const [adminTab, setAdminTab] = useState<'suggestions' | 'reports' | 'posts'>('suggestions');

  // Inline composer state ('which form is open', shared between roles).
  const [composer, setComposer] = useState<null | 'suggestion' | 'report' | 'event' | 'announcement'>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [aiOpen, setAiOpen] = useState(false);

  const closeComposer = (): void => {
    setComposer(null);
    setDraftTitle('');
    setDraftBody('');
  };

  const toggleVote = (id: number, list: 'suggestions' | 'events'): void => {
    if (list === 'suggestions') {
      setSuggestions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, voted: !s.voted, votes: s.votes + (s.voted ? -1 : 1) } : s)),
      );
    } else {
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, voted: !e.voted, votes: e.votes + (e.voted ? -1 : 1) } : e)),
      );
    }
  };

  const setSuggestionStatus = (id: number, status: Status): void =>
    setSuggestions((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));

  const setReportStatus = (id: number, status: Status): void =>
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));

  const submitComposer = (): void => {
    const title = draftTitle.trim() || 'Untitled';
    const body = draftBody.trim() || 'No details provided.';
    const id = Date.now();
    if (composer === 'suggestion') {
      setSuggestions((prev) => [{ id, title, body, votes: 1, voted: true, status: 'todo' }, ...prev]);
      setMemberTab('suggestions');
    } else if (composer === 'report') {
      setReports((prev) => [{ id, title, body, severity: 'AMBER', status: 'todo' }, ...prev]);
    } else if (composer === 'event') {
      setEvents((prev) => [{ id, title, when: body, votes: 0, voted: false }, ...prev]);
      setAdminTab('posts');
    } else if (composer === 'announcement') {
      setUpdates((prev) => [{ id, title, body, kind: 'notice', date: 'Just now' }, ...prev]);
      setAdminTab('posts');
    }
    closeComposer();
  };

  const composerTitleLabel: Record<string, string> = {
    suggestion: 'Post a suggestion',
    report: 'Report a problem',
    event: 'Propose an event',
    announcement: 'Post an announcement',
  };

  return (
    <section className="cb-page cb-community" aria-labelledby="community-title">
      <header className="cb-view-header cb-comm-head">
        <div>
          <button type="button" className="cb-link-button cb-comm-back" onClick={onBack}>
            ← My communities
          </button>
          <h2 id="community-title" className="cb-comm-title">{communityName}</h2>
          <p className="cb-muted">Whitechapel, London E1 · 412 members</p>
        </div>

        <div className="cb-role-toggle" role="tablist" aria-label="View as">
          <span className="cb-role-toggle-label">View as</span>
          <button
            type="button"
            role="tab"
            aria-selected={role === 'member'}
            className={role === 'member' ? 'cb-seg cb-seg--active' : 'cb-seg'}
            onClick={() => {
              setRole('member');
              closeComposer();
            }}
          >
            Member
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={role === 'admin'}
            className={role === 'admin' ? 'cb-seg cb-seg--active' : 'cb-seg'}
            onClick={() => {
              setRole('admin');
              closeComposer();
            }}
          >
            Admin
          </button>
        </div>
      </header>

      {!hasContent ? (
        <div className="cb-empty">
          <i className="ti ti-seedling" aria-hidden="true" />
          Nothing posted in {communityName} yet.
        </div>
      ) : role === 'member' ? (
        /* ── MEMBER ──────────────────────────────────────────── */
        <>
          <div className="cb-comm-bar">
            <div className="cb-view-toolbar" role="tablist" aria-label="Community sections">
              <button type="button" className={memberTab === 'suggestions' ? 'cb-tab cb-tab--active' : 'cb-tab'} onClick={() => setMemberTab('suggestions')}>
                Suggestions
              </button>
              <button type="button" className={memberTab === 'events' ? 'cb-tab cb-tab--active' : 'cb-tab'} onClick={() => setMemberTab('events')}>
                Events
              </button>
              <button type="button" className={memberTab === 'updates' ? 'cb-tab cb-tab--active' : 'cb-tab'} onClick={() => setMemberTab('updates')}>
                Updates
              </button>
            </div>

            <PostMenu
              label="Post"
              options={[
                { label: 'Post suggestion', icon: 'ti-bulb', onSelect: () => setComposer('suggestion') },
                { label: 'Report problem', icon: 'ti-alert-triangle', onSelect: () => setComposer('report') },
              ]}
            />
          </div>

          {composer === 'suggestion' || composer === 'report' ? (
            <ComposerCard
              title={composerTitleLabel[composer]}
              titleValue={draftTitle}
              bodyValue={draftBody}
              bodyLabel={composer === 'report' ? 'What’s the problem?' : 'Details'}
              onTitle={setDraftTitle}
              onBody={setDraftBody}
              onSubmit={submitComposer}
              onCancel={closeComposer}
              note={composer === 'report' ? 'Problem reports are private — only admins can see them.' : 'Suggestions are public and other members can upvote them.'}
            />
          ) : null}

          {memberTab === 'suggestions' ? (
            <div className="cb-item-list">
              {suggestions.map((s) => (
                <article key={s.id} className="cb-feed-item">
                  <div className="cb-feed-topline">
                    <strong>{s.title}</strong>
                    <span className={`cb-tag ${STATUS_CLASS[s.status]}`}>{STATUS_LABEL[s.status]}</span>
                  </div>
                  <p>{s.body}</p>
                  <button
                    type="button"
                    className={s.voted ? 'cb-upvote cb-upvote--voted' : 'cb-upvote'}
                    onClick={() => toggleVote(s.id, 'suggestions')}
                  >
                    <i className="ti ti-arrow-big-up" aria-hidden="true" /> {s.votes}
                  </button>
                </article>
              ))}
            </div>
          ) : null}

          {memberTab === 'events' ? (
            <div className="cb-item-list">
              <p className="cb-muted">Potential events — upvote the ones you&rsquo;d come to.</p>
              {events.map((e) => (
                <article key={e.id} className="cb-event-item">
                  <div>
                    <strong>{e.title}</strong>
                    <p>{e.when}</p>
                  </div>
                  <div className="cb-event-meta">
                    <button
                      type="button"
                      className={e.voted ? 'cb-upvote cb-upvote--voted' : 'cb-upvote'}
                      onClick={() => toggleVote(e.id, 'events')}
                    >
                      <i className="ti ti-arrow-big-up" aria-hidden="true" /> {e.votes}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          {memberTab === 'updates' ? (
            <div className="cb-item-list">
              {updates.map((u) => (
                <article key={u.id} className="cb-update-item">
                  <div className="cb-feed-topline">
                    <strong>{u.title}</strong>
                    <span className={u.kind === 'implemented' ? 'cb-tag cb-tag--done' : 'cb-tag cb-tag--notice'}>
                      {u.kind === 'implemented' ? 'Implemented' : 'Notice'}
                    </span>
                  </div>
                  <p>{u.body}</p>
                  <span className="cb-card-time">{u.date}</span>
                </article>
              ))}
            </div>
          ) : null}
        </>
      ) : (
        /* ── ADMIN ───────────────────────────────────────────── */
        <>
          <div className="cb-comm-bar">
            <div className="cb-view-toolbar" role="tablist" aria-label="Admin sections">
              <button type="button" className={adminTab === 'suggestions' ? 'cb-tab cb-tab--active' : 'cb-tab'} onClick={() => setAdminTab('suggestions')}>
                Suggestions
              </button>
              <button type="button" className={adminTab === 'reports' ? 'cb-tab cb-tab--active' : 'cb-tab'} onClick={() => setAdminTab('reports')}>
                Reports
              </button>
              <button type="button" className={adminTab === 'posts' ? 'cb-tab cb-tab--active' : 'cb-tab'} onClick={() => setAdminTab('posts')}>
                Posts
              </button>
            </div>

            <PostMenu
              label="Post"
              options={[
                { label: 'Propose an event', icon: 'ti-calendar-plus', onSelect: () => setComposer('event') },
                { label: 'Post announcement', icon: 'ti-speakerphone', onSelect: () => setComposer('announcement') },
              ]}
            />
          </div>

          {composer === 'event' || composer === 'announcement' ? (
            <ComposerCard
              title={composerTitleLabel[composer]}
              titleValue={draftTitle}
              bodyValue={draftBody}
              bodyLabel={composer === 'event' ? 'When & where' : 'Announcement'}
              onTitle={setDraftTitle}
              onBody={setDraftBody}
              onSubmit={submitComposer}
              onCancel={closeComposer}
              note={composer === 'event' ? 'Members will be able to upvote this proposed event.' : 'Announcements appear in every member’s Updates tab.'}
            />
          ) : null}

          {adminTab === 'suggestions' ? (
            <>
              <div className="cb-comm-bar">
                <p className="cb-muted">Set a status as work progresses.</p>
                <button type="button" className="cb-ai-btn" onClick={() => setAiOpen((v) => !v)}>
                  <i className="ti ti-sparkles" aria-hidden="true" /> Summarise biggest ideas
                </button>
              </div>

              {aiOpen ? (
                <div className="cb-ai-panel">
                  <div className="cb-ai-panel-head">
                    <i className="ti ti-sparkles" aria-hidden="true" />
                    <strong>AI summary</strong>
                    <span className="cb-ai-tag">prototype</span>
                  </div>
                  <p>
                    Three themes are emerging across {suggestions.length} suggestions:
                    <strong> prayer-hall comfort</strong> (lighting &amp; seating, ~69 votes),
                    <strong> youth engagement</strong> (football &amp; mentoring, ~38 votes), and
                    <strong> facilities upkeep</strong> (wudu area &amp; parking). Recommended focus:
                    prayer-hall comfort — highest combined demand and already in progress.
                  </p>
                </div>
              ) : null}

              <div className="cb-item-list">
                {suggestions.map((s) => (
                  <article key={s.id} className="cb-feed-item">
                    <div className="cb-feed-topline">
                      <strong>{s.title}</strong>
                      <span className="cb-pill cb-pill--gold">{s.votes} votes</span>
                    </div>
                    <p>{s.body}</p>
                    <label className="cb-status-row">
                      <span>Status</span>
                      <select
                        className={`cb-status-select ${STATUS_CLASS[s.status]}`}
                        value={s.status}
                        onChange={(e) => setSuggestionStatus(s.id, e.target.value as Status)}
                      >
                        <option value="todo">To do</option>
                        <option value="in-progress">In progress</option>
                        <option value="done">Done</option>
                      </select>
                    </label>
                  </article>
                ))}
              </div>
            </>
          ) : null}

          {adminTab === 'reports' ? (
            <div className="cb-item-list">
              <p className="cb-muted">Private problem reports — members never see these.</p>
              {reports.map((r) => (
                <article key={r.id} className={`cb-queue-item ${r.severity === 'RED' ? 'cb-queue-item--urgent' : ''}`}>
                  <div>
                    <div className="cb-feed-topline">
                      <strong>{r.title}</strong>
                      <span className={`cb-pill cb-pill--${r.severity.toLowerCase()}`}>{r.severity}</span>
                    </div>
                    <p>{r.body}</p>
                  </div>
                  <label className="cb-status-row">
                    <span>Status</span>
                    <select
                      className={`cb-status-select ${STATUS_CLASS[r.status]}`}
                      value={r.status}
                      onChange={(e) => setReportStatus(r.id, e.target.value as Status)}
                    >
                      <option value="todo">To do</option>
                      <option value="in-progress">In progress</option>
                      <option value="done">Done</option>
                    </select>
                  </label>
                </article>
              ))}
            </div>
          ) : null}

          {adminTab === 'posts' ? (
            <div className="cb-grid cb-grid--two">
              <div>
                <h3 className="cb-comm-subhead">Potential events</h3>
                <div className="cb-item-list">
                  {events.map((e) => (
                    <article key={e.id} className="cb-event-item">
                      <div>
                        <strong>{e.title}</strong>
                        <p>{e.when}</p>
                      </div>
                      <span className="cb-pill cb-pill--gold">{e.votes} votes</span>
                    </article>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="cb-comm-subhead">Announcements &amp; updates</h3>
                <div className="cb-item-list">
                  {updates.map((u) => (
                    <article key={u.id} className="cb-update-item">
                      <div className="cb-feed-topline">
                        <strong>{u.title}</strong>
                        <span className={u.kind === 'implemented' ? 'cb-tag cb-tag--done' : 'cb-tag cb-tag--notice'}>
                          {u.kind === 'implemented' ? 'Implemented' : 'Notice'}
                        </span>
                      </div>
                      <p>{u.body}</p>
                      <span className="cb-card-time">{u.date}</span>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

/** Shared inline composer used by both roles. */
function ComposerCard(props: {
  title: string;
  titleValue: string;
  bodyValue: string;
  bodyLabel: string;
  note: string;
  onTitle: (v: string) => void;
  onBody: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}): JSX.Element {
  return (
    <form
      className="cb-composer"
      onSubmit={(e) => {
        e.preventDefault();
        props.onSubmit();
      }}
    >
      <h3 className="cb-comm-subhead">{props.title}</h3>
      <div className="cb-note">{props.note}</div>
      <label className="cb-field">
        <span>Title</span>
        <input className="cb-field-input" value={props.titleValue} onChange={(e) => props.onTitle(e.target.value)} placeholder="Short summary" />
      </label>
      <label className="cb-field">
        <span>{props.bodyLabel}</span>
        <textarea className="cb-field-input cb-field-input--textarea" value={props.bodyValue} onChange={(e) => props.onBody(e.target.value)} placeholder="Add a little detail..." />
      </label>
      <div className="cb-action-row">
        <button type="submit" className="cb-button cb-button--primary">Post</button>
        <button type="button" className="cb-button cb-button--secondary" onClick={props.onCancel}>Cancel</button>
      </div>
    </form>
  );
}
