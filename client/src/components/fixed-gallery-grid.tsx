import { useState } from "react";
import { Gallery } from "@shared/schema";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Copy, MoreVertical, Trash2 } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImageViewer } from "./image-viewer";

interface FixedGalleryGridProps {
  title?: string;
  subtitle?: string;
  images?: Gallery[];
  isLoading?: boolean;
  isEditMode?: boolean;
  onDeleteImage?: (image: Gallery) => void;
}

export default function FixedGalleryGrid({
  title = "Gallery",
  subtitle = "Browse our gallery",
  images = [],
  isLoading = false,
  isEditMode = false,
  onDeleteImage,
}: FixedGalleryGridProps) {
  const [selectedImage, setSelectedImage] = useState<Gallery | null>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const { toast } = useToast();

  // Handle image click to open viewer
  const handleImageClick = (image: Gallery) => {
    setSelectedImage(image);
    setShowImageViewer(true);
  };

  // Handle close of image viewer
  const handleCloseViewer = () => {
    setShowImageViewer(false);
    // Keep the selected image to maintain state for navigation
  };

  // Handle navigation within the image viewer
  const handleNavigate = (newImage: Gallery) => {
    setSelectedImage(newImage);
  };

  // Handle delete image
  const handleDeleteImage = (image: Gallery) => {
    if (onDeleteImage) {
      onDeleteImage(image);
    }
  };

  // Handle copy image to clipboard
  const handleCopyImage = (image: Gallery) => {
    try {
      localStorage.setItem('clipboardImage', JSON.stringify(image));
      toast({
        title: "Image Copied",
        description: "Image copied to clipboard",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy image to clipboard",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="w-full">
      {title && (
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">{title}</h2>
          {subtitle && <p className="text-gray-500">{subtitle}</p>}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-60 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images && images.length > 0 ? (
            images.map((image) => (
              <Card key={image.id} className="overflow-hidden">
                <div 
                  className="cursor-pointer relative" 
                  onClick={() => handleImageClick(image)}
                >
                  <CardContent className="p-0 aspect-square">
                    <img 
                      src={image.image_url} 
                      alt={image.alt_text || `Gallery image ${image.id}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        // Handle broken images
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsSGVsdmV0aWNhLHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTkiPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
                      }}
                    />
                  </CardContent>
                </div>
                <CardFooter className="flex justify-between items-center p-3">
                  <p className="text-sm truncate">
                    {image.alt_text || `Image #${image.id}`}
                  </p>
                  {isEditMode && (
                    <div className="flex items-center gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleCopyImage(image)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteImage(image)}
                            className="text-red-500 focus:text-red-500"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full flex items-center justify-center py-12">
              <p className="text-gray-500">No gallery images available</p>
            </div>
          )}
        </div>
      )}

      {/* Standalone image viewer that won't close unintentionally */}
      <ImageViewer
        image={selectedImage}
        isVisible={showImageViewer}
        onClose={handleCloseViewer}
        imageList={images}
        onNavigate={handleNavigate}
        allowDownload={true}
      />
    </div>
  );
}