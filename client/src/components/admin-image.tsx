import { useState, useEffect } from 'react';
import { Gallery } from '@shared/schema';
import { SafeImage } from './safe-image';
import { ImageReplacementTrigger } from './image-replacement-trigger';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface AdminImageProps {
  src: string;
  alt: string;
  className?: string;
  showLoadingIndicator?: boolean;
  fallbackClassName?: string;
  isAdmin?: boolean;
  imageId?: number; // Optional ID to fetch from gallery if known
  triggerPosition?: "top-right" | "bottom-right" | "bottom-left" | "top-left";
  refreshInterval?: number; // Optional refresh interval in ms
}

export function AdminImage({
  src,
  alt,
  className = '',
  showLoadingIndicator = false,
  fallbackClassName = '',
  isAdmin = false,
  imageId,
  triggerPosition = "top-right",
  refreshInterval
}: AdminImageProps) {
  const [imageData, setImageData] = useState<Gallery | null>(null);
  const queryClient = useQueryClient();
  
  // If we have an imageId, fetch the data for it
  const { data: galleryImage, isSuccess } = useQuery<Gallery>({
    queryKey: [`/api/gallery/${imageId}`],
    enabled: !!imageId && isAdmin,
    refetchInterval: refreshInterval
  });
  
  // Set image data directly if we have it from the gallery
  useEffect(() => {
    if (isSuccess && galleryImage) {
      setImageData(galleryImage);
    }
  }, [isSuccess, galleryImage]);
  
  // If we don't have image data yet, but we have the URL, construct a minimal Gallery object
  useEffect(() => {
    if (!imageData && src) {
      setImageData({
        id: imageId || -1, // Use -1 as placeholder if no real ID
        image_url: src,
        thumbnail_url: null,
        alt_text: alt,
        created_at: new Date(),
        updated_at: new Date()
      } as Gallery);
    }
  }, [imageData, src, alt, imageId]);
  
  const handleReplaceComplete = () => {
    // If we have an imageId, invalidate the query to refresh the data
    if (imageId) {
      queryClient.invalidateQueries({ queryKey: [`/api/gallery/${imageId}`] });
    }
    
    // Also invalidate the general gallery query to ensure listings are updated
    queryClient.invalidateQueries({ queryKey: ['/api/gallery'] });
  };
  
  // If we're not in admin mode or don't have image data, just show the regular SafeImage
  if (!isAdmin || !imageData) {
    return (
      <SafeImage
        src={src}
        alt={alt}
        className={className}
        showLoadingIndicator={showLoadingIndicator}
        fallbackClassName={fallbackClassName}
      />
    );
  }
  
  // In admin mode with image data, wrap with the replacement trigger
  return (
    <ImageReplacementTrigger
      imageData={imageData}
      triggerPosition={triggerPosition}
      isAdmin={isAdmin}
      onReplaceComplete={handleReplaceComplete}
    >
      <SafeImage
        src={imageData.image_url || src}
        alt={imageData.alt_text || alt}
        className={className}
        showLoadingIndicator={showLoadingIndicator}
        fallbackClassName={fallbackClassName}
      />
    </ImageReplacementTrigger>
  );
}