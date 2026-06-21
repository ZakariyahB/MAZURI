import dotenv from 'dotenv';

// Load .env (no-op in production where env is injected by the platform).
dotenv.config();

/**
 * Reads an env var, falling back to a default. Throws only if no value and no
 * default — keeps the scaffold booting cleanly in dev while still surfacing
 * genuinely missing required config.
 */
function read(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',

  // Container always listens on 4000 internally; host port is mapped in compose.
  port: Number(process.env.PORT ?? 4000),

  // PostgreSQL (+ pgvector). Host is `postgres` inside compose, `localhost` when
  // running the backend directly.
  databaseUrl: read(
    'DATABASE_URL',
    'postgres://postgres:postgres@localhost:5432/community_bridge',
  ),

  // Auth is token-based (JWT bearer), not session cookies — cookies break inside
  // third-party embeds.
  jwtSecret: read('JWT_SECRET', 'dev-insecure-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',

  // Comma-separated origins allowed to call the API. Critical for the embed
  // model: each host community's domain must be allowed here. See config/cors.ts.
  corsAllowedOrigins: (process.env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  // Placeholder for the embeddings/LLM provider key used by report clustering.
  aiApiKey: process.env.AI_API_KEY ?? '',
} as const;

export type Env = typeof env;
