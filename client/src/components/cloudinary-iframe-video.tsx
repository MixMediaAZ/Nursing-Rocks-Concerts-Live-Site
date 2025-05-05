import React from 'react';

interface CloudinaryIframeVideoProps {
  cloudName?: string;
  publicId: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
}

/**
 * CloudinaryIframeVideo component
 * Uses Cloudinary's iframe embedding which is more reliable across browsers
 * than direct video tag usage
 */
export function CloudinaryIframeVideo({
  cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || import.meta.env.CLOUDINARY_CLOUD_NAME,
  publicId,
  className = "",
  autoPlay = true,
  muted = true,
  controls = true,
}: CloudinaryIframeVideoProps) {
  // Format publicId to handle folder paths correctly
  const formattedPublicId = publicId.replace(/^\//, '');
  
  // Build the embed URL with parameters
  const embedUrl = `https://player.cloudinary.com/embed/?cloud_name=${cloudName}&public_id=${formattedPublicId}&player[autoplay]=${autoPlay ? 'true' : 'false'}&player[muted]=${muted ? 'true' : 'false'}&player[controls]=${controls ? 'true' : 'false'}&player[fluid]=true&player[colors][accent]=%23ff3366`;

  return (
    <div className={`cloudinary-iframe-container ${className}`}>
      <iframe
        src={embedUrl}
        className="w-full h-full"
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        allowFullScreen
        frameBorder="0"
        title="Nursing Rocks Video"
      ></iframe>
    </div>
  );
}