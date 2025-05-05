import React, { useEffect, useState } from 'react';
import { checkCloudinaryConnection, detectResourceType } from '@/lib/cloudinary';

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
  resourceType?: 'video' | 'image' | 'auto'; 
  fallbackContent?: React.ReactNode;
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
  const [mediaType, setMediaType] = useState<'video' | 'image' | 'auto'>(resourceType);
  
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
        const result = await checkCloudinaryConnection();
        
        if (result.connected && result.cloudName) {
          setCloudName(result.cloudName);
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
  
  // Detect media type from publicId if needed
  useEffect(() => {
    if (resourceType === 'auto' && publicId) {
      const detectedType = detectResourceType(publicId);
      setMediaType(detectedType);
    } else {
      setMediaType(resourceType);
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
  if (mediaType === 'image') {
    options.push('resource_type=image');
  } else if (mediaType === 'video') {
    options.push('resource_type=video');
  }
  
  // Handle loading state
  const handleLoad = () => {
    setIsLoading(false);
  };
  
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    console.error(`Failed to load Cloudinary media: ${publicId} (${mediaType})`);
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