import { Router } from 'express';
import communitiesRoutes from './communities.routes';

// Aggregates authenticated feature routes. Mounted under /api behind requireAuth.
const router = Router();

router.use('/communities', communitiesRoutes);

export default router;
