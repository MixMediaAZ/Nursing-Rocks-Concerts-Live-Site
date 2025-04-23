import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Gallery } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Search, X } from "lucide-react";

const GalleryImage = ({ image }: { image: Gallery }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="relative group overflow-hidden rounded-lg cursor-pointer">
          <img 
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
          <img 
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
  const { data: images, isLoading } = useQuery<Gallery[]>({
    queryKey: ["/api/gallery"],
  });
  
  const [visibleImages, setVisibleImages] = useState(8);
  
  const loadMoreImages = () => {
    setVisibleImages(prev => prev + 8);
  };

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
              {Array.isArray(images) ? 
                images.slice(0, visibleImages).map((image) => (
                  <GalleryImage key={image.id} image={image} />
                ))
                :
                // Fallback if images is not an array
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">No gallery images available</p>
                </div>
              }
            </div>
            
            {Array.isArray(images) && images.length > 0 && visibleImages < images.length && (
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
