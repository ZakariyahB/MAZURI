import { Router } from 'express';
import { reportsController } from '../controllers/reports.controller';

// Report routes (stubs). Mounted at /api/reports.
const router = Router();

router.get('/', reportsController.list);
router.post('/', reportsController.create);

export default router;
