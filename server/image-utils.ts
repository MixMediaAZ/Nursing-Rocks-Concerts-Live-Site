import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

/**
 * Supported image types for processing
 */
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg', 
  'image/jpg', 
  'image/png', 
  'image/webp', 
  'image/gif',
  'image/svg+xml',
  'image/bmp',
  'image/tiff',
  'image/heic',
  'image/heif'
];

/**
 * Configuration for image resizing
 */
interface ResizeConfig {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

/**
 * Standard image size presets
 */
interface ImageSizePreset {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  quality: number;
  format: 'webp';
}

export const IMAGE_SIZES: Record<string, ImageSizePreset> = {
  thumbnail: {
    width: 150,
    height: 150,
    fit: 'cover',
    quality: 80,
    format: 'webp'
  },
  small: {
    width: 320,
    quality: 80,
    format: 'webp'
  },
  medium: {
    width: 640,
    quality: 80,
    format: 'webp'
  },
  large: {
    width: 1280,
    quality: 85,
    format: 'webp'
  },
  original: {
    quality: 90,
    format: 'webp'
  }
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
 * @param customDimensions Optional custom dimensions for the original image
 * @returns Object with paths to processed images
 */
export async function processImage(
  sourceFile: string,
  destinationDir: string,
  filename?: string,
  customDimensions?: ResizeConfig
): Promise<Record<keyof typeof IMAGE_SIZES, string>> {
  // Ensure destination directory exists
  if (!fs.existsSync(destinationDir)) {
    fs.mkdirSync(destinationDir, { recursive: true });
  }

  // Use the original filename if not provided
  const baseFilename = filename || path.parse(sourceFile).name;
  
  // Load the image once to get metadata
  const image = sharp(sourceFile);
  const metadata = await image.metadata();
  
  // Create a dictionary to store generated file paths
  const result: Partial<Record<keyof typeof IMAGE_SIZES, string>> = {};
  
  // Process each size preset
  for (const [size, config] of Object.entries(IMAGE_SIZES)) {
    const sizeKey = size as keyof typeof IMAGE_SIZES;
    
    try {
      // Start with a fresh instance to avoid pipeline conflicts
      let pipeline = sharp(sourceFile);
      
      // Determine if we need to resize
      if (size === 'original' && customDimensions) {
        // Use custom dimensions for original if provided
        const resizeOptions: sharp.ResizeOptions = {
          width: customDimensions.width,
          height: customDimensions.height,
          fit: customDimensions.fit || 'cover'
        };
        
        pipeline = pipeline.resize(resizeOptions);
      } else if (size !== 'original' && config.width) {
        const resizeOptions: sharp.ResizeOptions = {
          width: config.width,
          height: config.height,
          fit: config.fit
        };
        
        pipeline = pipeline.resize(resizeOptions);
      }
      
      // Set output format and quality
      // Always use webp format with specified quality
      pipeline = pipeline.webp({ 
        quality: customDimensions?.quality || config.quality || 80 
      });
      
      // Create output filename
      const outputFilename = size === 'original' 
        ? `${baseFilename}.webp`
        : `${baseFilename}-${size}.webp`;
      
      // Generate relative path (suitable for storage in DB)
      const relativePath = path.join('/uploads/gallery', path.relative(path.join(process.cwd(), 'uploads/gallery'), path.join(destinationDir, outputFilename)));
      
      // Create absolute path (for file operations)
      const outputPath = path.join(destinationDir, outputFilename);
      
      // Save the processed image
      await pipeline.toFile(outputPath);
      
      // Store the relative path in the result
      result[sizeKey] = relativePath;
    } catch (error) {
      console.error(`Error processing ${size} version of ${sourceFile}:`, error);
      // Continue processing other sizes
    }
  }
  
  // Return all the generated file paths
  return result as Record<keyof typeof IMAGE_SIZES, string>;
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
  maxHeight: number
): { width: number; height: number } {
  // Calculate aspect ratio
  const aspectRatio = originalWidth / originalHeight;
  
  // Initialize with maximum dimensions
  let targetWidth = maxWidth;
  let targetHeight = maxHeight;
  
  // Adjust to maintain aspect ratio
  if (maxWidth / maxHeight > aspectRatio) {
    // Height is the limiting factor
    targetWidth = Math.round(maxHeight * aspectRatio);
    targetHeight = maxHeight;
  } else {
    // Width is the limiting factor
    targetWidth = maxWidth;
    targetHeight = Math.round(maxWidth / aspectRatio);
  }
  
  return { width: targetWidth, height: targetHeight };
}