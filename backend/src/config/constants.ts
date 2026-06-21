/**
 * App-wide constants. Tunables live here so they're easy to change.
 */

// Leaderboard composite-score weights (must conceptually sum to 1.0).
// score = w_resolved * resolvedRatio
//       + w_events   * normalised(eventsHeld)
//       + w_rating   * (avgRating / 5)
//       + w_activity * normalised(suggestions)
export const LEADERBOARD_WEIGHTS = {
  resolved: 0.4,
  events: 0.2,
  rating: 0.2,
  activity: 0.2,
} as const;

// Rolling window (days) over which leaderboard metrics are computed.
export const LEADERBOARD_WINDOW_DAYS = 30;

// bcrypt cost factor for password + community-join-password hashing.
export const BCRYPT_SALT_ROUNDS = 10;

// Incident severity ladder (urgency): Safety(RED) > Facilities(AMBER) > General(GREEN).
export const SEVERITIES = ['RED', 'AMBER', 'GREEN'] as const;
export type Severity = (typeof SEVERITIES)[number];

// Per-community roles. Two only — permissions differ by role.
export const ROLES = ['admin', 'member'] as const;
export type Role = (typeof ROLES)[number];

export const SUGGESTION_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type SuggestionStatus = (typeof SUGGESTION_STATUSES)[number];

export const INCIDENT_STATUSES = ['open', 'resolved'] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export const EVENT_STATUSES = ['potential', 'confirmed'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];
