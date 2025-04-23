import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface SafeImageProps {
  src: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  showLoadingIndicator?: boolean;
}

export function SafeImage({ 
  src, 
  alt, 
  className = '', 
  fallbackClassName = '', 
  showLoadingIndicator = false 
}: SafeImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // If no source is provided, show the fallback
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 ${className} ${fallbackClassName}`}>
        <ImageOff className="h-8 w-8 text-slate-400" />
      </div>
    );
  }
  
  return (
    <>
      {isLoading && showLoadingIndicator && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {hasError ? (
        <div className={`flex items-center justify-center bg-slate-100 ${className} ${fallbackClassName}`}>
          <ImageOff className="h-8 w-8 text-slate-400" />
          <span className="sr-only">Image failed to load</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={className}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
      )}
    </>
  );
}