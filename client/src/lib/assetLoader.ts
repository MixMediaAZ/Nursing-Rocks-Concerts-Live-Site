/**
 * Asset Loader utility for handling various media types
 * 
 * This module provides functions to safely load and validate different types of media
 * assets including images, videos, audio, and documents.
 */

// Supported media types and their allowed extensions
export const SUPPORTED_MEDIA_TYPES = {
  IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'],
  VIDEO: ['.mp4', '.webm', '.ogg', '.mov'],
  AUDIO: ['.mp3', '.wav', '.ogg', '.m4a'],
  DOCUMENT: ['.pdf', '.doc', '.docx', '.txt', '.rtf'],
} as const;

/**
 * Media asset type with required properties
 */
export interface MediaAsset {
  id: string;
  path: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'other';
  alt?: string;
  title?: string;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * Gets file extension from path
 */
export function getFileExtension(path: string): string {
  return path.substring(path.lastIndexOf('.')).toLowerCase();
}

/**
 * Determines media type based on file extension
 */
export function getMediaType(path: string): MediaAsset['type'] {
  const extension = getFileExtension(path);
  
  if (SUPPORTED_MEDIA_TYPES.IMAGE.includes(extension as any)) return 'image';
  if (SUPPORTED_MEDIA_TYPES.VIDEO.includes(extension as any)) return 'video';
  if (SUPPORTED_MEDIA_TYPES.AUDIO.includes(extension as any)) return 'audio';
  if (SUPPORTED_MEDIA_TYPES.DOCUMENT.includes(extension as any)) return 'document';
  
  return 'other';
}

/**
 * Load an image and return a promise that resolves when the image is loaded
 * or rejects if the image fails to load
 */
export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image at ${src}`));
    img.src = src;
  });
}

/**
 * Safe image component props
 */
export interface SafeImageProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  width?: number | string;
  height?: number | string;
}

/**
 * Create a media asset object from path and metadata
 */
export function createMediaAsset(
  path: string, 
  id?: string, 
  metadata?: Partial<Omit<MediaAsset, 'id' | 'path' | 'type'>>
): MediaAsset {
  return {
    id: id || path.split('/').pop()?.split('.')[0] || Math.random().toString(36).substring(2, 9),
    path,
    type: getMediaType(path),
    alt: metadata?.alt || '',
    title: metadata?.title || '',
    description: metadata?.description || '',
    metadata: metadata?.metadata || {},
  };
}

/**
 * Validates that a file path exists and is accessible
 * Note: This is a client-side utility and doesn't actually check the file system
 * It only verifies that the path is properly formatted
 */
export function validateAssetPath(path: string): boolean {
  // Check if path is a URL
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      new URL(path);
      return true;
    } catch (e) {
      return false;
    }
  }
  
  // Check if path is a relative import path
  if (path.startsWith('@assets/') || path.startsWith('./') || path.startsWith('../')) {
    return true;
  }
  
  // Check if path is absolute
  if (path.startsWith('/')) {
    return true;
  }
  
  return false;
}

// Asset registry for keeping track of all loaded assets
const assetRegistry: Map<string, MediaAsset> = new Map();

/**
 * Register an asset in the global registry
 */
export function registerAsset(asset: MediaAsset): void {
  assetRegistry.set(asset.id, asset);
}

/**
 * Get an asset from the registry by ID
 */
export function getAssetById(id: string): MediaAsset | undefined {
  return assetRegistry.get(id);
}

/**
 * Get all registered assets
 */
export function getAllAssets(): MediaAsset[] {
  return Array.from(assetRegistry.values());
}

/**
 * Get all assets of a specific type
 */
export function getAssetsByType(type: MediaAsset['type']): MediaAsset[] {
  return Array.from(assetRegistry.values()).filter(asset => asset.type === type);
}

/**
 * Clear asset registry
 */
export function clearAssetRegistry(): void {
  assetRegistry.clear();
}