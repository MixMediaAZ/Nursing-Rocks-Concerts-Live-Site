import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';

interface ImageReplacementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageId: number) => void;
  elementId?: string | number;
  originalUrl?: string;
  title?: string;
  description?: string;
}

export function ImageReplacementDialog({
  isOpen,
  onClose,
  onSelectImage,
  elementId,
  originalUrl,
  title = 'Select Replacement Image',
  description = 'Choose an image from the gallery to replace the current one. The system will automatically resize it to maintain layout consistency.'
}: ImageReplacementDialogProps) {
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);

  const { data: galleryImages, isLoading, error } = useQuery({
    queryKey: ["/api/gallery"],
    enabled: isOpen
  });

  // Reset selection when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedImageId(null);
      setIsReplacing(false);
    }
  }, [isOpen]);

  const handleImageSelect = async () => {
    if (!selectedImageId) {
      toast({
        title: 'No image selected',
        description: 'Please select an image first',
        variant: 'destructive'
      });
      return;
    }

    setIsReplacing(true);
    try {
      const payload: any = { originalUrl };
      
      // Use the appropriate API endpoint based on whether we have an element ID
      const endpoint = elementId 
        ? `/api/gallery/${elementId}/replace-with/${selectedImageId}`
        : `/api/gallery/-1/replace-with/${selectedImageId}`;
      
      const response = await apiRequest('POST', endpoint, payload);
      
      if (!response.ok) {
        throw new Error('Failed to replace image');
      }
      
      const result = await response.json();
      
      toast({
        title: 'Image replaced',
        description: 'The image has been successfully replaced'
      });
      
      onSelectImage(selectedImageId);
      onClose();
      
      // Trigger a custom event to refresh images using the new one
      const replaceEvent = new CustomEvent('image-replaced', { 
        detail: { 
          originalUrl, 
          newImageId: selectedImageId,
          elementId
        } 
      });
      window.dispatchEvent(replaceEvent);
      
    } catch (error) {
      console.error('Error replacing image:', error);
      toast({
        title: 'Error replacing image',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsReplacing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        {/* Show original image if available */}
        {originalUrl && (
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Current Image:</h3>
            <div className="border rounded-md p-2 bg-slate-50 flex justify-center">
              <img src={originalUrl} alt="Original" className="h-40 object-contain" />
            </div>
          </div>
        )}
        
        {isLoading ? (
          <div className="py-10 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading gallery images...</span>
          </div>
        ) : error ? (
          <div className="py-10 text-center text-destructive">
            Failed to load gallery images. Please try again.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 my-4">
              {galleryImages && Array.isArray(galleryImages.rows || galleryImages) && 
               (galleryImages.rows || galleryImages).map((image: any) => (
                <div 
                  key={image.id}
                  onClick={() => setSelectedImageId(image.id)}
                  className={`border rounded-md p-2 cursor-pointer transition-all hover:border-primary ${
                    selectedImageId === image.id ? 'ring-2 ring-primary border-primary bg-primary/5' : ''
                  }`}
                >
                  <img 
                    src={image.thumbnail_url || image.image_url} 
                    alt={image.alt_text || 'Gallery image'} 
                    className="w-full h-32 object-cover"
                  />
                  <div className="mt-1 text-xs truncate text-center">
                    {image.alt_text || `Image #${image.id}`}
                  </div>
                </div>
              ))}
              
              {(!galleryImages || 
                (galleryImages.rows && galleryImages.rows.length === 0) || 
                (Array.isArray(galleryImages) && galleryImages.length === 0)) && (
                <div className="col-span-full py-8 text-center text-muted-foreground">
                  No images found in gallery. Please upload some images first.
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button 
                onClick={handleImageSelect} 
                disabled={!selectedImageId || isReplacing}
              >
                {isReplacing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Replace Image
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}