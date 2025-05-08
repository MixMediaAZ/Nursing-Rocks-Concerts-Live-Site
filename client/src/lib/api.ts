/**
 * API helper functions for making requests to the server
 */

export interface CloudinaryResource {
  public_id: string;
  secure_url: string;
  format: string;
  resource_type: string;
  asset_id: string;
  bytes: number;
  width?: number;
  height?: number;
  created_at: string;
  display_name?: string;
  asset_folder?: string;
  duration?: number;
}

export interface CloudinaryVideosResponse {
  success: boolean;
  resources: CloudinaryResource[];
  total: number;
  nextCursor?: string;
  message?: string;
}

/**
 * Fetch videos from Cloudinary folder
 * 
 * @param folder The Cloudinary folder to fetch videos from
 * @returns Array of Cloudinary video resources
 */
export async function fetchCloudinaryVideos(folder: string): Promise<CloudinaryResource[]> {
  try {
    const response = await fetch(`/api/cloudinary/videos?folder=${encodeURIComponent(folder)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch videos: ${response.status} ${response.statusText}`);
    }
    
    const data: CloudinaryVideosResponse = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch videos from Cloudinary');
    }
    
    return data.resources || [];
  } catch (error) {
    console.error('Error fetching Cloudinary videos:', error);
    return [];
  }
}