import { Router } from 'express';
import { eventsController } from '../controllers/events.controller';
import { requireAdmin, requireMember } from '../middleware/membership.middleware';
import { asyncHandler } from '../utils/asyncHandler';

// Mounted at /api/communities/:communityId/events (membership pre-loaded).
// Admins post events; members view and rate.
const router = Router({ mergeParams: true });

router.get('/', requireMember, asyncHandler(eventsController.list));
router.post('/', requireAdmin, asyncHandler(eventsController.create));
router.post('/:eventId/rate', requireMember, asyncHandler(eventsController.rate));

export default router;
