'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChefHat, Camera, Pencil, Trash2, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { processRecipeImage, getRecipePhotoSignedUrl, invalidatePhotoCache } from '@/lib/image-utils';
import { useToast } from '@/components/Toast';

interface ProductTileProps {
  photoPath?: string | null;
  name: string;
  size?: 'sm' | 'lg';
  recipeId?: string;
  bakeryId?: string;
  editable?: boolean;
  onPhotoUpdated?: (newPhotoPath: string | null) => void;
  className?: string;
}

export default function ProductTile({
  photoPath,
  name,
  size = 'sm',
  recipeId,
  bakeryId,
  editable = false,
  onPhotoUpdated,
  className = '',
}: ProductTileProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const takePhotoInputRef = useRef<HTMLInputElement>(null);
  const choosePhotoInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const dimensionClass = size === 'lg' ? 'w-16 h-16 min-w-16 min-h-16' : 'w-[52px] h-[52px] min-w-[52px] min-h-[52px]';
  const iconSize = size === 'lg' ? 28 : 22;

  useEffect(() => {
    let isMounted = true;
    if (photoPath) {
      setLoadingUrl(true);
      setImageError(false);
      getRecipePhotoSignedUrl(photoPath).then((url) => {
        if (isMounted) {
          setSignedUrl(url);
          setLoadingUrl(false);
        }
      });
    } else {
      setSignedUrl(null);
      setLoadingUrl(false);
    }
    return () => {
      isMounted = false;
    };
  }, [photoPath]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!recipeId || !bakeryId) {
      addToast('Save recipe first before adding a photo', 'error');
      setShowSheet(false);
      return;
    }

    setUploading(true);
    try {
      const webpBlob = await processRecipeImage(file);
      const storagePath = `${bakeryId}/${recipeId}.webp`;
      const supabase = createClient();

      const { error: uploadError } = await supabase.storage
        .from('recipe-photos')
        .upload(storagePath, webpBlob, {
          contentType: 'image/webp',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('recipes')
        .update({ photo_path: storagePath })
        .eq('id', recipeId);

      if (dbError) throw dbError;

      invalidatePhotoCache(storagePath);
      const newUrl = await getRecipePhotoSignedUrl(storagePath);
      setSignedUrl(newUrl);
      setImageError(false);
      onPhotoUpdated?.(storagePath);
      addToast('Recipe photo updated!', 'success');
      setShowSheet(false);
    } catch (err: any) {
      console.error('Error uploading photo:', err);
      addToast(err.message || 'Failed to upload photo', 'error');
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    if (!recipeId || !bakeryId || !photoPath) return;

    setUploading(true);
    try {
      const supabase = createClient();
      await supabase.storage.from('recipe-photos').remove([photoPath]);
      await supabase.from('recipes').update({ photo_path: null }).eq('id', recipeId);

      invalidatePhotoCache(photoPath);
      setSignedUrl(null);
      onPhotoUpdated?.(null);
      addToast('Recipe photo removed', 'success');
      setShowSheet(false);
    } catch (err: any) {
      console.error('Error removing photo:', err);
      addToast('Failed to remove photo', 'error');
    } finally {
      setUploading(false);
    }
  };

  const hasPhoto = Boolean(photoPath && signedUrl && !imageError);

  return (
    <div className={`relative inline-block select-none ${className}`}>
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={takePhotoInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        type="file"
        ref={choosePhotoInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Main Square Tile */}
      <div
        className={`${dimensionClass} rounded-xl overflow-hidden flex items-center justify-center transition-all ${
          hasPhoto ? 'bg-sand-200' : 'bg-[#C68A4C]'
        }`}
        style={{ borderRadius: '12px' }}
      >
        {hasPhoto ? (
          <img
            src={signedUrl!}
            alt={name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <ChefHat size={iconSize} color="#FFFFFF" strokeWidth={2.2} />
        )}
      </div>

      {/* 24px Corner Action Badge */}
      {editable && (
        <button
          type="button"
          onClick={() => setShowSheet(true)}
          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border-2 border-white text-white flex items-center justify-center shadow-md hover:bg-slate-800 transition-transform active:scale-95 cursor-pointer z-10"
          title={hasPhoto ? 'Edit recipe photo' : 'Add recipe photo'}
        >
          {uploading ? (
            <Loader2 size={11} className="animate-spin" />
          ) : hasPhoto ? (
            <Pencil size={11} />
          ) : (
            <Camera size={11} />
          )}
        </button>
      )}

      {/* Photo Actions Bottom Sheet / Modal */}
      {showSheet && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && !uploading && setShowSheet(false)}
        >
          <div className="modal-sheet" style={{ maxWidth: '380px' }}>
            <div className="modal-handle" />

            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-900">Recipe Photo</h3>
              <button
                type="button"
                className="btn btn-ghost btn-sm p-1 text-slate-400 hover:text-slate-900"
                onClick={() => setShowSheet(false)}
                disabled={uploading}
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => takePhotoInputRef.current?.click()}
                disabled={uploading}
                className="btn btn-secondary btn-full justify-start py-3 px-4 text-slate-900 font-medium"
              >
                <Camera size={18} className="text-[#C68A4C]" /> Take Photo
              </button>

              <button
                type="button"
                onClick={() => choosePhotoInputRef.current?.click()}
                disabled={uploading}
                className="btn btn-secondary btn-full justify-start py-3 px-4 text-slate-900 font-medium"
              >
                <ImageIcon size={18} className="text-[#C68A4C]" /> Choose from Library
              </button>

              {hasPhoto && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={uploading}
                  className="btn btn-danger btn-full justify-start py-3 px-4 font-medium"
                >
                  <Trash2 size={18} /> Remove Photo
                </button>
              )}

              <p className="text-xs text-slate-400 text-center mt-2">
                Images are square-cropped & converted to WebP (under 5 MB).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
