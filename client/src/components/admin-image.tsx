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
      const response = await apiRequest(
        'POST', 
        `/api/gallery/${imageData.id}/replace-with/${replacementImageId}`
      );
      return response.json();
    },
    onSuccess: () => {
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
        src={imageData.image_url}
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