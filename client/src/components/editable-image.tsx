import { useAdminEditMode } from '@/hooks/use-admin-edit-mode';
import { SafeImage } from './safe-image';
import { AdminImage } from './admin-image';
import { Gallery } from '@shared/schema';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface EditableImageProps {
  src: string;
  alt?: string;
  className?: string;
  id?: number;  // Optional gallery image ID if already known
  forceAdmin?: boolean; // Force admin mode even if not in edit mode
  triggerPosition?: "top-right" | "bottom-right" | "bottom-left" | "top-left";
}

/**
 * EditableImage component
 * Automatically wraps images in AdminImage when in admin edit mode
 * Falls back to SafeImage when not in admin mode
 */
export function EditableImage({ 
  src, 
  alt = "Image", 
  className = "", 
  id,
  forceAdmin = false,
  triggerPosition = "top-right" 
}: EditableImageProps) {
  const isEditMode = useAdminEditMode();
  const [imageData, setImageData] = useState<Gallery | null>(null);
  const showAdmin = isEditMode || forceAdmin;
  
  // Fetch gallery data if needed
  const { data: galleryData } = useQuery<Gallery[] | {rows: Gallery[]}>({
    queryKey: ['/api/gallery'],
    enabled: showAdmin && !imageData, // Only fetch when needed
  });
  
  useEffect(() => {
    if (!showAdmin || imageData) return;
    
    // Try to find the image in gallery data by URL or ID
    if (galleryData) {
      let images: Gallery[] = [];
      
      if (Array.isArray(galleryData)) {
        images = galleryData;
      } else if (typeof galleryData === 'object' && 'rows' in galleryData && Array.isArray(galleryData.rows)) {
        images = galleryData.rows;
      }
      
      // First try to find by ID if provided
      if (id) {
        const foundById = images.find(img => img.id === id);
        if (foundById) {
          setImageData(foundById);
          return;
        }
      }
      
      // Then try to find by image URL
      const foundByUrl = images.find(img => img.image_url === src);
      if (foundByUrl) {
        setImageData(foundByUrl);
        return;
      }
      
      // If we couldn't find the image but still want admin functionality,
      // create a placeholder gallery item
      if (!imageData && showAdmin) {
        setImageData({
          id: id || -1, // Use provided ID or placeholder
          image_url: src,
          alt_text: alt,
          created_at: new Date(),
          updated_at: new Date(),
          folder_id: null,
          width: 0,
          height: 0,
          file_size: 0,
          file_type: '',
          is_featured: false,
          metadata: {}
        });
      }
    }
  }, [galleryData, src, id, showAdmin, imageData]);
  
  // If in admin mode and we have image data, show AdminImage
  if (showAdmin && imageData) {
    return (
      <AdminImage
        imageData={imageData}
        isAdmin={true}
        className={className}
        alt={alt}
        triggerPosition={triggerPosition}
      />
    );
  }
  
  // Otherwise show regular SafeImage
  return (
    <SafeImage
      src={src}
      alt={alt}
      className={className}
    />
  );
}