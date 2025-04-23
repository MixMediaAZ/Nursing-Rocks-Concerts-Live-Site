import { useState } from 'react';
import { Loader2, ImageOff } from 'lucide-react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  showLoadingIndicator?: boolean;
  fallbackClassName?: string;
}

export function SafeImage({
  src,
  alt,
  className = '',
  showLoadingIndicator = false,
  fallbackClassName = '',
}: SafeImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Handle image load
  const handleLoad = () => {
    setIsLoading(false);
  };

  // Handle image error
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div className={`relative ${className}`}>
      {!hasError && (
        <img
          src={src}
          alt={alt}
          className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

      {/* Loading indicator */}
      {isLoading && showLoadingIndicator && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {/* Error fallback */}
      {hasError && (
        <div className={`flex items-center justify-center bg-gray-100 ${fallbackClassName || className}`}>
          <div className="flex flex-col items-center p-4 text-gray-500">
            <ImageOff className="h-8 w-8 mb-2" />
            <span className="text-xs text-center">{alt || 'Image not found'}</span>
          </div>
        </div>
      )}
    </div>
  );
}