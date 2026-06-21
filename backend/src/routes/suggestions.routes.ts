import { Router } from 'express';
import { suggestionsController } from '../controllers/suggestions.controller';
import { requireAdmin, requireMember } from '../middleware/membership.middleware';
import { asyncHandler } from '../utils/asyncHandler';

// Mounted at /api/communities/:communityId/suggestions (membership pre-loaded).
const router = Router({ mergeParams: true });

router.get('/', requireMember, asyncHandler(suggestionsController.list));
router.get('/queue', requireAdmin, asyncHandler(suggestionsController.queue));
router.post('/', requireMember, asyncHandler(suggestionsController.create));
router.post('/:suggestionId/upvote', requireMember, asyncHandler(suggestionsController.upvote));
router.post('/:suggestionId/moderate', requireAdmin, asyncHandler(suggestionsController.moderate));

export default router;
