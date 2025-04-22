import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

/**
 * Supported image types for processing
 */
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg', 
  'image/jpg', 
  'image/png', 
  'image/webp', 
  'image/gif',
  'image/svg+xml'
];

/**
 * Configuration for image resizing
 */
interface ResizeConfig {
  width: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

/**
 * Standard image size presets
 */
export const IMAGE_SIZES = {
  thumbnail: { width: 200, height: 200, fit: 'cover', quality: 80, format: 'webp' } as ResizeConfig,
  small: { width: 400, height: 400, fit: 'cover', quality: 80, format: 'webp' } as ResizeConfig,
  medium: { width: 800, fit: 'inside', quality: 85, format: 'webp' } as ResizeConfig,
  large: { width: 1200, fit: 'inside', quality: 85, format: 'webp' } as ResizeConfig,
  gallery: { width: 1600, fit: 'inside', quality: 90, format: 'webp' } as ResizeConfig,
};

/**
 * Process an uploaded image file
 * - Resizes the image to multiple dimensions
 * - Optimizes the image for web
 * - Creates multiple variants (thumbnail, small, medium, large, original)
 * 
 * @param sourceFile The uploaded file path
 * @param destinationDir The directory to save processed images
 * @param filename Optional custom filename (without extension)
 * @returns Object with paths to processed images
 */
export async function processImage(
  sourceFile: string, 
  destinationDir: string,
  filename?: string
): Promise<{
  original: string;
  thumbnail: string;
  small: string;
  medium: string;
  large: string;
  gallery: string;
}> {
  // Ensure destination directory exists
  if (!fs.existsSync(destinationDir)) {
    fs.mkdirSync(destinationDir, { recursive: true });
  }

  // Generate unique filename if not provided
  const baseFilename = filename || `${Date.now()}-${uuidv4().substring(0, 8)}`;
  
  try {
    // Process image with sharp
    const image = sharp(sourceFile);
    const metadata = await image.metadata();
    
    // Skip processing for SVG files
    if (metadata.format === 'svg') {
      const destPath = path.join(destinationDir, `${baseFilename}.svg`);
      fs.copyFileSync(sourceFile, destPath);
      
      // Return the same path for all variants since SVGs are scalable
      const relativePath = path.relative(process.cwd(), destPath).replace(/^public/, '');
      return {
        original: relativePath,
        thumbnail: relativePath,
        small: relativePath,
        medium: relativePath,
        large: relativePath,
        gallery: relativePath,
      };
    }

    // Process for regular images (JPEG, PNG, WebP, etc.)
    const results: Partial<{
      original: string;
      thumbnail: string;
      small: string;
      medium: string;
      large: string;
      gallery: string;
    }> = {};

    // Save original with optimization
    const originalExt = metadata.format === 'jpeg' ? 'jpg' : (metadata.format || 'jpg');
    const originalPath = path.join(destinationDir, `${baseFilename}.${originalExt}`);
    await image.toFile(originalPath);
    results.original = path.relative(process.cwd(), originalPath).replace(/^public/, '');

    // Create size variants
    for (const [size, config] of Object.entries(IMAGE_SIZES)) {
      const { width, height, fit, quality, format } = config;
      const resized = sharp(sourceFile)
        .resize(width, height, { fit })
        .toFormat(format || 'webp', { quality: quality || 80 });
      
      const outputPath = path.join(destinationDir, `${baseFilename}-${size}.${format || 'webp'}`);
      await resized.toFile(outputPath);
      
      results[size as keyof typeof results] = path.relative(process.cwd(), outputPath).replace(/^public/, '');
    }

    return results as {
      original: string;
      thumbnail: string;
      small: string;
      medium: string;
      large: string;
      gallery: string;
    };
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error(`Failed to process image: ${error}`);
  }
}

/**
 * Calculate aspect ratio-preserving dimensions
 * @param originalWidth Original width
 * @param originalHeight Original height
 * @param maxWidth Maximum width constraint
 * @param maxHeight Maximum height constraint
 * @returns New dimensions that preserve aspect ratio
 */
export function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight?: number
): { width: number; height: number } {
  if (!maxHeight) {
    const ratio = originalHeight / originalWidth;
    return {
      width: maxWidth,
      height: Math.round(maxWidth * ratio)
    };
  }

  const widthRatio = maxWidth / originalWidth;
  const heightRatio = maxHeight / originalHeight;
  const ratio = Math.min(widthRatio, heightRatio);

  return {
    width: Math.round(originalWidth * ratio),
    height: Math.round(originalHeight * ratio)
  };
}