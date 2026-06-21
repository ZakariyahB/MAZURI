import { Router } from 'express';
import { orgsController } from '../controllers/orgs.controller';

// Org (tenant) routes (stubs). Mounted at /api/orgs.
const router = Router();

router.get('/', orgsController.list);
router.post('/', orgsController.create);
router.get('/:orgId', orgsController.get);

export default router;
