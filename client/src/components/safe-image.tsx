import { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackComponent?: React.ReactNode;
  showLoadingIndicator?: boolean;
}

/**
 * A component that safely renders an image with fallback handling.
 * This prevents errors when an image fails to load.
 */
export function SafeImage({
  src,
  alt,
  className,
  fallbackComponent,
  showLoadingIndicator = false,
  ...props
}: SafeImageProps) {
  const [isLoading, setIsLoading] = useState(!!src);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (!src || hasError) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>;
    }

    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="flex flex-col items-center justify-center p-4 text-gray-400">
          <ImageOff className="h-10 w-10 mb-2" />
          <span className="text-sm text-center">{alt || 'Image not available'}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {isLoading && showLoadingIndicator && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={className}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </>
  );
}