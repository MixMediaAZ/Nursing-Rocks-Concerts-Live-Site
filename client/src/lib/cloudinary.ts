/**
 * Cloudinary utility functions
 * Provides helper functions for working with Cloudinary media
 */

/**
 * Check if Cloudinary connection is working
 * Returns cloud name and connection status
 */
export async function checkCloudinaryConnection() {
  try {
    const response = await fetch('/api/cloudinary/status');
    const data = await response.json();
    
    if (data.success) {
      return {
        connected: true,
        message: data.message || 'Connected to Cloudinary API successfully',
        cloudName: data.cloudName
      };
    } else {
      return {
        connected: false,
        message: data.message || 'Could not connect to Cloudinary API',
        cloudName: null
      };
    }
  } catch (error) {
    console.error('Error checking Cloudinary connection:', error);
    return {
      connected: false,
      message: 'Error connecting to Cloudinary API',
      cloudName: null
    };
  }
}

/**
 * Detect the resource type from a public ID
 * This helps determine if we're dealing with a video, image, or other media
 */
export function detectResourceType(publicId: string): 'video' | 'image' | 'auto' {
  // Look for common file extensions in the public ID
  const videoExts = ['mp4', 'mov', 'avi', 'webm', 'mkv', 'flv', 'wmv'];
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'];
  
  // Try to detect format from the publicId (some have extensions)
  const formatMatch = publicId.match(/\.([a-zA-Z0-9]+)$/i);
  
  if (formatMatch) {
    const extension = formatMatch[1].toLowerCase();
    
    if (videoExts.includes(extension)) {
      return 'video';
    }
    
    if (imageExts.includes(extension)) {
      return 'image';
    }
  }
  
  // If the publicId contains certain folder names, we can make an educated guess
  if (/videos?|mov|mp4|clip|concert/i.test(publicId)) {
    return 'video';
  }
  
  if (/images?|photo|picture|thumbnail|banner|logo/i.test(publicId)) {
    return 'image';
  }
  
  // Default to auto
  return 'auto';
}

/**
 * Format a Cloudinary URL for direct access (not using the player)
 * Useful for thumbnails or direct image access
 */
export function formatCloudinaryUrl(
  publicId: string, 
  cloudName: string, 
  options: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'limit' | 'thumb' | 'crop';
    quality?: number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
  } = {}
) {
  const { width, height, crop = 'fill', quality = 80, format = 'auto' } = options;
  
  let transformations = [];
  
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (crop) transformations.push(`c_${crop}`);
  if (quality) transformations.push(`q_${quality}`);
  if (format) transformations.push(`f_${format}`);
  
  const transformationString = transformations.length > 0 
    ? transformations.join(',') + '/'
    : '';
  
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformationString}${publicId}`;
}

/**
 * Get a video URL from Cloudinary for direct access (not using the player)
 * This is useful for direct video embedding without the Cloudinary player
 */
export function getCloudinaryVideoUrl(
  publicId: string,
  cloudName: string,
  options: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'limit' | 'pad';
    quality?: 'auto' | number;
    format?: 'mp4' | 'webm' | 'auto';
  } = {}
) {
  const { width, height, crop, quality = 'auto', format = 'auto' } = options;
  
  let transformations = ['q_auto'];
  
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (crop) transformations.push(`c_${crop}`);
  if (quality !== 'auto') transformations.push(`q_${quality}`);
  if (format !== 'auto') transformations.push(`f_${format}`);
  
  const transformationString = transformations.length > 0 
    ? transformations.join(',') + '/'
    : '';
  
  return `https://res.cloudinary.com/${cloudName}/video/upload/${transformationString}${publicId}`;
}

/**
 * Get a thumbnail for a Cloudinary video
 * This extracts a frame from the video at a specified time
 */
export function getCloudinaryVideoThumbnail(
  publicId: string,
  cloudName: string,
  options: {
    width?: number;
    height?: number;
    timeOffset?: string; // e.g. "0.5" for 0.5 seconds, or "35%" for 35% through the video
    crop?: 'fill' | 'fit' | 'limit' | 'thumb' | 'crop';
    quality?: number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
  } = {}
) {
  const { 
    width, 
    height, 
    timeOffset = "0", 
    crop = 'fill', 
    quality = 80, 
    format = 'auto' 
  } = options;
  
  let transformations = [`so_${timeOffset}`];
  
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (crop) transformations.push(`c_${crop}`);
  if (quality) transformations.push(`q_${quality}`);
  if (format !== 'auto') transformations.push(`f_${format}`);
  
  // For thumbnails, we explicitly use jpg if no format is specified
  if (format === 'auto') transformations.push(`f_jpg`);
  
  const transformationString = transformations.join(',') + '/';
  
  return `https://res.cloudinary.com/${cloudName}/video/upload/${transformationString}${publicId}`;
}