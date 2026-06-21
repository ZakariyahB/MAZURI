import { Router } from 'express';
import { announcementsController } from '../controllers/announcements.controller';

// Announcement routes (stubs). Mounted at /api/announcements.
const router = Router();

router.get('/', announcementsController.list);
router.post('/', announcementsController.create);

export default router;
