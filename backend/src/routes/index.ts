import { Router } from 'express';
import authRoutes from './auth.routes';
import orgsRoutes from './orgs.routes';
import suggestionsRoutes from './suggestions.routes';
import reportsRoutes from './reports.routes';
import eventsRoutes from './events.routes';
import announcementsRoutes from './announcements.routes';

// Aggregates all feature routers. Mounted under /api by the app entry, behind
// JWT auth + tenant scoping.
const router = Router();

router.use('/auth', authRoutes);
router.use('/orgs', orgsRoutes);
router.use('/suggestions', suggestionsRoutes);
router.use('/reports', reportsRoutes);
router.use('/events', eventsRoutes);
router.use('/announcements', announcementsRoutes);

export default router;
