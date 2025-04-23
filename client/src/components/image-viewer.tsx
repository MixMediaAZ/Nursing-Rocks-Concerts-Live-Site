import { useState } from 'react';
import { Modal } from './modal';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download, Maximize, X } from 'lucide-react';
import { Gallery } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

interface ImageViewerProps {
  image: Gallery | null;
  isVisible: boolean;
  onClose: () => void;
  imageList?: Gallery[];
  onNavigate?: (newImage: Gallery) => void;
  allowDownload?: boolean;
}

export function ImageViewer({
  image,
  isVisible,
  onClose,
  imageList = [],
  onNavigate,
  allowDownload = false
}: ImageViewerProps) {
  const [isClosing, setIsClosing] = useState(false);
  const { toast } = useToast();

  if (!image) return null;

  const handleClose = () => {
    setIsClosing(true);
    // Delay the actual closing to allow for animations
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const findCurrentIndex = () => {
    if (!imageList.length) return -1;
    return imageList.findIndex(img => img.id === image.id);
  };

  const canGoPrevious = () => {
    const currentIndex = findCurrentIndex();
    return currentIndex > 0;
  };

  const canGoNext = () => {
    const currentIndex = findCurrentIndex();
    return currentIndex < imageList.length - 1 && currentIndex !== -1;
  };

  const goToPrevious = () => {
    if (!onNavigate) return;
    const currentIndex = findCurrentIndex();
    if (currentIndex > 0) {
      onNavigate(imageList[currentIndex - 1]);
    }
  };

  const goToNext = () => {
    if (!onNavigate) return;
    const currentIndex = findCurrentIndex();
    if (currentIndex < imageList.length - 1 && currentIndex !== -1) {
      onNavigate(imageList[currentIndex + 1]);
    }
  };

  const handleDownload = () => {
    // Create a temporary link for downloading
    const link = document.createElement('a');
    link.href = image.image_url;
    link.download = `gallery-image-${image.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download Started",
      description: "Your image download has started",
    });
  };

  const openFullSize = () => {
    window.open(image.image_url, '_blank');
  };

  return (
    <Modal
      isVisible={isVisible && !isClosing}
      onClose={handleClose}
      width="max-w-5xl"
      hideCloseButton={true}
    >
      <div className="relative pb-4">
        {/* Custom header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Image #{image.id}</h2>
            {image.alt_text && (
              <p className="text-sm text-gray-500 mt-1">{image.alt_text}</p>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleClose} 
            className="h-8 w-8 rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Main image container */}
        <div className="relative w-full max-h-[70vh] overflow-hidden flex items-center justify-center bg-gray-50 rounded-lg p-2 border border-gray-100">
          <img 
            src={image.image_url} 
            alt={image.alt_text || "Gallery image"} 
            className="max-w-full max-h-[65vh] object-contain shadow-sm"
          />
        </div>
        
        {/* Navigation and action buttons */}
        <div className="mt-4 flex flex-wrap gap-2 justify-center w-full">
          {imageList.length > 0 && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToPrevious}
                disabled={!canGoPrevious()}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToNext}
                disabled={!canGoNext()}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={openFullSize}
            className="ml-2"
          >
            <Maximize className="h-4 w-4 mr-2" />
            Full Size
          </Button>

          {allowDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          )}
        </div>
        
        {/* Image metadata */}
        <div className="mt-4 text-sm text-gray-500 text-center">
          <p>
            Image ID: {image.id} 
            {image.folder_id && <span> • Folder ID: {image.folder_id}</span>}
            {image.event_id && <span> • Event ID: {image.event_id}</span>}
          </p>
        </div>
      </div>
    </Modal>
  );
}