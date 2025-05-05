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
  resourceType?: 'video' | 'image' | 'auto'; // Add support for different resource types
  fallbackContent?: React.ReactNode; // Fallback UI if media fails to load
}

/**
 * CloudinaryIframeVideo - A reliable Cloudinary media component using iframes
 * This approach provides better compatibility and reliability across platforms
 * Supports videos, images, and auto-detection of resource types
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
  title = "Nursing Rocks media",
  cloudName: propCloudName,
  resourceType = 'auto',
  fallbackContent
}: CloudinaryIframeVideoProps) {
  const [cloudName, setCloudName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [mediaFormat, setMediaFormat] = useState<string | null>(null);
  
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
  
  // Detect media format from publicId if needed
  useEffect(() => {
    if (resourceType === 'auto' && publicId) {
      // Try to detect format from the publicId (some have extensions)
      const formatMatch = publicId.match(/\.(mp4|mov|avi|webm|jpg|jpeg|png|gif|webp)$/i);
      if (formatMatch) {
        const detectedFormat = formatMatch[1].toLowerCase();
        const isVideo = ['mp4', 'mov', 'avi', 'webm'].includes(detectedFormat);
        setMediaFormat(isVideo ? 'video' : 'image');
      } else {
        // Default to video if we can't detect
        setMediaFormat('video');
      }
    } else {
      setMediaFormat(resourceType);
    }
  }, [publicId, resourceType]);
  
  // Build iframe options
  const options = [];
  
  // Always include these options for consistent behavior
  options.push('player.muted=true'); // Ensure videos are muted to allow autoplay
  
  // Add remaining options based on props
  if (autoPlay) options.push('player.autoplay=true');
  if (muted) options.push('muted=1');
  if (controls) options.push('controls=1');
  if (loop) options.push('player.loop=true');
  
  // Handle formats that might need different parameters
  if (mediaFormat === 'image') {
    options.push('resource_type=image');
  }
  
  // Handle loading state
  const handleLoad = () => {
    setIsLoading(false);
  };
  
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    console.error(`Failed to load Cloudinary media: ${publicId}`);
  };
  
  // Wait for cloud name to be set
  if (!cloudName) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-black/50">
        <div className="animate-pulse text-white">Loading media player...</div>
      </div>
    );
  }
  
  // Show error UI if there was a problem
  if (hasError && fallbackContent) {
    return <>{fallbackContent}</>;
  }
  
  // Create URL with Cloudinary domain + media options
  const iframeSrc = `https://player.cloudinary.com/embed/?public_id=${encodeURIComponent(publicId)}&cloud_name=${cloudName}&${options.join('&')}`;
  
  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
          <div className="animate-pulse text-white">Loading content...</div>
        </div>
      )}
      <iframe
        src={iframeSrc}
        className={className}
        width={width}
        height={height}
        title={title}
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        frameBorder="0"
        allowFullScreen
        onLoad={handleLoad}
        onError={handleError}
      />
    </>
  );
}