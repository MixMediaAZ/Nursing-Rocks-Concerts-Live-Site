import React, { useEffect, useState } from 'react';

export interface CloudinaryIframeVideoProps {
  publicId: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  loop?: boolean;
  title?: string;
  cloudName?: string | null;
}

/**
 * CloudinaryIframeVideo - A reliable Cloudinary video component using iframes
 * This approach provides better compatibility and reliability than direct video elements
 */
export function CloudinaryIframeVideo({
  publicId,
  className = "",
  width = "100%",
  height = "100%",
  autoPlay = false,
  muted = false,
  controls = true,
  loop = false,
  title = "Nursing Rocks video",
  cloudName: propCloudName
}: CloudinaryIframeVideoProps) {
  const [cloudName, setCloudName] = useState<string | null>(null);
  
  // Fetch cloud name from server if needed
  useEffect(() => {
    async function getCloudName() {
      // Use the prop cloudName if provided
      if (propCloudName) {
        setCloudName(propCloudName);
        return;
      }
      
      try {
        // Try to use the environment variable next
        const envCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        
        if (envCloudName) {
          setCloudName(envCloudName as string);
          return;
        }
        
        // Finally fallback to server API
        const response = await fetch('/api/cloudinary/status');
        const data = await response.json();
        
        if (data.success && data.cloudName) {
          setCloudName(data.cloudName);
        } else {
          console.warn('Could not get Cloudinary cloud name from server, using fallback');
          setCloudName('demo');
        }
      } catch (error) {
        console.error('Error getting Cloudinary cloud name:', error);
        setCloudName('demo');
      }
    }
    
    getCloudName();
  }, [propCloudName]);
  
  // Build iframe options
  const options = [];
  
  if (autoPlay) options.push('autoplay=1');
  if (muted) options.push('muted=1');
  if (controls) options.push('controls=1');
  if (loop) options.push('loop=1');
  
  // Wait for cloud name to be set
  if (!cloudName) {
    return <div className="flex items-center justify-center w-full h-full bg-black/50">
      <div className="animate-pulse text-white">Loading video...</div>
    </div>;
  }
  
  // Create URL with Cloudinary domain + video options
  const iframeSrc = `https://player.cloudinary.com/embed/?public_id=${encodeURIComponent(publicId)}&cloud_name=${cloudName}&${options.join('&')}`;
  
  return (
    <iframe
      src={iframeSrc}
      className={className}
      width={width}
      height={height}
      title={title}
      allow="autoplay; encrypted-media"
      frameBorder="0"
      allowFullScreen
    />
  );
}