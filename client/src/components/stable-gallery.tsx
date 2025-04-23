import { useState, useEffect } from "react";
import { Gallery } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ImageViewer } from "@/components/image-viewer";
import FixedGalleryGrid from "@/components/fixed-gallery-grid";

export default function StableGallery() {
  const { data: galleryImages, isLoading } = useQuery<Gallery[]>({
    queryKey: ["/api/gallery"],
  });
  
  const [visibleCount, setVisibleCount] = useState(6);
  const [images, setImages] = useState<Gallery[]>([]);
  const [selectedImage, setSelectedImage] = useState<Gallery | null>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  
  // When images load, update our local state
  useEffect(() => {
    if (galleryImages && Array.isArray(galleryImages)) {
      setImages(galleryImages);
    } else if (galleryImages && 'rows' in galleryImages) {
      // Handle alternate API response format
      // @ts-ignore - We know this has rows because we checked
      setImages(galleryImages.rows);
    }
  }, [galleryImages]);
  
  const handleViewMore = () => {
    // Navigate to full gallery page
    window.location.href = "/gallery";
  };
  
  const handleShowMore = () => {
    setVisibleCount(prev => Math.min(prev + 6, images.length));
  };
  
  // Create a visibility-safe slice of images
  const visibleImages = images && images.slice ? images.slice(0, visibleCount) : [];
  
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Photo Gallery</h2>
          <p className="text-gray-600">Relive the magic from our previous events</p>
        </div>
        
        {/* Use our stable gallery grid component */}
        <FixedGalleryGrid
          title=""
          subtitle=""
          images={visibleImages}
          isLoading={isLoading}
        />
        
        {images && images.length > 0 && (
          <div className="mt-8 flex justify-center gap-4">
            {visibleCount < images.length && (
              <Button
                variant="outline"
                onClick={handleShowMore}
              >
                Show More
              </Button>
            )}
            
            <Button
              onClick={handleViewMore}
              className="bg-[#5D3FD3] hover:bg-[#5D3FD3]/90"
            >
              View Gallery
            </Button>
          </div>
        )}
      </div>
      
      {/* Image viewer that's guaranteed not to disappear */}
      <ImageViewer
        image={selectedImage}
        isVisible={showImageViewer}
        onClose={() => setShowImageViewer(false)}
        imageList={images}
        onNavigate={setSelectedImage}
      />
    </section>
  );
}