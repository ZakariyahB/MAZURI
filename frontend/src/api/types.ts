// Shapes returned by the Community Bridge API (snake_case, matching the DB).

export type Role = 'admin' | 'member';
export type Severity = 'RED' | 'AMBER' | 'GREEN';
export type SuggestionStatus = 'pending' | 'approved' | 'rejected';
export type IncidentStatus = 'open' | 'resolved';
export type EventStatus = 'potential' | 'confirmed';

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Community {
  id: string;
  name: string;
  join_code: string;
  created_at: string;
}

export interface CommunityWithRole extends Community {
  role: Role;
  joined_at: string;
}

export interface CommunityMember {
  user_id: string;
  email: string;
  role: Role;
  joined_at: string;
}

export interface Suggestion {
  id: string;
  community_id: string;
  author_id: string;
  body: string;
  upvote_count: number;
  status: SuggestionStatus;
  created_at: string;
}

export interface Incident {
  id: string;
  community_id: string;
  reporter_id: string;
  body: string;
  severity: Severity;
  status: IncidentStatus;
  created_at: string;
  resolved_at: string | null;
}

export interface EventItem {
  id: string;
  community_id: string;
  title: string;
  description: string;
  event_date: string;
  status: EventStatus;
  created_at: string;
}

export interface Announcement {
  id: string;
  community_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export interface Post {
  id: string;
  community_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export interface LeaderboardEntry {
  communityId: string;
  name: string;
  score: number;
  metrics: {
    incidentsReported: number;
    incidentsResolved: number;
    resolvedRatio: number;
    eventsHeld: number;
    avgRating: number;
    suggestions: number;
  };
  components: {
    resolved: number;
    events: number;
    rating: number;
    activity: number;
  };
}

export interface AuthResult {
  token: string;
  user: User;
}
