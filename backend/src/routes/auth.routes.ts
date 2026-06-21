import { Router } from 'express';
import { authController } from '../controllers/auth.controller';

// Auth routes (stubs). Mounted at /api/auth.
const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authController.me);

export default router;
