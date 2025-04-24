import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Loader2, Search, X, Image as ImageIcon, Replace } from 'lucide-react';

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
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dialogContentRef = useRef<HTMLDivElement>(null);

  const { data: galleryImages, isLoading, error } = useQuery({
    queryKey: ["/api/gallery"],
    enabled: isOpen
  });
  
  // Add separate logging for debugging
  useEffect(() => {
    if (galleryImages) {
      console.log('Gallery API response:', galleryImages);
    }
  }, [galleryImages]);
  
  // Log errors if any occur
  useEffect(() => {
    if (error) {
      console.error('Gallery API error:', error);
    }
  }, [error]);

  // Reset selection when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedImageId(null);
      setIsReplacing(false);
      setSearchQuery('');
    } else {
      // Check if we're on a mobile device
      setIsMobile(window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
      
      // Scroll to top when opening dialog
      if (dialogContentRef.current) {
        dialogContentRef.current.scrollTop = 0;
      }
    }
  }, [isOpen]);
  
  // Handle window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      // Special case for the placeholder image
      if (selectedImageId === -999) {
        console.log('Using placeholder image');
        
        // Create a simple placeholder result
        const placeholderUrl = "https://via.placeholder.com/600x400/4F46E5/FFFFFF?text=Placeholder";
        
        // Invalidate any relevant query cache to force refetch
        queryClient.invalidateQueries({queryKey: ["/api/gallery"]});
        
        toast({
          title: 'Placeholder image selected',
          description: 'The image has been updated to use a placeholder'
        });
        
        onSelectImage(selectedImageId);
        
        // Trigger a custom event to refresh images using the placeholder
        const replaceEvent = new CustomEvent('image-replaced', { 
          detail: { 
            originalUrl, 
            newImageId: selectedImageId,
            elementId,
            timestamp: Date.now(),
            newImageUrl: placeholderUrl
          } 
        });
        
        // Dispatch event after a short delay to ensure all components are ready
        setTimeout(() => {
          console.log('Dispatching image-replaced event for placeholder:', replaceEvent.detail);
          window.dispatchEvent(replaceEvent);
          
          // Close dialog after event is dispatched
          onClose();
        }, 200);
        
        return;
      }
      
      // Normal API-based replacement flow for real gallery images
      const payload: any = { 
        originalUrl,
        timestamp: Date.now() // Add timestamp to help prevent caching issues
      };
      
      // Determine the appropriate API endpoint based on the element ID
      let endpoint;
      
      // Check if this is an editable element (with the special ID format)
      const isEditableElement = elementId && typeof elementId === 'string' && 
          elementId.toString().startsWith('editable-element-');
      
      if (isEditableElement) {
        // For editable elements, use the special editable element endpoint format
        endpoint = `/api/gallery/${elementId}/replace-with/${selectedImageId}`;
        console.log(`Using editable element replacement endpoint: ${endpoint}`);
        
        // For editable elements, ensure we include the original URL in the payload
        if (originalUrl) {
          payload.originalUrl = originalUrl;
        }
      } 
      else if (elementId) {
        // For regular gallery images with an ID
        endpoint = `/api/gallery/${elementId}/replace-with/${selectedImageId}`;
      } 
      else {
        // Fallback for cases without an element ID (using -1 as placeholder)
        endpoint = `/api/gallery/-1/replace-with/${selectedImageId}`;
      }
      
      console.log(`Replacing image at endpoint: ${endpoint}`);
      console.log(`Original URL: ${originalUrl || 'None provided'}`);
      console.log(`Payload:`, payload);
      
      // Send the request using direct fetch call instead of the apiRequest abstraction
      // This ensures we have precise control over the request format
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include' // Important for sessions/cookies
      });
      
      if (!response.ok) {
        throw new Error('Failed to replace image');
      }
      
      const result = await response.json();
      console.log('Image replacement result:', result);
      
      // Invalidate any relevant query cache to force refetch
      queryClient.invalidateQueries({queryKey: ["/api/gallery"]});
      
      toast({
        title: 'Image replaced',
        description: 'The image has been successfully replaced'
      });
      
      onSelectImage(selectedImageId);
      
      // Add a timestamp to ensure the URL is unique and not cached
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      
      // Create a unique cache-busting URL to guarantee fresh content
      const originalImageUrl = result.image_url; 
      const cacheBuster = `?nocache=${timestamp}_${randomId}`;
      const uniqueImageUrl = originalImageUrl.split('?')[0] + cacheBuster;
      
      console.log('Original URL from server:', originalImageUrl);
      console.log('Cache-busting URL created:', uniqueImageUrl);
      
      // Trigger a custom event to refresh images using the new one with cache-busting
      const replaceEvent = new CustomEvent('image-replaced', { 
        detail: { 
          originalUrl, 
          newImageId: selectedImageId,
          elementId,
          timestamp: timestamp,
          newImageUrl: uniqueImageUrl,
          originalImageUrl: originalImageUrl
        } 
      });
      
      // First dispatch immediately
      console.log('Dispatching immediate image-replaced event');
      window.dispatchEvent(replaceEvent);
      
      // Then dispatch again after a delay to make sure components have updated
      setTimeout(() => {
        console.log('Dispatching delayed image-replaced event:', replaceEvent.detail);
        window.dispatchEvent(replaceEvent);
        
        // Try once more with a new timestamp to ensure the browser reloads the image
        setTimeout(() => {
          const finalEvent = new CustomEvent('image-replaced', { 
            detail: { 
              ...replaceEvent.detail,
              timestamp: Date.now(),
              newImageUrl: originalImageUrl.split('?')[0] + 
                `?final=${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
            } 
          });
          console.log('Dispatching final image-replaced event');
          window.dispatchEvent(finalEvent);
          
          // Close dialog after all events are dispatched
          onClose();
        }, 500);
      }, 300);
      
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

  // Filter gallery images based on search query
  const filterGalleryImages = (images: any[]) => {
    if (!searchQuery) return images;
    return images.filter((image: any) => {
      const altText = (image.alt_text || '').toLowerCase();
      const searchLower = searchQuery.toLowerCase();
      return altText.includes(searchLower);
    });
  };

  // Get images array from various possible response formats
  const getImagesArray = () => {
    if (galleryImages && Array.isArray(galleryImages)) {
      return filterGalleryImages(galleryImages);
    } else if (galleryImages && typeof galleryImages === 'object' && 'rows' in galleryImages && Array.isArray(galleryImages.rows)) {
      return filterGalleryImages(galleryImages.rows);
    }
    return [];
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        ref={dialogContentRef}
        className={`${isMobile ? 'max-w-[95vw] p-4' : 'sm:max-w-[800px]'} max-h-[80vh] overflow-auto touch-manipulation rounded-lg`}
      >
        <DialogHeader className={isMobile ? 'mb-2 space-y-1' : ''}>
          <DialogTitle className={isMobile ? 'text-lg' : ''}>
            {title}
            {elementId && <span className="ml-2 text-sm text-blue-500">#{elementId}</span>}
          </DialogTitle>
          <DialogDescription className={isMobile ? 'text-sm' : ''}>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        {/* Search input */}
        <div className="relative mb-4">
          <div className="flex items-center border rounded-md focus-within:ring-1 focus-within:ring-primary">
            <Search className="h-4 w-4 ml-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search images by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 bg-transparent outline-none text-sm"
            />
            {searchQuery && (
              <button 
                className="mr-2 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
        {/* Show original image if available */}
        {originalUrl && (
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Current Image:</h3>
            <div className="border rounded-md p-2 bg-slate-50 flex justify-center touch-manipulation">
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
            <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'sm:grid-cols-3 md:grid-cols-4 gap-4'} my-4`}>
              {(() => {
                const images = getImagesArray();
                
                if (images.length > 0) {
                  return images.map((image: any) => (
                    <div 
                      key={image.id}
                      onClick={() => setSelectedImageId(image.id)}
                      onTouchStart={() => {/* Improve touch response */}}
                      className={`border rounded-md p-2 cursor-pointer transition-all touch-manipulation hover:border-primary ${
                        selectedImageId === image.id ? 'ring-2 ring-primary border-primary bg-primary/5' : ''
                      } ${isMobile ? 'active:bg-primary/5' : ''}`}
                    >
                      <div className="relative">
                        <img 
                          src={image.thumbnail_url || image.image_url} 
                          alt={image.alt_text || 'Gallery image'} 
                          className={`w-full ${isMobile ? 'h-24' : 'h-32'} object-cover rounded`}
                          loading="lazy"
                        />
                        {selectedImageId === image.id && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center rounded">
                            <div className="bg-primary text-white p-1 rounded-full">
                              <ImageIcon className="h-5 w-5" />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className={`mt-1 ${isMobile ? 'text-[10px]' : 'text-xs'} truncate text-center`}>
                        {image.alt_text || `Image #${image.id}`}
                      </div>
                    </div>
                  ));
                } else if (searchQuery) {
                  return (
                    <div className="col-span-full py-4 text-center">
                      <div className="mb-4 text-muted-foreground">
                        No images found matching "{searchQuery}". Try a different search term or clear the search.
                      </div>
                      <Button variant="outline" onClick={() => setSearchQuery('')} className="mx-auto">
                        <X className="h-4 w-4 mr-2" />
                        Clear Search
                      </Button>
                    </div>
                  );
                } else {
                  return (
                    <div className="col-span-full py-4 text-center">
                      <div className="mb-4 text-muted-foreground">
                        No images found in gallery. You can use the placeholder image below:
                      </div>
                      <div 
                        onClick={() => setSelectedImageId(-999)}
                        onTouchStart={() => {/* Improve touch response */}}
                        className={`border rounded-md p-2 cursor-pointer mx-auto max-w-[200px] transition-all touch-manipulation hover:border-primary ${
                          selectedImageId === -999 ? 'ring-2 ring-primary border-primary bg-primary/5' : ''
                        } ${isMobile ? 'active:bg-primary/5' : ''}`}
                      >
                        <img 
                          src="https://via.placeholder.com/600x400/4F46E5/FFFFFF?text=Placeholder" 
                          alt="Placeholder image" 
                          className="w-full h-32 object-cover rounded"
                        />
                        <div className="mt-1 text-xs truncate text-center">
                          Placeholder Image
                        </div>
                      </div>
                    </div>
                  );
                }
              })()}
            </div>
            
            <DialogFooter className={isMobile ? 'flex-col sm:flex-row gap-2 sm:gap-0 mt-4' : 'mt-4'}>
              {isMobile && selectedImageId && (
                <div className="w-full flex items-center mb-3 pb-2 border-b">
                  <div className="flex-1 text-sm font-medium truncate">
                    Selected: {(() => {
                      const images = getImagesArray();
                      const selected = images.find((img: any) => img.id === selectedImageId);
                      return selected ? (selected.alt_text || `Image #${selected.id}`) : 
                             selectedImageId === -999 ? 'Placeholder Image' : 'Unknown';
                    })()}
                  </div>
                </div>
              )}
              
              <Button 
                variant="outline" 
                className={`touch-manipulation ${isMobile ? 'py-6 text-base w-full' : ''}`}
                onClick={onClose}
              >
                <X className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} mr-1`} />
                Cancel
              </Button>
              
              <Button 
                onClick={handleImageSelect} 
                disabled={!selectedImageId || isReplacing}
                className={`bg-blue-500 hover:bg-blue-600 touch-manipulation ${isMobile ? 'py-6 text-base w-full' : ''}`}
              >
                {isReplacing ? (
                  <Loader2 className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} mr-2 animate-spin`} />
                ) : (
                  <Replace className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} mr-2`} />
                )}
                {selectedImageId ? 'Replace Image' : 'Select an Image'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}