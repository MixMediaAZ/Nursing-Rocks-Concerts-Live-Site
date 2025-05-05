import { Cloudinary } from "@cloudinary/url-gen";

// Create a Cloudinary instance with your cloud name from environment variables
export const cld = new Cloudinary({
  cloud: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || import.meta.env.CLOUDINARY_CLOUD_NAME
  }
});

// Get the cloud name from environment variables
const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || import.meta.env.CLOUDINARY_CLOUD_NAME;

// Get Cloudinary API key and secret from environment variables
const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY || import.meta.env.CLOUDINARY_API_KEY;
const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET || import.meta.env.CLOUDINARY_API_SECRET;

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
// Note: This requires server-side implementation to protect API credentials
// For now, we'll use a simulated list
export async function fetchVideosFromFolder(folderPath: string): Promise<string[]> {
  // This is a client-side function that should make a request to your backend
  // Your backend would then make an authenticated request to Cloudinary's API
  try {
    // For development/prototyping, return known videos
    return [
      "Nursing_Rocks_Concerts",
      "NR_Promo_Video", 
      "NR_Highlights"
    ];
    
    // In production, you would uncomment this code and implement a backend endpoint
    // const response = await fetch(`/api/cloudinary/videos?folder=${folderPath}`);
    // if (!response.ok) throw new Error('Failed to fetch videos');
    // const data = await response.json();
    // return data.resources.map((resource: any) => resource.public_id.replace(`${folderPath}/`, ''));
  } catch (error) {
    console.error('Error fetching videos from Cloudinary folder:', error);
    return []; // Return empty array if error
  }
}