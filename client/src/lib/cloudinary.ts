import { Cloudinary } from "@cloudinary/url-gen";

// Create a Cloudinary instance with your cloud name from environment variables
export const cld = new Cloudinary({
  cloud: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || import.meta.env.CLOUDINARY_CLOUD_NAME
  }
});

// Get the cloud name from environment variables
const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || import.meta.env.CLOUDINARY_CLOUD_NAME;

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