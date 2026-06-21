import { Router } from 'express';
import { postsController } from '../controllers/posts.controller';
import { requireAdmin, requireMember } from '../middleware/membership.middleware';
import { asyncHandler } from '../utils/asyncHandler';

// Mounted at /api/communities/:communityId/posts (membership pre-loaded).
// Admins post; members view.
const router = Router({ mergeParams: true });

router.get('/', requireMember, asyncHandler(postsController.list));
router.post('/', requireAdmin, asyncHandler(postsController.create));

export default router;
