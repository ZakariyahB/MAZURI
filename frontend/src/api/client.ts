import type {
  Announcement,
  AuthResult,
  Community,
  CommunityAnalytics,
  CommunityMember,
  CommunityWithRole,
  EventItem,
  Incident,
  LeaderboardEntry,
  Post,
  ReportCluster,
  EventKind,
  Role,
  Severity,
  Suggestion,
  Tier,
  User,
} from './types';

/** API failure carrying the HTTP status, so the UI can branch (402 upgrade, 409 duplicate vote…). */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * API client. Token-based (JWT bearer) with a configurable base URL, so the
 * same client works on the standalone page and (later) inside an embed on
 * another domain. No cookies — auth travels in the Authorization header.
 */
export interface ApiClient {
  setToken(token: string | null): void;

  signup(email: string, password: string): Promise<AuthResult>;
  login(email: string, password: string): Promise<AuthResult>;
  me(): Promise<User>;

  listMyCommunities(): Promise<CommunityWithRole[]>;
  createCommunity(input: {
    name: string;
    join_code: string;
    join_password: string;
  }): Promise<{ community: Community; role: Role }>;
  joinCommunity(
    join_code: string,
    join_password: string,
  ): Promise<{ community: Community; role: Role }>;
  getCommunity(id: string): Promise<{ community: Community; role: Role }>;
  leaderboard(): Promise<LeaderboardEntry[]>;
  listMembers(id: string): Promise<CommunityMember[]>;
  promoteToAdmin(id: string, userId: string): Promise<void>;
  getAnalytics(id: string): Promise<CommunityAnalytics>;
  setSubscription(id: string, tier: Tier): Promise<{ community: Community; role: Role }>;

  listSuggestions(id: string): Promise<Suggestion[]>;
  listSuggestionQueue(id: string): Promise<Suggestion[]>;
  createSuggestion(id: string, body: string): Promise<Suggestion>;
  upvoteSuggestion(id: string, suggestionId: string): Promise<Suggestion>;
  moderateSuggestion(
    id: string,
    suggestionId: string,
    decision: 'approve' | 'reject',
  ): Promise<Suggestion>;

  createIncident(id: string, body: string, severity: Severity): Promise<Incident>;
  listIncidents(id: string): Promise<Incident[]>;
  resolveIncident(id: string, incidentId: string): Promise<Incident>;
  getReportClusters(id: string): Promise<ReportCluster[]>;

  listEvents(id: string): Promise<EventItem[]>;
  createEvent(
    id: string,
    input: { title: string; description: string; event_date: string; kind: EventKind },
  ): Promise<EventItem>;
  rateEvent(id: string, eventId: string, rating: number): Promise<void>;
  voteEvent(id: string, eventId: string, direction: 'up' | 'down'): Promise<EventItem>;

  listAnnouncements(id: string): Promise<Announcement[]>;
  listMyAnnouncements(id: string): Promise<Announcement[]>;
  createAnnouncement(id: string, body: string, imageUrls?: string[]): Promise<Announcement>;
  updateAnnouncement(
    id: string,
    announcementId: string,
    body: string,
    imageUrls?: string[],
  ): Promise<Announcement>;
  /** Uploads an image and returns its public URL (admin only). */
  uploadImage(id: string, file: File): Promise<string>;

  listPosts(id: string): Promise<Post[]>;
  createPost(id: string, body: string): Promise<Post>;
}

export function createApiClient(baseUrl: string): ApiClient {
  let token: string | null = null;

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const text = await res.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      if (!res.ok) throw new ApiError(res.status, `Request failed (${res.status})`);
      throw new ApiError(500, 'Server returned invalid JSON');
    }

    if (!res.ok) {
      const message =
        (data as { error?: string } | null)?.error ?? `Request failed (${res.status})`;
      throw new ApiError(res.status, message);
    }
    return data as T;
  }

  // Multipart upload — do NOT set Content-Type; the browser adds the multipart
  // boundary itself. Auth still travels in the Authorization header.
  async function upload<T>(path: string, form: FormData): Promise<T> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${baseUrl}${path}`, { method: 'POST', headers, body: form });
    const text = await res.text();
    let data: unknown = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      if (!res.ok) throw new ApiError(res.status, `Request failed (${res.status})`);
      throw new ApiError(500, 'Server returned invalid JSON');
    }
    if (!res.ok) {
      const message =
        (data as { error?: string } | null)?.error ?? `Request failed (${res.status})`;
      throw new ApiError(res.status, message);
    }
    return data as T;
  }

  const c = (id: string) => `/api/communities/${id}`;

  return {
    setToken(next) {
      token = next;
    },

    signup: (email, password) =>
      request<AuthResult>('POST', '/api/auth/signup', { email, password }),
    login: (email, password) => request<AuthResult>('POST', '/api/auth/login', { email, password }),
    me: () => request<{ user: User }>('GET', '/api/auth/me').then((r) => r.user),

    listMyCommunities: () =>
      request<{ communities: CommunityWithRole[] }>('GET', '/api/communities/mine').then(
        (r) => r.communities,
      ),
    createCommunity: (input) =>
      request<{ community: Community; role: Role }>('POST', '/api/communities', input),
    joinCommunity: (join_code, join_password) =>
      request<{ community: Community; role: Role }>('POST', '/api/communities/join', {
        join_code,
        join_password,
      }),
    getCommunity: (id) =>
      request<{ community: Community; role: Role }>('GET', `/api/communities/${id}`),
    leaderboard: () =>
      request<{ leaderboard: LeaderboardEntry[] }>('GET', '/api/communities/leaderboard').then(
        (r) => r.leaderboard,
      ),
    listMembers: (id) =>
      request<{ members: CommunityMember[] }>('GET', `${c(id)}/members`).then((r) => r.members),
    promoteToAdmin: (id, userId) =>
      request<unknown>('POST', `${c(id)}/admins`, { user_id: userId }).then(() => undefined),
    getAnalytics: (id) =>
      request<{ analytics: CommunityAnalytics }>('GET', `${c(id)}/analytics`).then(
        (r) => r.analytics,
      ),
    setSubscription: (id, tier) =>
      request<{ community: Community; role: Role }>('POST', `${c(id)}/subscription`, { tier }),

    listSuggestions: (id) =>
      request<{ suggestions: Suggestion[] }>('GET', `${c(id)}/suggestions`).then(
        (r) => r.suggestions,
      ),
    listSuggestionQueue: (id) =>
      request<{ suggestions: Suggestion[] }>('GET', `${c(id)}/suggestions/queue`).then(
        (r) => r.suggestions,
      ),
    createSuggestion: (id, body) =>
      request<{ suggestion: Suggestion }>('POST', `${c(id)}/suggestions`, { body }).then(
        (r) => r.suggestion,
      ),
    upvoteSuggestion: (id, suggestionId) =>
      request<{ suggestion: Suggestion }>(
        'POST',
        `${c(id)}/suggestions/${suggestionId}/upvote`,
      ).then((r) => r.suggestion),
    moderateSuggestion: (id, suggestionId, decision) =>
      request<{ suggestion: Suggestion }>('POST', `${c(id)}/suggestions/${suggestionId}/moderate`, {
        decision,
      }).then((r) => r.suggestion),

    createIncident: (id, body, severity) =>
      request<{ incident: Incident }>('POST', `${c(id)}/incidents`, { body, severity }).then(
        (r) => r.incident,
      ),
    listIncidents: (id) =>
      request<{ incidents: Incident[] }>('GET', `${c(id)}/incidents`).then((r) => r.incidents),
    resolveIncident: (id, incidentId) =>
      request<{ incident: Incident }>('POST', `${c(id)}/incidents/${incidentId}/resolve`).then(
        (r) => r.incident,
      ),
    getReportClusters: (id) =>
      request<{ clusters: ReportCluster[] }>('GET', `${c(id)}/incidents/clusters`).then(
        (r) => r.clusters,
      ),

    listEvents: (id) =>
      request<{ events: EventItem[] }>('GET', `${c(id)}/events`).then((r) => r.events),
    createEvent: (id, input) =>
      request<{ event: EventItem }>('POST', `${c(id)}/events`, input).then((r) => r.event),
    rateEvent: (id, eventId, rating) =>
      request<unknown>('POST', `${c(id)}/events/${eventId}/rate`, { rating }).then(
        () => undefined,
      ),
    voteEvent: (id, eventId, direction) =>
      request<{ event: EventItem }>('POST', `${c(id)}/events/${eventId}/vote`, { direction }).then(
        (r) => r.event,
      ),

    listAnnouncements: (id) =>
      request<{ announcements: Announcement[] }>('GET', `${c(id)}/announcements`).then(
        (r) => r.announcements,
      ),
    listMyAnnouncements: (id) =>
      request<{ announcements: Announcement[] }>('GET', `${c(id)}/announcements/mine`).then(
        (r) => r.announcements,
      ),
    createAnnouncement: (id, body, imageUrls) =>
      request<{ announcement: Announcement }>('POST', `${c(id)}/announcements`, {
        body,
        image_urls: imageUrls,
      }).then((r) => r.announcement),
    updateAnnouncement: (id, announcementId, body, imageUrls) =>
      request<{ announcement: Announcement }>(
        'PUT',
        `${c(id)}/announcements/${announcementId}`,
        { body, image_urls: imageUrls },
      ).then((r) => r.announcement),
    uploadImage: (id, file) => {
      const form = new FormData();
      form.append('image', file);
      return upload<{ url: string }>(`${c(id)}/uploads/image`, form).then((r) => r.url);
    },

    listPosts: (id) => request<{ posts: Post[] }>('GET', `${c(id)}/posts`).then((r) => r.posts),
    createPost: (id, body) =>
      request<{ post: Post }>('POST', `${c(id)}/posts`, { body }).then((r) => r.post),
  };
}
