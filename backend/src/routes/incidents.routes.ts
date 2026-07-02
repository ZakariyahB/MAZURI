import { Router } from 'express';
import { incidentsController } from '../controllers/incidents.controller';
import { requireAdmin, requireMember } from '../middleware/membership.middleware';
import { asyncHandler } from '../utils/asyncHandler';

// Mounted at /api/communities/:communityId/incidents (membership pre-loaded).
// Members report; admins review the queue and resolve.
const router = Router({ mergeParams: true });

router.post('/', requireMember, asyncHandler(incidentsController.create));
router.get('/', requireAdmin, asyncHandler(incidentsController.list));
// Static path before /:incidentId routes so it isn't shadowed.
router.get('/clusters', requireAdmin, asyncHandler(incidentsController.clusters));
router.post('/:incidentId/resolve', requireAdmin, asyncHandler(incidentsController.resolve));

export default router;
