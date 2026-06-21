import type { CorsOptions } from 'cors';
import { env } from './env';

/**
 * CORS configuration for a token-based API.
 *
 * The API authenticates with JWT bearer tokens (Authorization header), NOT
 * session cookies — cookies don't survive third-party embeds. So `credentials`
 * is intentionally false and we whitelist origins from CORS_ALLOWED_ORIGINS.
 *
 * When the embeddable widget ships, every host community's domain that embeds it
 * must appear in CORS_ALLOWED_ORIGINS (or this becomes a per-org allowlist).
 */
export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Allow non-browser clients (no Origin header) and whitelisted origins.
    if (!origin || env.corsAllowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
};
