import { createClient } from '@/lib/supabase/client';

const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

/**
 * Validates file size (< 5MB), center-crops to a square (1:1),
 * resizes to max 800x800, and converts to WebP with 0.80 quality.
 */
export async function processRecipeImage(file: File): Promise<Blob> {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Choose an image under 5 MB');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const minSide = Math.min(img.width, img.height);
          const TARGET_MAX = 800;
          const outputSize = Math.min(minSide, TARGET_MAX);

          canvas.width = outputSize;
          canvas.height = outputSize;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          // Calculate center crop offsets
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, outputSize, outputSize);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to convert image to WebP'));
              }
            },
            'image/webp',
            0.8
          );
        } catch (err) {
          reject(err);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Generates and caches a signed URL for a recipe photo path from Supabase storage (valid 1 hour).
 */
export async function getRecipePhotoSignedUrl(photoPath: string): Promise<string | null> {
  if (!photoPath) return null;

  const cached = signedUrlCache.get(photoPath);
  const now = Date.now();
  // Return cached URL if it has at least 5 minutes before expiry
  if (cached && cached.expiresAt > now + 5 * 60 * 1000) {
    return cached.url;
  }

  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from('recipe-photos')
    .createSignedUrl(photoPath, 3600);

  if (error || !data?.signedUrl) {
    console.error('Failed to get signed URL for recipe photo:', error);
    return null;
  }

  signedUrlCache.set(photoPath, {
    url: data.signedUrl,
    expiresAt: now + 3600 * 1000,
  });

  return data.signedUrl;
}

/**
 * Invalidate cache entry when a photo is updated or removed.
 */
export function invalidatePhotoCache(photoPath?: string) {
  if (photoPath) {
    signedUrlCache.delete(photoPath);
  }
}
