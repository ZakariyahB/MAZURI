import { Router } from 'express';
import { eventsController } from '../controllers/events.controller';
import { requireAdmin, requireMember } from '../middleware/membership.middleware';
import { asyncHandler } from '../utils/asyncHandler';

// Mounted at /api/communities/:communityId/events (membership pre-loaded).
// Admins create proposed/past events; members view, vote (proposed) and rate (past).
const router = Router({ mergeParams: true });

router.get('/', requireMember, asyncHandler(eventsController.list));
router.post('/', requireAdmin, asyncHandler(eventsController.create));
router.post('/:eventId/rate', requireMember, asyncHandler(eventsController.rate));
router.post('/:eventId/vote', requireMember, asyncHandler(eventsController.vote));

export default router;
