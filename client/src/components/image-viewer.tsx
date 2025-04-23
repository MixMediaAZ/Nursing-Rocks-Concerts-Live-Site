import { useState, useEffect } from "react";
import { Gallery } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SafeImage } from "@/components/safe-image";
import { ChevronLeft, ChevronRight, X, Download } from "lucide-react";

interface ImageViewerProps {
  image: Gallery | null;
  isVisible: boolean;
  onClose: () => void;
  imageList?: Gallery[]; 
  onNavigate?: (image: Gallery) => void;
  allowDownload?: boolean;
}

export function ImageViewer({
  image,
  isVisible,
  onClose,
  imageList = [],
  onNavigate,
  allowDownload = false,
}: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Update the current index when the image changes
  useEffect(() => {
    if (image && imageList.length > 0) {
      const index = imageList.findIndex(img => img.id === image.id);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [image, imageList]);

  // Don't render if there's no image or the viewer is not visible
  if (!image || !isVisible) {
    return null;
  }

  // Go to previous image
  const goToPrevious = () => {
    if (imageList.length > 1) {
      const newIndex = (currentIndex - 1 + imageList.length) % imageList.length;
      setCurrentIndex(newIndex);
      if (onNavigate) {
        onNavigate(imageList[newIndex]);
      }
    }
  };

  // Go to next image
  const goToNext = () => {
    if (imageList.length > 1) {
      const newIndex = (currentIndex + 1) % imageList.length;
      setCurrentIndex(newIndex);
      if (onNavigate) {
        onNavigate(imageList[newIndex]);
      }
    }
  };

  // Handle download
  const handleDownload = () => {
    if (!image.image_url) return;

    const link = document.createElement('a');
    link.href = image.image_url;
    link.download = `image-${image.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Prevent the dialog from closing automatically
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Dialog open={isVisible} onOpenChange={() => onClose()}>
      <DialogContent 
        className="max-w-4xl p-0 bg-black/95 border-0 overflow-hidden"
        onClick={handleClick}
      >
        <div className="relative w-full h-full flex flex-col">
          <div className="absolute top-4 right-4 z-20">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full bg-black/20 hover:bg-black/40 text-white"
              onClick={onClose}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          
          {allowDownload && (
            <div className="absolute top-4 left-4 z-20">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full bg-black/20 hover:bg-black/40 text-white"
                onClick={handleDownload}
              >
                <Download className="h-5 w-5" />
              </Button>
            </div>
          )}
          
          <div className="flex-1 flex items-center justify-center p-6 min-h-[400px]">
            <SafeImage
              src={image.image_url}
              alt={image.alt_text || `Image ${image.id}`}
              className="max-h-[80vh] max-w-full object-contain"
              showLoadingIndicator
            />
          </div>
          
          {imageList.length > 1 && (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute left-4 top-1/2 transform -translate-y-1/2 rounded-full bg-black/20 hover:bg-black/40 text-white z-10"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-4 top-1/2 transform -translate-y-1/2 rounded-full bg-black/20 hover:bg-black/40 text-white z-10"
                onClick={goToNext}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}
          
          <div className="p-4 bg-black/80 text-white">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">
                {image.alt_text || `Image ${image.id}`}
              </span>
              {imageList.length > 1 && (
                <span className="text-xs">
                  {currentIndex + 1} / {imageList.length}
                </span>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}