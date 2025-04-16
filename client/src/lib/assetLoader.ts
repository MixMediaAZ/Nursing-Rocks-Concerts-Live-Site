import { MediaAsset } from '@shared/schema';

// Supported file extensions by type
export const SUPPORTED_MEDIA_TYPES = {
  IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  VIDEO: ['.mp4', '.webm', '.ogg', '.mov'],
  AUDIO: ['.mp3', '.wav', '.ogg', '.m4a'],
  DOCUMENT: ['.pdf', '.doc', '.docx', '.txt', '.rtf'],
};

// Registry to store loaded assets
const assetRegistry = new Map<string, MediaAsset>();

/**
 * Determine media type based on filename extension
 */
export function getMediaType(filename: string): 'image' | 'video' | 'audio' | 'document' | 'other' {
  const ext = `.${filename.split('.').pop()?.toLowerCase()}`;
  
  if (SUPPORTED_MEDIA_TYPES.IMAGE.includes(ext)) return 'image';
  if (SUPPORTED_MEDIA_TYPES.VIDEO.includes(ext)) return 'video';
  if (SUPPORTED_MEDIA_TYPES.AUDIO.includes(ext)) return 'audio';
  if (SUPPORTED_MEDIA_TYPES.DOCUMENT.includes(ext)) return 'document';
  
  return 'other';
}

/**
 * Register a media asset in the registry
 */
export function registerAsset(asset: MediaAsset): void {
  assetRegistry.set(asset.id, asset);
}

/**
 * Get a media asset from the registry by ID
 */
export function getAssetById(id: string): MediaAsset | undefined {
  return assetRegistry.get(id);
}

/**
 * Get all assets from the registry
 */
export function getAllAssets(): MediaAsset[] {
  return Array.from(assetRegistry.values());
}

/**
 * Filter assets by type
 */
export function getAssetsByType(type: 'image' | 'video' | 'audio' | 'document' | 'other'): MediaAsset[] {
  return Array.from(assetRegistry.values()).filter(asset => asset.type === type);
}

/**
 * Create a new media asset object
 * Useful for creating assets client-side before uploading
 */
export function createMediaAsset(
  path: string, 
  type: 'image' | 'video' | 'audio' | 'document' | 'other',
  metadata: Partial<MediaAsset> = {}
): MediaAsset {
  // Generate temporary ID
  const id = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  // Extract filename from path
  const filename = path.split('/').pop() || '';
  
  return {
    id,
    path,
    type,
    title: metadata.title || filename,
    alt: metadata.alt || filename,
    description: metadata.description || '',
    created_at: new Date(),
    updated_at: new Date(),
    user_id: null,
    filesize: metadata.filesize || 0,
    filename,
    originalname: metadata.originalname || filename,
    mimetype: metadata.mimetype || '',
    ...metadata,
  };
}

/**
 * Preload a list of assets
 * Useful for preventing layout shifts
 */
export async function preloadAssets(assets: MediaAsset[]): Promise<void> {
  const imageAssets = assets.filter(asset => asset.type === 'image');
  
  // Preload images
  const preloadPromises = imageAssets.map(asset => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve(); // Resolve even on error to prevent blocking
      img.src = asset.path;
    });
  });
  
  await Promise.all(preloadPromises);
}

/**
 * Preload a single image
 * Returns a promise that resolves when the image is loaded or fails
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * Extract file extension from a path or URL
 */
export function getFileExtension(path: string): string {
  const parts = path.split('.');
  if (parts.length <= 1) return '';
  return `.${parts.pop()?.toLowerCase()}`;
}

/**
 * Props for the SafeImage component
 */
export interface SafeImageProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  width?: number | string;
  height?: number | string;
}