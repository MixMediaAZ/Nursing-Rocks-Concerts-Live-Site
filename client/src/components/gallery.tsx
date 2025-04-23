import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Gallery } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Search, X } from "lucide-react";

// Safe image component that verifies the image exists before rendering
const SafeImage = ({ src, alt, className }: { src: string; alt: string; className: string }) => {
  // Default fallback image if the image URL is missing or invalid
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <span className="text-gray-400 text-sm">Image unavailable</span>
      </div>
    );
  }
  
  return (
    <img 
      src={src} 
      alt={alt || "Concert image"} 
      className={className}
      loading="lazy"
      onError={(e) => {
        // On error, replace with a placeholder div
        const target = e.target as HTMLImageElement;
        const parent = target.parentElement;
        if (parent) {
          const placeholder = document.createElement('div');
          placeholder.className = target.className + ' flex items-center justify-center bg-gray-100';
          placeholder.innerHTML = '<span class="text-gray-400 text-sm">Image unavailable</span>';
          parent.replaceChild(placeholder, target);
        }
      }}
    />
  );
};

const GalleryImage = ({ image }: { image: Gallery }) => {
  if (!image || !image.image_url) {
    return null;
  }
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="relative group overflow-hidden rounded-lg cursor-pointer">
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
      </DialogTrigger>
      <DialogContent className="max-w-3xl p-0 bg-transparent border-none">
        <div className="relative">
          <SafeImage 
            src={image.image_url} 
            alt={image.alt_text || "Concert moment"} 
            className="w-full h-auto max-h-[80vh] object-contain rounded-lg" 
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2 rounded-full bg-white/20 hover:bg-white/40 text-white"
            aria-label="Close"
          >
            <X size={20} />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const GallerySection = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/gallery"],
  });
  
  // Safely extract the array of images
  const images = Array.isArray(data) ? data : 
                (data && typeof data === 'object' && 'rows' in data && Array.isArray(data.rows)) ? 
                data.rows : [];
  
  const [visibleImages, setVisibleImages] = useState(8);
  
  const loadMoreImages = () => {
    setVisibleImages(prev => prev + 8);
  };

  // Safely filter out any invalid image objects
  const validImages = images.filter(img => 
    img && typeof img === 'object' && 'id' in img && 'image_url' in img
  );

  return (
    <section id="gallery" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="font-heading text-3xl font-bold mb-2 text-center">Concert Gallery</h2>
        <p className="text-[#333333]/70 text-center mb-12">Relive the magic from our previous events</p>
        
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-60 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {validImages.length > 0 ? (
                validImages.slice(0, visibleImages).map((image) => (
                  <GalleryImage key={image.id} image={image as Gallery} />
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
                  <i className="fas fa-arrow-right ml-2"></i>
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default GallerySection;
