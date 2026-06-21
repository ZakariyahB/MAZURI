import express from 'express';
import cors from 'cors';

import { env } from './config/env';
import { corsOptions } from './config/cors';
import routes from './routes';
import { requireAuth } from './middleware/auth.middleware';
import { resolveTenant } from './middleware/tenant.middleware';
import { errorHandler, notFound } from './middleware/error.middleware';

const app = express();

// CORS first so preflight is handled before anything else. Token-based API
// (JWT bearer), allowed origins come from CORS_ALLOWED_ORIGINS.
app.use(cors(corsOptions));
app.use(express.json());

// Health check — the only real endpoint in this scaffold. Kept public.
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// All feature routes require a valid JWT and run inside a resolved tenant scope.
// (Handlers are stubs for now — see src/routes.)
app.use('/api', requireAuth, resolveTenant, routes);

// 404 + central error handler must come last.
app.use(notFound);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Community Bridge API listening on http://localhost:${env.port}`);
});

export { app };
