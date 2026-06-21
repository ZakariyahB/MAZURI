import type {
  Announcement,
  AuthResult,
  Community,
  CommunityMember,
  CommunityWithRole,
  EventItem,
  Incident,
  LeaderboardEntry,
  Post,
  Role,
  Severity,
  Suggestion,
  User,
} from './types';

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

  listEvents(id: string): Promise<EventItem[]>;
  createEvent(
    id: string,
    input: { title: string; description: string; event_date: string },
  ): Promise<EventItem>;
  rateEvent(id: string, eventId: string, rating: number): Promise<void>;

  listAnnouncements(id: string): Promise<Announcement[]>;
  createAnnouncement(id: string, body: string): Promise<Announcement>;

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
    const data: unknown = text ? JSON.parse(text) : null;

    if (!res.ok) {
      const message =
        (data as { error?: string } | null)?.error ?? `Request failed (${res.status})`;
      throw new Error(message);
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

    listEvents: (id) =>
      request<{ events: EventItem[] }>('GET', `${c(id)}/events`).then((r) => r.events),
    createEvent: (id, input) =>
      request<{ event: EventItem }>('POST', `${c(id)}/events`, input).then((r) => r.event),
    rateEvent: (id, eventId, rating) =>
      request<unknown>('POST', `${c(id)}/events/${eventId}/rate`, { rating }).then(
        () => undefined,
      ),

    listAnnouncements: (id) =>
      request<{ announcements: Announcement[] }>('GET', `${c(id)}/announcements`).then(
        (r) => r.announcements,
      ),
    createAnnouncement: (id, body) =>
      request<{ announcement: Announcement }>('POST', `${c(id)}/announcements`, { body }).then(
        (r) => r.announcement,
      ),

    listPosts: (id) => request<{ posts: Post[] }>('GET', `${c(id)}/posts`).then((r) => r.posts),
    createPost: (id, body) =>
      request<{ post: Post }>('POST', `${c(id)}/posts`, { body }).then((r) => r.post),
  };
}
