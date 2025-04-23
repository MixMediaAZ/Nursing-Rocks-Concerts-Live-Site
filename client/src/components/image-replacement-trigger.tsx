import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/components/ui/dialog';
import { StableGallery } from './stable-gallery';
import { Gallery } from '@shared/schema';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { RefreshCcw, Replace } from 'lucide-react';

interface ImageReplacementTriggerProps {
  children: React.ReactNode;
  imageData: Gallery;
  isAdmin: boolean;
  triggerPosition?: "top-right" | "bottom-right" | "bottom-left" | "top-left";
  onReplaceComplete?: () => void;
}

export function ImageReplacementTrigger({
  children,
  imageData,
  isAdmin,
  triggerPosition = "top-right",
  onReplaceComplete,
}: ImageReplacementTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Position styles
  const positionStyles = {
    "top-right": "top-2 right-2",
    "bottom-right": "bottom-2 right-2",
    "bottom-left": "bottom-2 left-2",
    "top-left": "top-2 left-2",
  };

  // Mutation to replace the image
  const replaceMutation = useMutation({
    mutationFn: async (replacementId: number) => {
      const res = await apiRequest(
        'POST', 
        `/api/gallery/${imageData.id}/replace-with/${replacementId}`
      );
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate the relevant gallery queries
      queryClient.invalidateQueries({ queryKey: ['/api/gallery'] });
      if (imageData.event_id) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/gallery/event/${imageData.event_id}`] 
        });
      }
      if (imageData.folder_id) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/gallery/folder/${imageData.folder_id}`] 
        });
      }
      
      toast({
        title: "Image Replaced",
        description: "The image has been successfully replaced",
      });
      
      setIsOpen(false);
      
      // Call the onReplaceComplete callback if provided
      if (onReplaceComplete) {
        onReplaceComplete();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to replace image: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleReplaceImage = async (replacementImage: Gallery) => {
    if (!replacementImage || !replacementImage.id) {
      toast({
        title: "Error",
        description: "Invalid replacement image selected",
        variant: "destructive",
      });
      return;
    }
    
    replaceMutation.mutate(replacementImage.id);
  };

  if (!isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="group relative">
      {children}
      
      <Button
        size="sm"
        variant="secondary"
        className={`absolute ${positionStyles[triggerPosition]} opacity-0 group-hover:opacity-100 transition-opacity z-10`}
        onClick={() => setIsOpen(true)}
      >
        <Replace className="w-4 h-4 mr-1" />
        Replace
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Replacement Image</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-slate-500 mb-6">
              Select an image from the gallery to replace the current image. 
              The selected image will be automatically resized to match the 
              dimensions of the current image.
            </p>
            
            {replaceMutation.isPending ? (
              <div className="flex items-center justify-center p-12">
                <RefreshCcw className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2">Replacing image...</span>
              </div>
            ) : (
              <StableGallery 
                selectable 
                onSelect={handleReplaceImage}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}