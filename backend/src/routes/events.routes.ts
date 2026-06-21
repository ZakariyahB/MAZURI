import { Router } from 'express';
import { eventsController } from '../controllers/events.controller';

// Event proposal routes (stubs). Mounted at /api/events.
const router = Router();

router.get('/', eventsController.list);
router.post('/', eventsController.create);
router.post('/:eventId/vote', eventsController.vote);

export default router;
