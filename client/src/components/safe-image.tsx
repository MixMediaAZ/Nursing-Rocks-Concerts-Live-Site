import React, { useState, useEffect, useRef } from 'react';
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
  const [imageSrc, setImageSrc] = useState<string | null>(src);
  const [forceRefresh, setForceRefresh] = useState(Date.now());
  const originalSrcRef = useRef<string | null>(src);
  
  // Update image source when it changes or force refresh occurs
  useEffect(() => {
    if (!src) {
      setImageSrc(null);
      return;
    }
    
    // Store the original src for comparison in event handlers
    originalSrcRef.current = src;
    
    // Add cache busting parameter
    const cacheBuster = `t=${Date.now()}`;
    const newSrc = src.includes('?') 
      ? `${src}&${cacheBuster}` 
      : `${src}?${cacheBuster}`;
    
    console.log(`SafeImage: Updated src from ${src} to ${newSrc}`);
    
    setImageSrc(newSrc);
    setIsLoading(true);
    setHasError(false);
  }, [src, forceRefresh]);
  
  // Listen for global image replacement events 
  useEffect(() => {
    const handleImageReplaced = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      
      console.log('SafeImage received replacement event:', detail);
      console.log('Current image src:', src);
      
      // Check if this image's src matches the replaced image's original URL
      if (detail && detail.originalUrl && src) {
        const normalizedOriginalUrl = detail.originalUrl.replace(/^https?:\/\/[^\/]+/, '');
        const normalizedSrc = src.replace(/^https?:\/\/[^\/]+/, '');
        
        console.log('Normalized URLs for comparison:');
        console.log('  Original:', normalizedOriginalUrl);
        console.log('  Current:', normalizedSrc);
        
        // Check if our src contains the original URL path
        if (normalizedSrc.includes(normalizedOriginalUrl) || 
            normalizedOriginalUrl.includes(normalizedSrc)) {
          console.log('✅ Image replacement match found for:', src);
          
          // Force refresh the image with a delay to ensure the server has processed the change
          setTimeout(() => {
            console.log('Forcing image refresh with timestamp:', Date.now());
            setForceRefresh(Date.now());
          }, 500);
          
          return;
        }
      }
      
      // Always refresh on image replacement events as a fallback
      console.log('Refreshing image as fallback strategy');
      setTimeout(() => {
        setForceRefresh(Date.now());
      }, 500);
    };
    
    window.addEventListener('image-replaced', handleImageReplaced);
    return () => {
      window.removeEventListener('image-replaced', handleImageReplaced);
    };
  }, [src]);
  
  // If no source is provided, show the fallback
  if (!imageSrc) {
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
          key={`safe-img-${forceRefresh}`}
          src={imageSrc}
          alt={alt}
          className={className}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
            console.error(`Failed to load image: ${imageSrc}`);
          }}
        />
      )}
    </>
  );
}