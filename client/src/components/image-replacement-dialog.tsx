import { useState } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Gallery } from '@shared/schema';
import { StableGallery } from './stable-gallery';

interface ImageReplacementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectImage: (imageId: number) => void;
  isPending: boolean;
}

export function ImageReplacementDialog({
  open,
  onOpenChange,
  onSelectImage,
  isPending = false
}: ImageReplacementDialogProps) {
  const [selectedImage, setSelectedImage] = useState<Gallery | null>(null);
  
  const handleSelectImage = (image: Gallery) => {
    setSelectedImage(image);
  };
  
  const handleConfirmReplacement = () => {
    if (selectedImage) {
      onSelectImage(selectedImage.id);
    }
  };
  
  const handleOpenChange = (newOpenState: boolean) => {
    // Only allow closing if not in pending state
    if (!isPending || !newOpenState) {
      onOpenChange(newOpenState);
      
      // Reset selection when dialog closes
      if (!newOpenState) {
        setSelectedImage(null);
      }
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Replacement Image</DialogTitle>
          <DialogDescription>
            Choose an image from the gallery to replace the current one. 
            The system will automatically resize it to maintain layout consistency.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto py-4">
          <StableGallery 
            selectable={true}
            onSelect={handleSelectImage}
            isLoading={isPending}
          />
        </div>
        
        <DialogFooter className="mt-4 flex items-center justify-between">
          <div>
            {selectedImage && (
              <span className="text-sm">
                Selected: <strong>{selectedImage.alt_text || 'Image'}</strong>
              </span>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleConfirmReplacement}
              disabled={!selectedImage || isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Replacing...
                </>
              ) : (
                'Replace Image'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}