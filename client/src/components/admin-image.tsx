import { useState, useEffect } from 'react';
import { Gallery } from '@shared/schema';
import { SafeImage } from './safe-image';
import { ImageReplacementDialog } from '@/components/image-replacement-dialog';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export interface AdminImageProps {
  imageData: Gallery;
  isAdmin?: boolean;
  className?: string;
  alt?: string;
  triggerPosition?: "top-right" | "bottom-right" | "bottom-left" | "top-left";
  onReplaceComplete?: () => void;
}

/**
 * AdminImage component
 * Wraps an image with admin functionality when appropriate
 * If isAdmin is true, shows the image replacement trigger
 */
export function AdminImage({
  imageData,
  isAdmin = false,
  className = '',
  alt,
  triggerPosition = "top-right",
  onReplaceComplete
}: AdminImageProps) {
  const [isReplaceDialogOpen, setIsReplaceDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  // Add a refresh counter to force re-renders after image updates
  const [refreshKey, setRefreshKey] = useState(0);
  // Track the current image URL separately from the imageData object
  const [currentImageUrl, setCurrentImageUrl] = useState(imageData.image_url);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Check if we're in admin edit mode
  useEffect(() => {
    const adminStatus = localStorage.getItem("isAdmin") === "true";
    const editModeActive = localStorage.getItem("editMode") === "true";
    setIsEditMode(adminStatus && editModeActive);
  }, []);
  
  // Positioning classes for the trigger button
  const positionClasses = {
    "top-right": "top-2 right-2",
    "bottom-right": "bottom-2 right-2",
    "bottom-left": "bottom-2 left-2", 
    "top-left": "top-2 left-2"
  };
  
  // Replace image mutation
  const replaceImageMutation = useMutation({
    mutationFn: async (replacementImageId: number) => {
      // Log the replacement attempt for debugging
      console.log('Replacing image:', {
        originalId: imageData.id,
        originalUrl: imageData.image_url,
        replacementId: replacementImageId
      });
      
      // Include original URL in the request body for placeholder images (-1 ID)
      const response = await apiRequest(
        'POST', 
        `/api/gallery/${imageData.id}/replace-with/${replacementImageId}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            originalUrl: imageData.image_url,
            alt_text: imageData.alt_text || alt
          })
        }
      );
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Image replacement successful:', data);
      
      // Update local image URL with a random cache buster parameter to force browser refresh
      if (data && data.image_url) {
        // Update the original image data
        const cacheBuster = `?t=${Date.now()}`;
        const imageUrl = data.image_url.includes('?') 
          ? `${data.image_url}&cb=${Date.now()}` 
          : `${data.image_url}${cacheBuster}`;
          
        imageData.image_url = imageUrl;
        
        if (data.thumbnail_url) {
          imageData.thumbnail_url = data.thumbnail_url;
        }
        
        // Update state variables to force a re-render
        setCurrentImageUrl(imageUrl);
        setRefreshKey(prevKey => prevKey + 1);
      }
      
      // Invalidate any queries that might include this image
      queryClient.invalidateQueries({ queryKey: ['/api/gallery'] });
      
      toast({
        title: "Image replaced successfully",
        description: "The image has been successfully replaced with the selected one.",
      });
      
      // Close the dialog
      setIsReplaceDialogOpen(false);
      
      // Trigger callback if provided
      if (onReplaceComplete) {
        onReplaceComplete();
      }
      
      // Force a page-level refresh after a brief delay to ensure everything is updated
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('image-replaced', {
          detail: { imageId: imageData.id, newUrl: data.image_url }
        }));
      }, 200);
    },
    onError: (error: Error) => {
      toast({
        title: "Error replacing image",
        description: error.message || "There was an error replacing the image. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const handleReplaceClick = () => {
    setIsReplaceDialogOpen(true);
  };
  
  const handleReplaceImage = (replacementImageId: number) => {
    replaceImageMutation.mutate(replacementImageId);
  };
  
  // Determine if we should show admin controls (either passed in as prop or detected from edit mode)
  const showAdminControls = isAdmin || isEditMode;
  
  return (
    <div className={`relative group ${showAdminControls ? 'admin-editable' : ''}`}>
      <SafeImage 
        key={refreshKey}
        src={currentImageUrl}
        alt={alt || imageData.alt_text || "Image"}
        className={className} 
      />
      
      {showAdminControls && (
        <>
          <div className={`absolute inset-0 border-2 border-dashed border-primary/0 group-hover:border-primary/50 pointer-events-none transition-all duration-200 z-5 ${isEditMode ? 'border-primary/30' : ''}`}></div>
          
          <Button
            variant="secondary"
            size="icon"
            className={`absolute ${positionClasses[triggerPosition]} ${isEditMode ? 'opacity-70' : 'opacity-0'} group-hover:opacity-100 hover:opacity-100 transition-opacity z-10 bg-primary/80 text-white hover:bg-primary hover:text-white shadow-md`}
            onClick={handleReplaceClick}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          
          <ImageReplacementDialog
            open={isReplaceDialogOpen}
            onOpenChange={setIsReplaceDialogOpen}
            onSelectImage={handleReplaceImage}
            isPending={replaceImageMutation.isPending}
          />
        </>
      )}
    </div>
  );
}