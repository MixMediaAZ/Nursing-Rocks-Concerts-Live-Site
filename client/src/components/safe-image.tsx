import React, { useState, useEffect, useRef } from 'react';
import { ImageOff } from 'lucide-react';

interface SafeImageProps {
  src: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  showLoadingIndicator?: boolean;
  elementId?: string | number; // Optional element ID for targeted updates
  productId?: number; // Optional product ID for product images
}

export function SafeImage({ 
  src, 
  alt, 
  className = '', 
  fallbackClassName = '', 
  showLoadingIndicator = false,
  elementId,
  productId
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
          
          // Force browser to get fresh image without all the flickering
          if (newImageUrl) {
            // Normalize the URL by removing any existing cache busters
            const cleanUrl = newImageUrl.split('?')[0];
            // Create a unique cache-busting parameter
            const uniqueBuster = `?t=${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
            const forcedNewUrl = cleanUrl + uniqueBuster;
            
            console.log(`Updating image src to: ${forcedNewUrl}`);
            
            // First update just the key to avoid DOM errors
            setForceRefresh(Date.now());

            // Then update the reference and source in the next tick
            // This prevents React's "Failed to execute removeChild" errors by avoiding
            // direct DOM manipulation during a render cycle
            setTimeout(() => {
              // Update both the original ref and the state
              originalSrcRef.current = forcedNewUrl;
              // Update the src with cache-busting parameters
              setImageSrc(forcedNewUrl);
            }, 0);
          } else {
            // Just update the refresh key to force reload
            setForceRefresh(Date.now());
          }
          
          return;
        }
      }
      
      // Check for a specific element ID or product ID match
      if (detail.elementId && elementId && detail.elementId.toString() === elementId.toString()) {
        console.log('Image replacement: Direct element ID match found');
        setTimeout(() => {
          setForceRefresh(Date.now());
        }, 300);
        return;
      }
      
      // Match by product ID for product images
      if (detail.productId && productId && detail.productId.toString() === productId.toString()) {
        console.log('Image replacement: Product ID match found');
        setTimeout(() => {
          // If the new URL was provided in the event, use it directly
          if (detail.newUrl) {
            // Create a unique cache-busting parameter
            const cleanUrl = detail.newUrl.split('?')[0];
            const uniqueBuster = `?t=${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
            const forcedNewUrl = cleanUrl + uniqueBuster;
            
            console.log(`Updating product image src to: ${forcedNewUrl}`);
            
            // Update both the original ref and the state
            originalSrcRef.current = forcedNewUrl;
            setImageSrc(forcedNewUrl);
          }
          setForceRefresh(Date.now());
        }, 300);
        return;
      }
      
      // Generic element ID fallback for backwards compatibility
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
  }, [src, elementId, productId]);
  
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
        <div className={`flex items-center justify-center ${productId ? 'bg-white' : ''}`}>
          <img
            key={`safe-img-${forceRefresh}`}
            src={imageSrc}
            alt={alt}
            className={`${className} ${productId ? 'object-contain max-h-full' : ''}`}
            data-element-id={elementId || ''}
            data-product-id={productId || ''}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
              console.error(`Failed to load image: ${imageSrc}`);
            }}
          />
        </div>
      )}
    </>
  );
}