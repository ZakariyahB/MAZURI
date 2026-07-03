import { Router } from 'express';
import multer from 'multer';
import { uploadsController } from '../controllers/uploads.controller';
import { requireAdmin } from '../middleware/membership.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { MAX_IMAGE_BYTES } from '../services/storage.service';

// Mounted at /api/communities/:communityId/uploads (membership pre-loaded).
// Admins upload media (announcement images) and receive a public URL back.
const router = Router({ mergeParams: true });

// In-memory storage: the buffer is streamed straight to Supabase, never to disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
});

router.post('/image', requireAdmin, upload.single('image'), asyncHandler(uploadsController.image));

export default router;
