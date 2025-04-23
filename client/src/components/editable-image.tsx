import { useAdminEditMode } from '@/hooks/use-admin-edit-mode';
import { SafeImage } from './safe-image';
import { AdminImage } from './admin-image';
import { gallery, type Gallery } from '@shared/schema';
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
      
      // Then try to find by image URL - handle relative paths and URLencoded paths
      const normalizedSrc = src.replace(/^\//, ''); // Remove leading slash for comparison
      
      // Check for exact match
      const foundByExactUrl = images.find(img => img.image_url === src || img.image_url === normalizedSrc);
      if (foundByExactUrl) {
        setImageData(foundByExactUrl);
        return;
      }
      
      // Check by basename match (handles path differences)
      const srcBasename = src.split('/').pop();
      if (srcBasename) {
        const foundByBasename = images.find(img => {
          const imgBasename = img.image_url.split('/').pop();
          return imgBasename === srcBasename;
        });
        
        if (foundByBasename) {
          setImageData(foundByBasename);
          return;
        }
      }
      
      // Check for decoded/encoded URL matches
      try {
        const decodedSrc = decodeURIComponent(src);
        const foundByDecodedUrl = images.find(img => 
          img.image_url === decodedSrc || 
          decodeURIComponent(img.image_url) === decodedSrc
        );
        
        if (foundByDecodedUrl) {
          setImageData(foundByDecodedUrl);
          return;
        }
      } catch (e) {
        console.warn('Error decoding URL:', e);
      }
      
      // If we couldn't find the image but still want admin functionality,
      // create a placeholder gallery item
      if (!imageData && showAdmin) {
        setImageData({
          id: id || -1, // Use provided ID or placeholder
          image_url: src,
          thumbnail_url: null,
          alt_text: alt,
          event_id: null,
          folder_id: null,
          media_type: 'image',
          file_size: 0,
          dimensions: '0x0',
          duration: null,
          sort_order: 0,
          created_at: new Date(),
          updated_at: new Date(),
          z_index: 0,
          tags: [],
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
        onReplaceComplete={() => {
          // Refresh the component after replacing an image
          // This is especially important for placeholder images
          setTimeout(() => {
            setImageData(null); // Clear image data to trigger a re-fetch
          }, 100);
        }}
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