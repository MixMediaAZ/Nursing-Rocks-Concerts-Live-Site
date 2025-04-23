import { useState, useEffect } from "react";
import { Gallery } from "@shared/schema";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GalleryUploader } from "./gallery-uploader";
import { SafeImage } from "./safe-image";
import { Loader2, ArrowRight, CheckCircle2 } from "lucide-react";

interface ReplaceImageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetImage: Gallery | null;
  onReplaceComplete?: () => void;
}

interface GalleryResponse {
  rows?: Gallery[];
}

export function ReplaceImageDialog({
  isOpen,
  onClose,
  targetImage,
  onReplaceComplete
}: ReplaceImageDialogProps) {
  const [selectedReplacement, setSelectedReplacement] = useState<Gallery | null>(null);
  const [activeTab, setActiveTab] = useState<string>("existing");
  const [uploadComplete, setUploadComplete] = useState(false);
  const [newUploadedImage, setNewUploadedImage] = useState<Gallery | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedReplacement(null);
      setActiveTab("existing");
      setUploadComplete(false);
      setNewUploadedImage(null);
    }
  }, [isOpen]);

  // Fetch gallery images
  const { data: galleryImages, isLoading: isLoadingGallery } = useQuery<Gallery[] | GalleryResponse>({
    queryKey: ["/api/gallery"],
    enabled: isOpen && activeTab === "existing",
  });

  // Process gallery data to handle different API response formats
  const images = Array.isArray(galleryImages) 
    ? galleryImages 
    : galleryImages?.rows || [];

  // Replace image mutation
  const replaceMutation = useMutation({
    mutationFn: async (data: { targetId: number; newImageId: number }) => {
      return await apiRequest(
        "POST",
        `/api/gallery/replace/${data.targetId}`,
        { body: JSON.stringify({ newImageId: data.newImageId }) }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      toast({
        title: "Success",
        description: "Image replaced successfully",
        variant: "default",
      });
      if (onReplaceComplete) {
        onReplaceComplete();
      }
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to replace image",
        variant: "destructive",
      });
    }
  });

  // Handle image selection
  const handleSelectImage = (image: Gallery) => {
    setSelectedReplacement(image);
  };

  // Handle replacement confirmation
  const handleConfirmReplacement = () => {
    if (!targetImage || !selectedReplacement) return;
    
    replaceMutation.mutate({
      targetId: targetImage.id,
      newImageId: selectedReplacement.id
    });
  };

  // Handle upload complete
  const handleUploadComplete = (uploadedImage: Gallery) => {
    setNewUploadedImage(uploadedImage);
    setUploadComplete(true);
    setSelectedReplacement(uploadedImage);
    queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Replace Image</DialogTitle>
          <DialogDescription>
            Select a new image to replace the current one. The new image will be automatically resized to match the dimensions of the original.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {/* Original image preview */}
          {targetImage && (
            <div className="mb-6 p-4 border rounded-md bg-gray-50">
              <h3 className="text-sm font-medium mb-2">Original Image</h3>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 relative flex-shrink-0">
                  <SafeImage
                    src={targetImage.image_url}
                    alt={targetImage.alt_text || `Image ${targetImage.id}`}
                    className="w-full h-full object-cover rounded-md border"
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-600">ID: {targetImage.id}</p>
                  <p className="text-sm text-gray-600 truncate max-w-md">
                    {targetImage.alt_text || `Image ${targetImage.id}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tabs for selecting replacement method */}
          <Tabs defaultValue="existing" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="existing">Choose Existing Image</TabsTrigger>
              <TabsTrigger value="upload">Upload New Image</TabsTrigger>
            </TabsList>

            {/* Existing images tab */}
            <TabsContent value="existing" className="space-y-4">
              {isLoadingGallery ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-96 overflow-y-auto p-2">
                    {images.map((image: Gallery) => (
                      <div
                        key={image.id}
                        className={`relative border rounded-md overflow-hidden cursor-pointer transition-all ${
                          selectedReplacement?.id === image.id
                            ? "ring-2 ring-primary ring-offset-2"
                            : "hover:border-primary"
                        }`}
                        onClick={() => handleSelectImage(image)}
                      >
                        <div className="aspect-square">
                          <SafeImage
                            src={image.image_url}
                            alt={image.alt_text || `Image ${image.id}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {selectedReplacement?.id === image.id && (
                          <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {images.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No images available. Upload some images first.
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* Upload new image tab */}
            <TabsContent value="upload">
              {!uploadComplete ? (
                <GalleryUploader
                  onUploadComplete={(imageData: any) => {
                    if (imageData) {
                      handleUploadComplete(imageData as Gallery);
                    }
                  }}
                />
              ) : (
                <div className="p-4 border rounded-md bg-green-50">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <CheckCircle2 className="h-5 w-5" />
                    <p className="font-medium">Upload Complete</p>
                  </div>
                  {newUploadedImage && (
                    <div className="flex items-center gap-4 mt-2">
                      <div className="w-16 h-16 relative flex-shrink-0">
                        <SafeImage
                          src={newUploadedImage.image_url}
                          alt={newUploadedImage.alt_text || `New Image`}
                          className="w-full h-full object-cover rounded-md border"
                        />
                      </div>
                      <p className="text-sm text-gray-600">
                        This image will be used as the replacement.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Preview of replacement */}
          {targetImage && selectedReplacement && (
            <div className="mt-6 p-4 border rounded-md bg-blue-50">
              <h3 className="text-sm font-medium mb-3">Preview Replacement</h3>
              <div className="flex items-center justify-center gap-4">
                <div className="w-24 h-24 relative flex-shrink-0">
                  <SafeImage
                    src={targetImage.image_url}
                    alt={targetImage.alt_text || `Original Image`}
                    className="w-full h-full object-cover rounded-md border"
                  />
                </div>
                <ArrowRight className="h-6 w-6 text-gray-400" />
                <div className="w-24 h-24 relative flex-shrink-0">
                  <SafeImage
                    src={selectedReplacement.image_url}
                    alt={selectedReplacement.alt_text || `New Image`}
                    className="w-full h-full object-cover rounded-md border"
                  />
                </div>
                <div className="ml-2 text-sm text-gray-600">
                  <p>The new image will be automatically resized to match the original dimensions.</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmReplacement}
              disabled={!selectedReplacement || replaceMutation.isPending}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {replaceMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Replacing...
                </>
              ) : (
                "Replace Image"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}