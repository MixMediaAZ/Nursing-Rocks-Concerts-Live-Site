import React, { useState, useCallback, useRef, useEffect, ReactNode } from 'react';

interface ResponsiveVideoFrameProps {
  children: ReactNode;
  className?: string;
  defaultAspectRatio?: number; // Default 16:9 = 16/9 ≈ 1.777
  onAspectRatioChange?: (aspectRatio: number) => void;
}

/**
 * ResponsiveVideoFrame - Container that adapts to video's native aspect ratio
 * Defaults to 16:9 but updates when video metadata loads
 * Uses object-fit: contain to ensure no cropping (safe display)
 */
export function ResponsiveVideoFrame({
  children,
  className = '',
  defaultAspectRatio = 16 / 9,
  onAspectRatioChange,
}: ResponsiveVideoFrameProps) {
  const [aspectRatio, setAspectRatio] = useState<number>(defaultAspectRatio);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMetadataLoaded = useCallback(
    (videoElement: HTMLVideoElement) => {
      if (videoElement.videoWidth && videoElement.videoHeight) {
        const calculatedRatio = videoElement.videoWidth / videoElement.videoHeight;
        setAspectRatio(calculatedRatio);
        onAspectRatioChange?.(calculatedRatio);
      }
    },
    [onAspectRatioChange]
  );

  // Find video element inside container and listen for metadata
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const findVideoElement = () => {
      const video = container.querySelector('video');
      if (video && video.videoWidth && video.videoHeight) {
        const calculatedRatio = video.videoWidth / video.videoHeight;
        setAspectRatio(calculatedRatio);
        onAspectRatioChange?.(calculatedRatio);
      }
    };

    // Check immediately in case video is already loaded
    findVideoElement();

    // Listen for loadedmetadata events on any video in the container
    const handleLoadedMetadata = (e: Event) => {
      const video = e.target as HTMLVideoElement;
      if (video && video.videoWidth && video.videoHeight) {
        handleMetadataLoaded(video);
      }
    };

    container.addEventListener('loadedmetadata', handleLoadedMetadata, true);
    
    // Also use MutationObserver to catch dynamically added videos
    const observer = new MutationObserver(() => {
      findVideoElement();
    });
    observer.observe(container, { childList: true, subtree: true });

    return () => {
      container.removeEventListener('loadedmetadata', handleLoadedMetadata, true);
      observer.disconnect();
    };
  }, [handleMetadataLoaded, onAspectRatioChange]);

  // Clone children and inject onLoadedMetadata handler for direct prop passing
  const childrenWithHandler = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<any>, {
        onLoadedMetadata: (e: React.SyntheticEvent<HTMLVideoElement>) => {
          const video = e.currentTarget;
          handleMetadataLoaded(video);
          // Call original handler if it exists
          const originalHandler = (child as any).props?.onLoadedMetadata;
          if (originalHandler) {
            originalHandler(e);
          }
        },
      });
    }
    return child;
  });

  return (
    <div
      ref={containerRef}
      className={`w-full bg-black ${className}`}
      style={{
        aspectRatio: aspectRatio.toString(),
        maxWidth: '100%',
      }}
    >
      <div className="w-full h-full flex items-center justify-center">
        {childrenWithHandler}
      </div>
    </div>
  );
}
