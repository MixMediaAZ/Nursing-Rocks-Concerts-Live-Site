import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Gallery } from '@shared/schema';
import { SafeImage } from './safe-image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, Image as ImageIcon } from 'lucide-react';

interface StableGalleryProps {
  selectable?: boolean;
  onSelect?: (image: Gallery) => void;
  isLoading?: boolean;
  initialFilter?: string;
}

export function StableGallery({ 
  selectable = false,
  onSelect,
  isLoading: externalLoading = false,
  initialFilter = '',
}: StableGalleryProps) {
  const [filter, setFilter] = useState(initialFilter);
  
  // Fetch all gallery images
  const { data: galleryData, isLoading: isLoadingGallery } = useQuery<Gallery[] | {rows: Gallery[]}>({
    queryKey: ['/api/gallery'],
  });
  
  const isLoading = isLoadingGallery || externalLoading;
  
  // Handle different possible data structures from API
  let filteredImages: Gallery[] = [];
  if (galleryData) {
    if (Array.isArray(galleryData)) {
      filteredImages = galleryData;
    } else if (typeof galleryData === 'object' && 'rows' in galleryData && Array.isArray(galleryData.rows)) {
      filteredImages = galleryData.rows;
    }
  }
  
  // Extract images with filters if needed
  const images = filter
    ? filteredImages.filter(img => 
        img.alt_text?.toLowerCase().includes(filter.toLowerCase()) || 
        img.image_url?.toLowerCase().includes(filter.toLowerCase()))
    : filteredImages;
  
  const handleSelect = (image: Gallery) => {
    if (selectable && onSelect) {
      onSelect(image);
    }
  };
  
  return (
    <div className="w-full">
      {/* Gallery search and filtering */}
      <div className="mb-6 flex flex-col space-y-4">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search images..."
              className="pl-8"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      {/* Gallery grid */}
      <div className="relative">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No images found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {filter 
                ? "Try a different search term" 
                : "Upload some images to get started"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((image) => (
              <div 
                key={image.id} 
                className={`group relative overflow-hidden rounded-md border bg-background ${
                  selectable ? 'cursor-pointer' : ''
                }`}
                onClick={selectable ? () => handleSelect(image) : undefined}
              >
                <div className="aspect-square overflow-hidden">
                  <SafeImage
                    src={image.image_url || ''}
                    alt={image.alt_text || 'Gallery image'}
                    className="h-full w-full object-cover transition-all group-hover:scale-105"
                    fallbackClassName="h-full w-full flex items-center justify-center bg-muted"
                  />
                </div>
                
                {selectable && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button variant="secondary" size="sm">
                      Select
                    </Button>
                  </div>
                )}
                
                <div className="p-2">
                  <p className="truncate text-xs text-muted-foreground">
                    {image.alt_text || "No description"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}