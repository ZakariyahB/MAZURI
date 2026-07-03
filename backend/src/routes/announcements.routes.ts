import { Router } from 'express';
import { announcementsController } from '../controllers/announcements.controller';
import { requireAdmin, requireMember } from '../middleware/membership.middleware';
import { asyncHandler } from '../utils/asyncHandler';

// Mounted at /api/communities/:communityId/announcements (membership pre-loaded).
// Admins post/edit their own; members view.
const router = Router({ mergeParams: true });

router.get('/', requireMember, asyncHandler(announcementsController.list));
// Admin's own announcements (before /:announcementId so it isn't shadowed).
router.get('/mine', requireAdmin, asyncHandler(announcementsController.listMine));
router.post('/', requireAdmin, asyncHandler(announcementsController.create));
router.put('/:announcementId', requireAdmin, asyncHandler(announcementsController.update));

export default router;
