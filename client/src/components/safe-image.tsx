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
    
    // Remove any existing timestamp parameters (t=123456789)
    let cleanSrc = src.replace(/([&?])t=\d+(&|$)/, (match, prefix, suffix) => {
      return suffix === '&' ? prefix : '';
    });
    
    // If the URL ends with a timestamp query parameter that was removed, also remove the ?
    if (cleanSrc.endsWith('?')) {
      cleanSrc = cleanSrc.slice(0, -1);
    }
    
    // Add a fresh cache busting parameter using both timestamp and a random value
    // This ensures browsers can't use any cached versions
    const cacheBuster = `t=${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const newSrc = cleanSrc.includes('?') 
      ? `${cleanSrc}&${cacheBuster}` 
      : `${cleanSrc}?${cacheBuster}`;
    
    console.log(`SafeImage: Updated src with cache busting: ${src} -> ${newSrc}`);
    
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
      console.log('Original stored src:', originalSrcRef.current);
      
      if (!detail || !src) {
        return;
      }
      
      const { originalUrl, newImageUrl, elementId } = detail;
      
      // Check if this image's src matches the replaced image's original URL
      if (originalUrl && (src || originalSrcRef.current)) {
        // Normalize URLs by removing protocol and domain for more reliable comparison
        const normalizeUrl = (url: string) => url.replace(/^https?:\/\/[^\/]+/, '').split('?')[0];
        
        const normalizedOriginalUrl = normalizeUrl(originalUrl);
        const normalizedCurrentSrc = normalizeUrl(src);
        const normalizedStoredSrc = originalSrcRef.current ? normalizeUrl(originalSrcRef.current) : '';
        
        console.log('Normalized URLs for comparison:');
        console.log('  Original from event:', normalizedOriginalUrl);
        console.log('  Current src:', normalizedCurrentSrc);
        console.log('  Stored original src:', normalizedStoredSrc);
        
        // Multiple possible matches to handle different URL formats
        const isMatch = 
          normalizedCurrentSrc.includes(normalizedOriginalUrl) || 
          normalizedOriginalUrl.includes(normalizedCurrentSrc) ||
          normalizedStoredSrc.includes(normalizedOriginalUrl) ||
          normalizedOriginalUrl.includes(normalizedStoredSrc) ||
          // Also check image paths without file extensions
          normalizedCurrentSrc.replace(/\.[^/.]+$/, "").includes(normalizedOriginalUrl.replace(/\.[^/.]+$/, ""));
        
        if (isMatch) {
          console.log('✅ Image replacement match found!');
          console.log('  Current:', src);
          console.log('  New URL:', newImageUrl);
          
          // For matches, force refresh with a slight delay
          // This gives time for the server to process any changes
          setTimeout(() => {
            console.log('Forcing image refresh with timestamp:', Date.now());
            // Use the new image URL if provided, otherwise just refresh
            if (newImageUrl) {
              console.log(`Updating image src to: ${newImageUrl}`);
              originalSrcRef.current = newImageUrl;
            }
            setForceRefresh(Date.now());
          }, 300);
          
          return;
        }
      }
      
      // Don't refresh all images by default anymore - that can cause too many unnecessary refreshes
      // Only refresh specific element ID matches as a fallback
      if (detail.elementId && detail.elementId.toString().includes('image')) {
        console.log('Refreshing image as element ID fallback strategy');
        setTimeout(() => {
          setForceRefresh(Date.now());
        }, 300);
      }
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