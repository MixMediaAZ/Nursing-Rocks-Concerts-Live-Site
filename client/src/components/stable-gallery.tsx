import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Gallery } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Search, X } from "lucide-react";

type StableGalleryProps = {
  maxImages?: number;
  title?: string;
  subtitle?: string;
}

// Safe image component that verifies the image exists before rendering
const SafeImage = ({ src, alt, className }: { src: string; alt: string; className: string }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <span className="text-gray-400 text-sm">Image unavailable</span>
      </div>
    );
  }
  
  return (
    <>
      {!imgLoaded && !imgError && (
        <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {imgError && (
        <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
          <span className="text-gray-400 text-sm">Image unavailable</span>
        </div>
      )}
      
      <img 
        src={src} 
        alt={alt || "Concert image"} 
        className={`${className} ${imgLoaded && !imgError ? 'block' : 'hidden'}`}
        loading="lazy"
        onLoad={() => setImgLoaded(true)}
        onError={() => {
          setImgError(true);
          setImgLoaded(false);
        }}
      />
    </>
  );
};

const GalleryImage = ({ image, onClick }: { image: Gallery, onClick: () => void }) => {
  if (!image || !image.image_url) {
    return null;
  }
  
  return (
    <div 
      className="relative group overflow-hidden rounded-lg cursor-pointer"
      onClick={onClick}
    >
      <SafeImage 
        src={image.image_url} 
        alt={image.alt_text || "Concert moment"} 
        className="w-full h-60 object-cover transition-transform duration-500 group-hover:scale-110" 
      />
      <div className="absolute inset-0 bg-[#5D3FD3]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
        <div className="bg-white/90 rounded-full p-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
          <Search className="text-[#5D3FD3]" size={16} />
        </div>
      </div>
    </div>
  );
};

const ImageViewer = ({ 
  image, 
  onClose, 
  open
}: { 
  image: Gallery | null;
  onClose: () => void;
  open: boolean;
}) => {
  // Close button ref to auto-focus for keyboard accessibility
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  
  // Focus the close button when the modal opens
  useEffect(() => {
    if (open && closeButtonRef.current) {
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
    }
  }, [open]);
  
  if (!image) return null;
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) onClose();
    }}>
      <DialogContent className="max-w-3xl p-0 bg-transparent border-none">
        <div className="relative">
          <SafeImage 
            src={image.image_url} 
            alt={image.alt_text || "Concert moment"} 
            className="w-full h-auto max-h-[80vh] object-contain rounded-lg" 
          />
          <Button 
            ref={closeButtonRef}
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2 rounded-full bg-white/80 hover:bg-white text-gray-800"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={20} />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const StableGallery = ({ maxImages = 8, title = "Concert Gallery", subtitle = "Relive the magic from our previous events" }: StableGalleryProps) => {
  const { data: apiResponse, isLoading } = useQuery({
    queryKey: ["/api/gallery"],
  });
  
  // Safely extract images array from different response formats
  const images = Array.isArray(apiResponse) ? apiResponse : 
               (apiResponse && typeof apiResponse === 'object' && 'rows' in apiResponse && Array.isArray(apiResponse.rows)) ? 
               apiResponse.rows : [];
  
  const [visibleImages, setVisibleImages] = useState(maxImages);
  const [selectedImage, setSelectedImage] = useState<Gallery | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  
  // Safely filter out invalid items
  const validImages = images.filter(img => 
    img && typeof img === 'object' && 'id' in img && 'image_url' in img
  );
  
  // Load more images
  const loadMoreImages = () => {
    setVisibleImages(prev => prev + maxImages);
  };
  
  // Handle image selection for viewer
  const handleSelectImage = (image: Gallery) => {
    setSelectedImage(image);
    setIsViewerOpen(true);
  };
  
  // Close the image viewer
  const handleCloseViewer = () => {
    setIsViewerOpen(false);
  };

  return (
    <section id="gallery" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="font-heading text-3xl font-bold mb-2 text-center">{title}</h2>
        <p className="text-[#333333]/70 text-center mb-12">{subtitle}</p>
        
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: maxImages }).map((_, i) => (
              <Skeleton key={i} className="h-60 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {validImages.length > 0 ? (
                validImages.slice(0, visibleImages).map((image) => (
                  <GalleryImage 
                    key={image.id} 
                    image={image as Gallery} 
                    onClick={() => handleSelectImage(image as Gallery)}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">No gallery images available</p>
                </div>
              )}
            </div>
            
            {validImages.length > 0 && visibleImages < validImages.length && (
              <div className="text-center mt-10">
                <Button 
                  onClick={loadMoreImages}
                  className="bg-[#5D3FD3] hover:bg-[#5D3FD3]/90 text-white font-accent font-semibold py-3 px-8 rounded-full"
                >
                  <span>View More Photos</span>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Standalone image viewer component */}
      <ImageViewer 
        image={selectedImage} 
        onClose={handleCloseViewer}
        open={isViewerOpen}
      />
    </section>
  );
};

export default StableGallery;