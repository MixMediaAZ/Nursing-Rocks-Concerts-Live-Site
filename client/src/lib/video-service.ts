/**
 * Video service utility functions for B2-backed video operations
 */

/**
 * Check if video service is working
 */
export async function checkVideoConnection() {
  try {
    const response = await fetch('/api/videos/status');
    const data = await response.json();
    
    if (data.success) {
      return {
        connected: true,
        message: data.message || 'Connected to video service successfully',
      };
    } else {
      return {
        connected: false,
        message: data.message || 'Could not connect to video service',
      };
    }
  } catch (error) {
    console.error('Error checking video connection:', error);
    return {
      connected: false,
      message: 'Error connecting to video service',
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

