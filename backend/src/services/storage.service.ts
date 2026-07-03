/**
 * Media storage service — uploads announcement images to Supabase Storage.
 *
 * The backend uploads using the Supabase SERVICE ROLE key so the browser never
 * sees a storage credential. Only the resulting public URL is persisted (see the
 * `announcement_images` table). The bucket is expected to be PUBLIC so the feed
 * can render images by URL without signing every request.
 *
 * Keeping this behind a small interface means the storage provider can be
 * swapped later without touching controllers.
 */
import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import { AppError, badRequest } from '../utils/errors';

// Image types we accept for uploads, mapped to a file extension for the object key.
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

// Max upload size (bytes). Enforced here and by multer's limits.
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

let client: SupabaseClient | null = null;

/** True when Supabase Storage is configured (URL + service role key present). */
export function isStorageConfigured(): boolean {
  return env.supabaseUrl !== '' && env.supabaseServiceRoleKey !== '';
}

/** Lazily builds (and caches) the Supabase client from env config. */
function getClient(): SupabaseClient {
  if (!isStorageConfigured()) {
    throw new AppError(503, 'Image storage is not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }
  if (!client) {
    client = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });
  }
  return client;
}

/**
 * Uploads one image and returns its public URL. Objects are namespaced by
 * community so a bucket can be reasoned about (and cleaned up) per org.
 */
export async function uploadImage(
  communityId: string,
  buffer: Buffer,
  mimetype: string,
): Promise<string> {
  const ext = ALLOWED_IMAGE_TYPES[mimetype];
  if (!ext) {
    throw badRequest('Unsupported image type — use JPEG, PNG, WebP or GIF');
  }
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw badRequest('Image is too large — 5 MB maximum');
  }

  const supabase = getClient();
  const objectPath = `${communityId}/${randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(env.supabaseStorageBucket)
    .upload(objectPath, buffer, { contentType: mimetype, upsert: false });

  if (error) {
    throw new AppError(502, `Image upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(env.supabaseStorageBucket).getPublicUrl(objectPath);
  return data.publicUrl;
}
