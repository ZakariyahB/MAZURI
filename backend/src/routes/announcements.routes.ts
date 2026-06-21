import { Router } from 'express';
import { announcementsController } from '../controllers/announcements.controller';
import { requireAdmin, requireMember } from '../middleware/membership.middleware';
import { asyncHandler } from '../utils/asyncHandler';

// Mounted at /api/communities/:communityId/announcements (membership pre-loaded).
// Admins post; members view.
const router = Router({ mergeParams: true });

router.get('/', requireMember, asyncHandler(announcementsController.list));
router.post('/', requireAdmin, asyncHandler(announcementsController.create));

export default router;
