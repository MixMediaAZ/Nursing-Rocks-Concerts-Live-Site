import { Cloudinary } from "@cloudinary/url-gen";

// Consistent access to Cloudinary credentials from environment variables
const cloudName = import.meta.env.CLOUDINARY_CLOUD_NAME as string;
const apiKey = import.meta.env.CLOUDINARY_API_KEY as string;
const apiSecret = import.meta.env.CLOUDINARY_API_SECRET as string;

// Create a Cloudinary instance with cloud name
export const cld = new Cloudinary({
  cloud: {
    cloudName
  }
});

// Helper function to get a full Cloudinary video URL
export function getCloudinaryVideoUrl(publicId: string): string {
  // Handle folder paths by ensuring publicId is properly formatted
  const formattedPublicId = publicId.replace(/^\//, ''); // Remove leading slash if present
  return `https://res.cloudinary.com/${cloudName}/video/upload/v1/${formattedPublicId}`;
}

// Helper to generate a Cloudinary video thumbnail URL
export function getCloudinaryVideoThumbnail(publicId: string): string {
  // Handle folder paths by ensuring publicId is properly formatted
  const formattedPublicId = publicId.replace(/^\//, ''); // Remove leading slash if present
  return `https://res.cloudinary.com/${cloudName}/video/upload/c_scale,h_600,q_auto,w_1000/v1/${formattedPublicId}.jpg`;
}

// Helper to build a folder path if needed
export function getCloudinaryFolderPath(folder: string, fileName: string): string {
  const cleanFolder = folder.replace(/^\/|\/$/g, ''); // Remove leading and trailing slashes
  return `${cleanFolder}/${fileName}`;
}

// Fetch videos from a specific Cloudinary folder
// Uses the server-side API to protect credentials
export async function fetchVideosFromFolder(folderPath: string): Promise<string[]> {
  try {
    // Call our server-side API endpoint
    const response = await fetch(`/api/cloudinary/videos?folder=${encodeURIComponent(folderPath)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch videos: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      console.warn('Cloudinary API error, using fallbacks:', data);
      // Return default videos as fallback
      return [
        "Nursing_Rocks_Concerts",
        "NR_Promo_Video", 
        "NR_Highlights"
      ];
    }
    
    // If there are no videos in the folder, use our defaults
    if (!data.resources || data.resources.length === 0) {
      console.log('Cloudinary API returned no videos, using defaults');
      return [
        "Nursing_Rocks_Concerts",
        "NR_Promo_Video", 
        "NR_Highlights"
      ];
    }
    
    // Extract file names from the resources array
    return data.resources.map((resource: any) => {
      // Extract just the filename from the public_id path
      const fullPublicId = resource.public_id;
      return fullPublicId.replace(`${folderPath}/`, '');
    });
  } catch (error) {
    console.error('Error fetching videos from Cloudinary folder:', error);
    // Return default videos as fallback in case of error
    return [
      "Nursing_Rocks_Concerts",
      "NR_Promo_Video", 
      "NR_Highlights"
    ];
  }
}

// Check Cloudinary connection status
export async function checkCloudinaryConnection(): Promise<{connected: boolean, message: string, cloudName?: string}> {
  try {
    const response = await fetch('/api/cloudinary/status');
    const data = await response.json();
    
    return {
      connected: data.connected || false,
      message: data.message || 'Cloudinary connection check completed',
      cloudName: data.cloudName
    };
  } catch (error) {
    console.error('Error checking Cloudinary connection:', error);
    return {
      connected: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}