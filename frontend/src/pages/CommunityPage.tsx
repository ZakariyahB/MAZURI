import { useEffect, useRef, useState } from 'react';
import './community.css';
import { ApiError, type ApiClient } from '../api/client';
import type {
  Announcement,
  CommunityAnalytics,
  CommunityMember,
  CommunityWithRole,
  EventItem,
  Incident,
  Post,
  ReportCluster,
  Severity,
  Suggestion,
  Tier,
  Urgency,
} from '../api/types';
import { formatDate, timeAgo } from '../utils/time';

type CommunityPageProps = {
  api: ApiClient;
  community: CommunityWithRole;
  onBack: () => void;
};

type ViewAs = 'member' | 'admin';
type MemberTab = 'suggestions' | 'proposed' | 'events' | 'updates';
type AdminTab = 'suggestions' | 'reports' | 'announcements' | 'members';
type ComposerKind =
  | 'suggestion'
  | 'report'
  | 'proposed_event'
  | 'past_event'
  | 'announcement'
  | 'post';

const SEVERITY_PILL: Record<Severity, string> = {
  RED: 'cb-pill--red',
  AMBER: 'cb-pill--amber',
  GREEN: 'cb-pill--green',
};

const URGENCY_PILL: Record<Urgency, string> = {
  safety: 'cb-pill--red',
  facilities: 'cb-pill--amber',
  general: 'cb-pill--green',
};

/** Lightweight dropdown: a trigger button that reveals a small menu of actions. */
function PostMenu({ label, options }: { label: string; options: { label: string; icon: string; onSelect: () => void }[] }): JSX.Element {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent): void => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="cb-post-menu" ref={ref}>
      <button type="button" className="cb-button cb-button--primary" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
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

/**
 * A community workspace, live against the API. Members post suggestions
 * (public, moderated) and private reports; admins moderate, triage reports
 * (AI clustering on the Insights tier), resolve, post announcements / posts /
 * events, and manage members. Real role comes from the membership.
 */
export function CommunityPage({ api, community, onBack }: CommunityPageProps): JSX.Element {
  const isAdmin = community.role === 'admin';
  const id = community.id;

  const [viewAs, setViewAs] = useState<ViewAs>(isAdmin ? 'admin' : 'member');
  const [tier, setTier] = useState<Tier>(community.tier);

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [queue, setQueue] = useState<Suggestion[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [myAnnouncements, setMyAnnouncements] = useState<Announcement[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [analytics, setAnalytics] = useState<CommunityAnalytics | null>(null);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [memberTab, setMemberTab] = useState<MemberTab>('suggestions');
  const [adminTab, setAdminTab] = useState<AdminTab>('suggestions');

  // One-vote / one-rating state for this session; reconciled against the API's 409s.
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [ratedIds, setRatedIds] = useState<Set<string>>(new Set());
  // Which way the member voted on each proposed event this session.
  const [eventVotes, setEventVotes] = useState<Map<string, 'up' | 'down'>>(new Map());

  // AI triage (Insights tier).
  const [clusters, setClusters] = useState<ReportCluster[] | null>(null);
  const [clustersLoading, setClustersLoading] = useState(false);
  const [clustersError, setClustersError] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  // Inline composer state ('which form is open', shared between roles).
  const [composer, setComposer] = useState<ComposerKind | null>(null);
  const [draftBody, setDraftBody] = useState('');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDate, setDraftDate] = useState('');
  const [draftSeverity, setDraftSeverity] = useState<Severity>('AMBER');
  const [draftImage, setDraftImage] = useState<File | null>(null);
  // When set, the announcement composer edits this announcement instead of creating.
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        const [sugg, evts, anns, psts, stats] = await Promise.all([
          api.listSuggestions(id),
          api.listEvents(id),
          api.listAnnouncements(id),
          api.listPosts(id),
          api.getAnalytics(id),
        ]);
        if (cancelled) return;
        setSuggestions(sugg);
        setEvents(evts);
        setAnnouncements(anns);
        setPosts(psts);
        setAnalytics(stats);

        if (isAdmin) {
          const [pending, incs, membs, mine] = await Promise.all([
            api.listSuggestionQueue(id),
            api.listIncidents(id),
            api.listMembers(id),
            api.listMyAnnouncements(id),
          ]);
          if (cancelled) return;
          setQueue(pending);
          setIncidents(incs);
          setMembers(membs);
          setMyAnnouncements(mine);
        }
      } catch (err) {
        if (!cancelled) setLoadError((err as Error).message);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [api, id, isAdmin]);

  const refreshAnalytics = (): void => {
    api.getAnalytics(id).then(setAnalytics).catch(() => undefined);
  };

  const closeComposer = (): void => {
    setComposer(null);
    setDraftBody('');
    setDraftTitle('');
    setDraftDate('');
    setDraftSeverity('AMBER');
    setDraftImage(null);
    setEditingAnnouncementId(null);
    setComposerError(null);
  };

  const openComposer = (kind: ComposerKind): void => {
    setNotice(null);
    setComposerError(null);
    setEditingAnnouncementId(null);
    setDraftBody('');
    setDraftImage(null);
    setComposer(kind);
  };

  // Opens the announcement composer pre-filled to edit an existing announcement.
  const openAnnouncementEditor = (announcement: Announcement): void => {
    setNotice(null);
    setComposerError(null);
    setEditingAnnouncementId(announcement.id);
    setDraftBody(announcement.body);
    setDraftImage(null);
    setComposer('announcement');
  };

  const submitComposer = async (): Promise<void> => {
    setComposerError(null);
    setSubmitting(true);
    try {
      if (composer === 'suggestion') {
        const created = await api.createSuggestion(id, draftBody);
        setNotice('Suggestion submitted — it appears in the public feed once an admin approves it.');
        if (isAdmin) setQueue((prev) => [created, ...prev]);
      } else if (composer === 'report') {
        const created = await api.createIncident(id, draftBody, draftSeverity);
        setNotice('Report sent — only admins can see it.');
        if (isAdmin) setIncidents((prev) => [created, ...prev]);
        refreshAnalytics();
      } else if (composer === 'proposed_event' || composer === 'past_event') {
        const created = await api.createEvent(id, {
          title: draftTitle,
          description: draftBody,
          event_date: draftDate,
          kind: composer === 'proposed_event' ? 'proposed' : 'past',
        });
        setEvents((prev) => [created, ...prev]);
      } else if (composer === 'announcement') {
        // Upload a newly attached image first (if any), then create or update.
        const uploaded = draftImage ? [await api.uploadImage(id, draftImage)] : undefined;
        if (editingAnnouncementId) {
          const updated = await api.updateAnnouncement(id, editingAnnouncementId, draftBody, uploaded);
          setAnnouncements((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
          setMyAnnouncements((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
        } else {
          const created = await api.createAnnouncement(id, draftBody, uploaded ?? []);
          setAnnouncements((prev) => [created, ...prev]);
          setMyAnnouncements((prev) => [created, ...prev]);
        }
      } else if (composer === 'post') {
        const created = await api.createPost(id, draftBody);
        setPosts((prev) => [created, ...prev]);
      }
      closeComposer();
    } catch (err) {
      setComposerError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const upvote = async (suggestion: Suggestion): Promise<void> => {
    if (votedIds.has(suggestion.id)) return;
    try {
      const updated = await api.upvoteSuggestion(id, suggestion.id);
      setSuggestions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setVotedIds((prev) => new Set(prev).add(suggestion.id));
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Already voted in a previous session — remember it locally.
        setVotedIds((prev) => new Set(prev).add(suggestion.id));
      } else {
        setNotice((err as Error).message);
      }
    }
  };

  const rate = async (event: EventItem, rating: number): Promise<void> => {
    if (ratedIds.has(event.id)) return;
    try {
      await api.rateEvent(id, event.id, rating);
      setRatedIds((prev) => new Set(prev).add(event.id));
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setRatedIds((prev) => new Set(prev).add(event.id));
      } else {
        setNotice((err as Error).message);
      }
    }
  };

  const voteEvent = async (event: EventItem, direction: 'up' | 'down'): Promise<void> => {
    if (eventVotes.get(event.id) === direction) return;
    try {
      const updated = await api.voteEvent(id, event.id, direction);
      setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      setEventVotes((prev) => new Map(prev).set(event.id, direction));
    } catch (err) {
      setNotice((err as Error).message);
    }
  };

  const moderate = async (suggestion: Suggestion, decision: 'approve' | 'reject'): Promise<void> => {
    try {
      const updated = await api.moderateSuggestion(id, suggestion.id, decision);
      setQueue((prev) => prev.filter((s) => s.id !== suggestion.id));
      if (updated.status === 'approved') {
        setSuggestions((prev) =>
          [...prev, updated].sort((a, b) => b.upvote_count - a.upvote_count),
        );
      }
    } catch (err) {
      setNotice((err as Error).message);
    }
  };

  const resolve = async (incident: Incident): Promise<void> => {
    try {
      const updated = await api.resolveIncident(id, incident.id);
      setIncidents((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      refreshAnalytics();
    } catch (err) {
      setNotice((err as Error).message);
    }
  };

  const promote = async (member: CommunityMember): Promise<void> => {
    try {
      await api.promoteToAdmin(id, member.user_id);
      setMembers((prev) =>
        prev.map((m) => (m.user_id === member.user_id ? { ...m, role: 'admin' } : m)),
      );
    } catch (err) {
      setNotice((err as Error).message);
    }
  };

  const upgrade = async (): Promise<void> => {
    setUpgrading(true);
    setClustersError(null);
    try {
      const { community: updated } = await api.setSubscription(id, 'insights');
      setTier(updated.tier);
    } catch (err) {
      setClustersError((err as Error).message);
    } finally {
      setUpgrading(false);
    }
  };

  const runTriage = async (): Promise<void> => {
    setClustersError(null);
    setClustersLoading(true);
    try {
      setClusters(await api.getReportClusters(id));
    } catch (err) {
      setClustersError((err as Error).message);
    } finally {
      setClustersLoading(false);
    }
  };

  // Announcements + community posts merged into one "Updates" feed.
  const updates = [
    ...announcements.map((a) => ({ ...a, kind: 'announcement' as const })),
    ...posts.map((p) => ({ ...p, kind: 'post' as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const incidentById = new Map(incidents.map((r) => [r.id, r]));
  const openIncidents = incidents.filter((r) => r.status === 'open');
  const proposedEvents = events.filter((e) => e.kind === 'proposed');
  const pastEvents = events.filter((e) => e.kind === 'past');
  const isEventComposer = composer === 'proposed_event' || composer === 'past_event';

  const composerMeta: Record<ComposerKind, { title: string; note: string; bodyLabel: string }> = {
    suggestion: {
      title: 'Post a suggestion',
      note: 'Suggestions are public — other members can upvote them once approved.',
      bodyLabel: 'Your suggestion',
    },
    report: {
      title: 'Report a problem',
      note: 'Problem reports are private — only admins can see them.',
      bodyLabel: 'What’s the problem?',
    },
    proposed_event: {
      title: 'Propose an event',
      note: 'Proposed events appear in the members’ Proposed Events tab, where they upvote or downvote to gauge interest.',
      bodyLabel: 'Description',
    },
    past_event: {
      title: 'Add a past event',
      note: 'Past events appear in the members’ Events tab, where members who attended can rate them 1–5.',
      bodyLabel: 'Description',
    },
    announcement: {
      title: editingAnnouncementId ? 'Edit announcement' : 'Post an announcement',
      note: 'Announcements appear in every member’s Updates tab — use them to close the loop. You can attach an image.',
      bodyLabel: 'Announcement',
    },
    post: {
      title: 'Community post',
      note: 'A general update for the community feed.',
      bodyLabel: 'Post',
    },
  };

  const composerCard =
    composer !== null ? (
      <form
        className="cb-composer"
        onSubmit={(e) => {
          e.preventDefault();
          void submitComposer();
        }}
      >
        <h3 className="cb-comm-subhead">{composerMeta[composer].title}</h3>
        <div className="cb-note">{composerMeta[composer].note}</div>

        {isEventComposer ? (
          <>
            <label className="cb-field">
              <span>Title</span>
              <input
                className="cb-field-input"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="Community Iftar"
                required
              />
            </label>
            <label className="cb-field">
              <span>{composer === 'past_event' ? 'When it took place' : 'Proposed date & time'}</span>
              <input
                className="cb-field-input"
                type="datetime-local"
                value={draftDate}
                onChange={(e) => setDraftDate(e.target.value)}
                required
              />
            </label>
          </>
        ) : null}

        {composer === 'report' ? (
          <label className="cb-field">
            <span>Severity</span>
            <select
              className="cb-field-input"
              value={draftSeverity}
              onChange={(e) => setDraftSeverity(e.target.value as Severity)}
            >
              <option value="RED">RED — safety</option>
              <option value="AMBER">AMBER — facilities</option>
              <option value="GREEN">GREEN — general feedback</option>
            </select>
          </label>
        ) : null}

        <label className="cb-field">
          <span>{composerMeta[composer].bodyLabel}</span>
          <textarea
            className="cb-field-input cb-field-input--textarea"
            value={draftBody}
            onChange={(e) => setDraftBody(e.target.value)}
            placeholder="Add a little detail..."
            required={!isEventComposer}
          />
        </label>

        {composer === 'announcement' ? (
          <label className="cb-field">
            <span>Image (optional)</span>
            <input
              className="cb-field-input"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) => setDraftImage(e.target.files?.[0] ?? null)}
            />
            {editingAnnouncementId && !draftImage ? (
              <span className="cb-note">Leave empty to keep the current image.</span>
            ) : null}
          </label>
        ) : null}

        {composerError ? (
          <p className="cb-form-error" role="alert">
            {composerError}
          </p>
        ) : null}

        <div className="cb-action-row">
          <button type="submit" className="cb-button cb-button--primary" disabled={submitting}>
            {submitting ? 'Saving…' : editingAnnouncementId ? 'Save changes' : 'Post'}
          </button>
          <button type="button" className="cb-button cb-button--secondary" onClick={closeComposer}>
            Cancel
          </button>
        </div>
      </form>
    ) : null;

  const memberPostMenu = (
    <PostMenu
      label="Post"
      options={[
        { label: 'Post suggestion', icon: 'ti-bulb', onSelect: () => openComposer('suggestion') },
        { label: 'Report problem', icon: 'ti-alert-triangle', onSelect: () => openComposer('report') },
      ]}
    />
  );

  const adminPostMenu = (
    <PostMenu
      label="Post"
      options={[
        { label: 'Propose an event', icon: 'ti-calendar-plus', onSelect: () => openComposer('proposed_event') },
        { label: 'Add past event', icon: 'ti-calendar-check', onSelect: () => openComposer('past_event') },
        { label: 'Post announcement', icon: 'ti-speakerphone', onSelect: () => openComposer('announcement') },
        { label: 'Community post', icon: 'ti-notes', onSelect: () => openComposer('post') },
      ]}
    />
  );

  // Past events: members who attended rate them 1–5.
  const eventRating = (event: EventItem): JSX.Element => {
    if (ratedIds.has(event.id)) return <span className="cb-tag cb-tag--done">Rated — thanks!</span>;
    return (
      <span className="cb-rate-row" aria-label={`Rate ${event.title}`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" className="cb-rate-btn" onClick={() => void rate(event, n)}>
            {n}
          </button>
        ))}
      </span>
    );
  };

  // Proposed events: members upvote/downvote to signal interest.
  const eventVoteRow = (event: EventItem): JSX.Element => {
    const mine = eventVotes.get(event.id);
    return (
      <span className="cb-event-vote" aria-label={`Vote on ${event.title}`}>
        <button
          type="button"
          className={mine === 'up' ? 'cb-upvote cb-upvote--voted' : 'cb-upvote'}
          onClick={() => void voteEvent(event, 'up')}
        >
          <i className="ti ti-arrow-big-up" aria-hidden="true" /> {event.upvotes}
        </button>
        <button
          type="button"
          className={mine === 'down' ? 'cb-upvote cb-upvote--voted' : 'cb-upvote'}
          onClick={() => void voteEvent(event, 'down')}
        >
          <i className="ti ti-arrow-big-down" aria-hidden="true" /> {event.downvotes}
        </button>
      </span>
    );
  };

  return (
    <section className="cb-page cb-community" aria-labelledby="community-title">
      <header className="cb-view-header cb-comm-head">
        <div>
          <button type="button" className="cb-link-button cb-comm-back" onClick={onBack}>
            ← My communities
          </button>
          <h2 id="community-title" className="cb-comm-title">
            {community.name}
          </h2>
          <p className="cb-muted">
            Join code: {community.join_code} · {tier === 'insights' ? 'Insights tier' : 'Free tier'}
            {analytics && analytics.addressed_within_window_pct !== null
              ? ` · ${analytics.addressed_within_window_pct}% of reports addressed within ${analytics.window_days} days`
              : ''}
          </p>
        </div>

        {isAdmin ? (
          <div className="cb-role-toggle" role="tablist" aria-label="View as">
            <span className="cb-role-toggle-label">View as</span>
            <button
              type="button"
              role="tab"
              aria-selected={viewAs === 'member'}
              className={viewAs === 'member' ? 'cb-seg cb-seg--active' : 'cb-seg'}
              onClick={() => {
                setViewAs('member');
                closeComposer();
              }}
            >
              Member
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewAs === 'admin'}
              className={viewAs === 'admin' ? 'cb-seg cb-seg--active' : 'cb-seg'}
              onClick={() => {
                setViewAs('admin');
                closeComposer();
              }}
            >
              Admin
            </button>
          </div>
        ) : null}
      </header>

      {loadError ? (
        <div className="cb-empty" role="alert">
          <i className="ti ti-alert-circle" aria-hidden="true" />
          {loadError}
        </div>
      ) : null}

      {notice ? (
        <div className="cb-note" role="status">
          {notice}{' '}
          <button type="button" className="cb-link-button" onClick={() => setNotice(null)}>
            dismiss
          </button>
        </div>
      ) : null}

      {viewAs === 'member' ? (
        /* ── MEMBER ──────────────────────────────────────────── */
        <>
          <div className="cb-comm-bar">
            <div className="cb-view-toolbar" role="tablist" aria-label="Community sections">
              <button type="button" className={memberTab === 'suggestions' ? 'cb-tab cb-tab--active' : 'cb-tab'} onClick={() => setMemberTab('suggestions')}>
                Suggestions
              </button>
              <button type="button" className={memberTab === 'proposed' ? 'cb-tab cb-tab--active' : 'cb-tab'} onClick={() => setMemberTab('proposed')}>
                Proposed Events
              </button>
              <button type="button" className={memberTab === 'events' ? 'cb-tab cb-tab--active' : 'cb-tab'} onClick={() => setMemberTab('events')}>
                Events
              </button>
              <button type="button" className={memberTab === 'updates' ? 'cb-tab cb-tab--active' : 'cb-tab'} onClick={() => setMemberTab('updates')}>
                Updates
              </button>
            </div>

            {memberPostMenu}
          </div>

          {composer === 'suggestion' || composer === 'report' ? composerCard : null}

          {memberTab === 'suggestions' ? (
            <div className="cb-item-list">
              {suggestions.length === 0 ? (
                <p className="cb-muted">No approved suggestions yet — be the first to post one.</p>
              ) : null}
              {suggestions.map((s) => (
                <article key={s.id} className="cb-feed-item">
                  <div className="cb-feed-topline">
                    <strong>{s.body}</strong>
                  </div>
                  <span className="cb-card-time">{timeAgo(s.created_at)}</span>
                  <button
                    type="button"
                    className={votedIds.has(s.id) ? 'cb-upvote cb-upvote--voted' : 'cb-upvote'}
                    onClick={() => void upvote(s)}
                  >
                    <i className="ti ti-arrow-big-up" aria-hidden="true" /> {s.upvote_count}
                  </button>
                </article>
              ))}
            </div>
          ) : null}

          {memberTab === 'proposed' ? (
            <div className="cb-item-list">
              <p className="cb-muted">Upvote events you’d attend and downvote ones you wouldn’t — it helps admins gauge interest.</p>
              {proposedEvents.length === 0 ? <p className="cb-muted">No proposed events yet.</p> : null}
              {proposedEvents.map((e) => (
                <article key={e.id} className="cb-event-item">
                  <div>
                    <strong>{e.title}</strong>
                    <p>
                      {e.description ? `${e.description} · ` : ''}
                      {formatDate(e.event_date)}
                    </p>
                  </div>
                  <div className="cb-event-meta">{eventVoteRow(e)}</div>
                </article>
              ))}
            </div>
          ) : null}

          {memberTab === 'events' ? (
            <div className="cb-item-list">
              <p className="cb-muted">Rate past events you attended (1–5).</p>
              {pastEvents.length === 0 ? <p className="cb-muted">No past events yet.</p> : null}
              {pastEvents.map((e) => (
                <article key={e.id} className="cb-event-item">
                  <div>
                    <strong>{e.title}</strong>
                    <p>
                      {e.description ? `${e.description} · ` : ''}
                      {formatDate(e.event_date)}
                    </p>
                  </div>
                  <div className="cb-event-meta">{eventRating(e)}</div>
                </article>
              ))}
            </div>
          ) : null}

          {memberTab === 'updates' ? (
            <div className="cb-item-list">
              {updates.length === 0 ? <p className="cb-muted">No updates yet.</p> : null}
              {updates.map((u) => (
                <article key={`${u.kind}-${u.id}`} className="cb-update-item">
                  <div className="cb-feed-topline">
                    <strong>{u.body}</strong>
                    <span className={u.kind === 'announcement' ? 'cb-tag cb-tag--done' : 'cb-tag cb-tag--notice'}>
                      {u.kind === 'announcement' ? 'Announcement' : 'Post'}
                    </span>
                  </div>
                  {u.kind === 'announcement' && u.images.length > 0 ? (
                    <div className="cb-update-images">
                      {u.images.map((src) => (
                        <img key={src} className="cb-update-image" src={src} alt="" loading="lazy" />
                      ))}
                    </div>
                  ) : null}
                  <span className="cb-card-time">
                    {timeAgo(u.created_at)}
                    {u.kind === 'announcement' && u.edited_at ? ' · Edited' : ''}
                  </span>
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
                Suggestions{queue.length > 0 ? ` (${queue.length})` : ''}
              </button>
              <button type="button" className={adminTab === 'reports' ? 'cb-tab cb-tab--active' : 'cb-tab'} onClick={() => setAdminTab('reports')}>
                Reports{openIncidents.length > 0 ? ` (${openIncidents.length})` : ''}
              </button>
              <button type="button" className={adminTab === 'announcements' ? 'cb-tab cb-tab--active' : 'cb-tab'} onClick={() => setAdminTab('announcements')}>
                Announcements
              </button>
              <button type="button" className={adminTab === 'members' ? 'cb-tab cb-tab--active' : 'cb-tab'} onClick={() => setAdminTab('members')}>
                Members
              </button>
            </div>

            {adminPostMenu}
          </div>

          {isEventComposer || composer === 'announcement' || composer === 'post' ? composerCard : null}

          {adminTab === 'suggestions' ? (
            <>
              <h3 className="cb-comm-subhead">Moderation queue</h3>
              <div className="cb-item-list">
                {queue.length === 0 ? <p className="cb-muted">Nothing waiting for review.</p> : null}
                {queue.map((s) => (
                  <article key={s.id} className="cb-queue-item">
                    <div>
                      <div className="cb-feed-topline">
                        <strong>{s.body}</strong>
                        <span className="cb-tag cb-tag--progress">Pending</span>
                      </div>
                      <span className="cb-card-time">{timeAgo(s.created_at)}</span>
                    </div>
                    <div className="cb-action-row">
                      <button type="button" className="cb-button cb-button--primary" onClick={() => void moderate(s, 'approve')}>
                        Approve
                      </button>
                      <button type="button" className="cb-button cb-button--secondary" onClick={() => void moderate(s, 'reject')}>
                        Reject
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <h3 className="cb-comm-subhead">Approved — crowd-prioritised</h3>
              <div className="cb-item-list">
                {suggestions.length === 0 ? <p className="cb-muted">No approved suggestions yet.</p> : null}
                {suggestions.map((s) => (
                  <article key={s.id} className="cb-feed-item">
                    <div className="cb-feed-topline">
                      <strong>{s.body}</strong>
                      <span className="cb-pill cb-pill--gold">{s.upvote_count} votes</span>
                    </div>
                    <span className="cb-card-time">{timeAgo(s.created_at)}</span>
                  </article>
                ))}
              </div>
            </>
          ) : null}

          {adminTab === 'reports' ? (
            <>
              <div className="cb-comm-bar">
                <p className="cb-muted">Private problem reports — members never see these.</p>
                {tier === 'insights' ? (
                  <button type="button" className="cb-ai-btn" onClick={() => void runTriage()} disabled={clustersLoading}>
                    <i className="ti ti-sparkles" aria-hidden="true" />{' '}
                    {clustersLoading ? 'Clustering…' : 'AI triage: cluster reports'}
                  </button>
                ) : null}
              </div>

              {tier !== 'insights' ? (
                <div className="cb-ai-panel">
                  <div className="cb-ai-panel-head">
                    <i className="ti ti-sparkles" aria-hidden="true" />
                    <strong>AI triage is part of the Insights tier</strong>
                    <span className="cb-ai-tag">£29/month</span>
                  </div>
                  <p>
                    Insights clusters related reports, flags duplicates, and ranks them on the
                    Safety &gt; Facilities &gt; General ladder — a prioritised queue instead of a flat inbox.
                  </p>
                  <div className="cb-action-row">
                    <button type="button" className="cb-button cb-button--primary" onClick={() => void upgrade()} disabled={upgrading}>
                      {upgrading ? 'Upgrading…' : 'Upgrade to Insights (demo)'}
                    </button>
                  </div>
                  {clustersError ? <p className="cb-form-error">{clustersError}</p> : null}
                </div>
              ) : null}

              {clustersError && tier === 'insights' ? (
                <div className="cb-note" role="alert">
                  {clustersError}
                </div>
              ) : null}

              {clusters !== null && tier === 'insights' ? (
                <div className="cb-ai-panel">
                  <div className="cb-ai-panel-head">
                    <i className="ti ti-sparkles" aria-hidden="true" />
                    <strong>AI triage</strong>
                    <span className="cb-ai-tag">
                      {clusters.length} cluster{clusters.length === 1 ? '' : 's'} from {openIncidents.length} open reports
                    </span>
                  </div>
                  {clusters.length === 0 ? <p>No open reports to cluster.</p> : null}
                  {clusters.map((cluster) => (
                    <article key={cluster.clusterId} className="cb-feed-item">
                      <div className="cb-feed-topline">
                        <strong>{cluster.summary}</strong>
                        <span className={`cb-pill ${URGENCY_PILL[cluster.urgency]}`}>{cluster.urgency}</span>
                      </div>
                      <p className="cb-muted">
                        {cluster.reportIds.length} report{cluster.reportIds.length === 1 ? '' : 's'}:{' '}
                        {cluster.reportIds
                          .map((rid) => incidentById.get(rid)?.body ?? rid)
                          .map((body) => (body.length > 80 ? `${body.slice(0, 80)}…` : body))
                          .join(' · ')}
                      </p>
                    </article>
                  ))}
                </div>
              ) : null}

              <div className="cb-item-list">
                {incidents.length === 0 ? <p className="cb-muted">No reports yet.</p> : null}
                {incidents.map((r) => (
                  <article key={r.id} className={`cb-queue-item ${r.severity === 'RED' && r.status === 'open' ? 'cb-queue-item--urgent' : ''}`}>
                    <div>
                      <div className="cb-feed-topline">
                        <strong>{r.body}</strong>
                        <span className={`cb-pill ${SEVERITY_PILL[r.severity]}`}>{r.severity}</span>
                      </div>
                      <span className="cb-card-time">
                        {timeAgo(r.created_at)}
                        {r.status === 'resolved' && r.resolved_at ? ` · resolved ${timeAgo(r.resolved_at)}` : ''}
                      </span>
                    </div>
                    <div className="cb-action-row">
                      {r.status === 'open' ? (
                        <button type="button" className="cb-button cb-button--primary" onClick={() => void resolve(r)}>
                          Mark resolved
                        </button>
                      ) : (
                        <span className="cb-tag cb-tag--done">Resolved</span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : null}

          {adminTab === 'announcements' ? (
            <>
              <h3 className="cb-comm-subhead">Your announcements</h3>
              <p className="cb-muted">Announcements you’ve posted. Edit any of them — members see an “Edited” note.</p>
              <div className="cb-item-list">
                {myAnnouncements.length === 0 ? (
                  <p className="cb-muted">You haven’t posted any announcements yet.</p>
                ) : null}
                {myAnnouncements.map((a) => (
                  <article key={a.id} className="cb-queue-item">
                    <div>
                      <div className="cb-feed-topline">
                        <strong>{a.body}</strong>
                        {a.edited_at ? <span className="cb-tag cb-tag--notice">Edited</span> : null}
                      </div>
                      {a.images.length > 0 ? (
                        <div className="cb-update-images">
                          {a.images.map((src) => (
                            <img key={src} className="cb-update-image" src={src} alt="" loading="lazy" />
                          ))}
                        </div>
                      ) : null}
                      <span className="cb-card-time">{timeAgo(a.created_at)}</span>
                    </div>
                    <div className="cb-action-row">
                      <button type="button" className="cb-button cb-button--secondary" onClick={() => openAnnouncementEditor(a)}>
                        Edit
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : null}

          {adminTab === 'members' ? (
            <div className="cb-item-list">
              <p className="cb-muted">
                Share the join code <strong>{community.join_code}</strong> (plus the join password) to invite members.
                Admins can promote members; there is no demote.
              </p>
              {members.map((m) => (
                <article key={m.user_id} className="cb-queue-item">
                  <div>
                    <div className="cb-feed-topline">
                      <strong>{m.email}</strong>
                      <span className={`cb-role-pill cb-role-pill--${m.role}`}>{m.role === 'admin' ? 'Admin' : 'Member'}</span>
                    </div>
                    <span className="cb-card-time">Joined {timeAgo(m.joined_at)}</span>
                  </div>
                  {m.role === 'member' ? (
                    <div className="cb-action-row">
                      <button type="button" className="cb-button cb-button--secondary" onClick={() => void promote(m)}>
                        Make admin
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
