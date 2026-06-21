import { Router } from 'express';
import { communitiesController } from '../controllers/communities.controller';
import { membershipsController } from '../controllers/memberships.controller';
import { loadMembership, requireAdmin, requireMember } from '../middleware/membership.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import suggestionsRoutes from './suggestions.routes';
import incidentsRoutes from './incidents.routes';
import eventsRoutes from './events.routes';
import announcementsRoutes from './announcements.routes';
import postsRoutes from './posts.routes';

// Mounted at /api/communities (behind requireAuth).
const router = Router();

// Collection + non-:id routes first so they aren't shadowed by /:communityId.
router.post('/', asyncHandler(communitiesController.create));
router.post('/join', asyncHandler(communitiesController.join));
router.get('/mine', asyncHandler(communitiesController.listMine));
router.get('/leaderboard', asyncHandler(communitiesController.leaderboard));

// Single community (member) + membership management (admin).
router.get('/:communityId', loadMembership, requireMember, asyncHandler(communitiesController.get));
router.get(
  '/:communityId/members',
  loadMembership,
  requireAdmin,
  asyncHandler(membershipsController.list),
);
router.post(
  '/:communityId/admins',
  loadMembership,
  requireAdmin,
  asyncHandler(membershipsController.promote),
);

// Community-scoped resources. loadMembership runs once per mount; the sub-router
// applies requireMember / requireAdmin per route.
router.use('/:communityId/suggestions', loadMembership, suggestionsRoutes);
router.use('/:communityId/incidents', loadMembership, incidentsRoutes);
router.use('/:communityId/events', loadMembership, eventsRoutes);
router.use('/:communityId/announcements', loadMembership, announcementsRoutes);
router.use('/:communityId/posts', loadMembership, postsRoutes);

export default router;
