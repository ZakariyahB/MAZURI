import express from 'express';
import cors from 'cors';

import { env } from './config/env';
import { corsOptions } from './config/cors';
import { runMigrations } from './db/migrate';
import authRoutes from './routes/auth.routes';
import apiRoutes from './routes';
import { requireAuth } from './middleware/auth.middleware';
import { errorHandler, notFound } from './middleware/error.middleware';

const app = express();

// CORS first so preflight is handled before anything else. Token-based API
// (JWT bearer), allowed origins come from CORS_ALLOWED_ORIGINS.
app.use(cors(corsOptions));
app.use(express.json());

// Health check — public.
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Auth (signup/login public; /me guarded inside the router).
app.use('/api/auth', authRoutes);

// All other feature routes require a valid JWT. Per-community role checks happen
// inside the routers via the membership middleware.
app.use('/api', requireAuth, apiRoutes);

// 404 + central error handler must come last.
app.use(notFound);
app.use(errorHandler);

async function bootstrap(): Promise<void> {
  try {
    await runMigrations();
    console.log('Database schema ready.');
  } catch (err) {
    console.error('Migration failed (continuing to listen):', err);
  }

  app.listen(env.port, () => {
    console.log(`Community Bridge API listening on http://localhost:${env.port}`);
  });
}

void bootstrap();

export { app };
