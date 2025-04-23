import { useState } from 'react';
import { Gallery } from '@shared/schema';
import { SafeImage } from './safe-image';
import { ImageReplacementDialog } from './image-replacement-dialog';
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
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
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
  
  return (
    <div className="relative">
      <SafeImage 
        src={imageData.image_url}
        alt={alt || imageData.alt_text || "Image"}
        className={className} 
      />
      
      {isAdmin && (
        <>
          <Button
            variant="secondary"
            size="icon"
            className={`absolute ${positionClasses[triggerPosition]} opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity z-10`}
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