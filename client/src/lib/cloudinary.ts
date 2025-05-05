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
  return `https://res.cloudinary.com/${cloudName}/video/upload/${publicId}`;
}

// Helper to generate a Cloudinary video thumbnail URL
export function getCloudinaryVideoThumbnail(publicId: string): string {
  return `https://res.cloudinary.com/${cloudName}/video/upload/c_scale,h_600,q_auto,w_1000/${publicId}.jpg`;
}