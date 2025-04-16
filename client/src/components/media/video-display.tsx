import { useState, useRef, useEffect } from 'react';

interface VideoDisplayProps {
  src: string;
  type?: string;
  poster?: string;
  title?: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  onError?: () => void;
}

/**
 * A component for safely displaying video content with error handling
 */
export function VideoDisplay({
  src,
  type,
  poster,
  title,
  className = '',
  width = '100%',
  height = 'auto',
  autoPlay = false,
  loop = false,
  muted = false,
  controls = true,
  onError,
  ...props
}: VideoDisplayProps & Omit<React.VideoHTMLAttributes<HTMLVideoElement>, 'src'>) {
  const [error, setError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Determine the video MIME type if not provided
  const videoType = type || (() => {
    const extension = src.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'mp4': return 'video/mp4';
      case 'webm': return 'video/webm';
      case 'ogg': return 'video/ogg';
      case 'mov': return 'video/quicktime';
      default: return 'video/mp4';
    }
  })();

  useEffect(() => {
    setIsLoading(true);
    setError(false);
    
    // Listen for video loading status
    const video = videoRef.current;
    if (video) {
      const handleCanPlay = () => {
        setIsLoading(false);
      };
      
      const handleError = () => {
        setError(true);
        setIsLoading(false);
        if (onError) onError();
      };
      
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('error', handleError);
      
      return () => {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleError);
      };
    }
  }, [src, onError]);

  // Skeleton loader while video is loading
  if (isLoading && !error) {
    return (
      <div 
        className={`bg-muted animate-pulse ${className}`}
        style={{ width, height }}
        aria-busy="true"
        aria-label={`Loading video: ${title || 'Video content'}`}
      />
    );
  }

  // Error state
  if (error) {
    return (
      <div 
        className={`bg-muted/30 border border-muted-foreground/20 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="text-center p-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-muted-foreground/70" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="mt-2 text-sm text-muted-foreground">Failed to load video</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <video
        ref={videoRef}
        className="w-full h-auto"
        poster={poster}
        width={width}
        height={height}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        controls={controls}
        {...props}
      >
        <source src={src} type={videoType} />
        Your browser does not support the video tag.
      </video>
      {title && <p className="mt-2 text-sm text-muted-foreground">{title}</p>}
    </div>
  );
}