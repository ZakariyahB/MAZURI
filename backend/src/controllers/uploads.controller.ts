import type { Request, Response } from 'express';
import { isStorageConfigured, uploadImage } from '../services/storage.service';
import { AppError, badRequest } from '../utils/errors';

export const uploadsController = {
  /**
   * Admin uploads a single image (multipart field `image`) and gets back a
   * public URL to attach to an announcement. Kept separate from announcement
   * creation so the same endpoint can serve other media later (and so composing
   * an announcement stays plain JSON).
   */
  async image(req: Request, res: Response): Promise<void> {
    if (!isStorageConfigured()) {
      throw new AppError(503, 'Image storage is not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }
    const file = req.file;
    if (!file) throw badRequest('No image file provided (multipart field "image")');

    const url = await uploadImage(req.params.communityId, file.buffer, file.mimetype);
    res.status(201).json({ url });
  },
};
