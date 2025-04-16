import { useState, useEffect } from 'react';
import { preloadImage, SafeImageProps } from '@/lib/assetLoader';

/**
 * A component for safely displaying images with error handling and fallbacks
 */
export function SafeImage({
  src,
  alt,
  fallbackSrc = '/images/placeholder.jpg', // Default fallback image
  className = '',
  width,
  height,
  ...props
}: SafeImageProps & React.ImgHTMLAttributes<HTMLImageElement>) {
  const [imgSrc, setImgSrc] = useState<string>(src);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    setIsLoading(true);
    setError(false);
    
    // Reset source to the original when prop changes
    setImgSrc(src);
    
    // Preload the image
    preloadImage(src)
      .then(() => {
        setIsLoading(false);
      })
      .catch(() => {
        setError(true);
        setIsLoading(false);
        if (fallbackSrc) {
          setImgSrc(fallbackSrc);
        }
      });
  }, [src, fallbackSrc]);

  // Skeleton loader while image is loading
  if (isLoading) {
    return (
      <div 
        className={`bg-muted animate-pulse ${className}`}
        style={{ width, height }}
        aria-busy="true"
        aria-label={`Loading image: ${alt}`}
      />
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      width={width}
      height={height}
      {...props}
      onError={() => {
        if (!error && fallbackSrc && imgSrc !== fallbackSrc) {
          setError(true);
          setImgSrc(fallbackSrc);
        }
      }}
    />
  );
}