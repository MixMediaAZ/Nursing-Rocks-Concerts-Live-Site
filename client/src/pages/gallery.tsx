import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Gallery, MediaFolder } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Search, X, Copy, Trash2, Download, Edit, Move, Layers, 
  Replace, ChevronsUpDown, Save, CheckCircle2, FolderPlus,
  Plus, Grid, List, ImageIcon, Video, Music, Presentation, Filter, SlidersHorizontal
} from "lucide-react";
import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MediaFolderSelector } from "@/components/media-folder-selector";
import { GalleryUploader } from "@/components/gallery-uploader";

// This component is a dedicated gallery page
const GalleryPage = () => {
  const { data: images, isLoading } = useQuery<Gallery[]>({
    queryKey: ["/api/gallery"],
  });
  
  const { data: events } = useQuery<any[]>({
    queryKey: ["/api/events"],
  });
  
  const [visibleImages, setVisibleImages] = useState(12);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Gallery[]>([]);
  const [clipboardImage, setClipboardImage] = useState<Gallery | null>(null);
  const [displayStyle, setDisplayStyle] = useState<"grid" | "card" | "box">("grid");
  const [isReplacingImage, setIsReplacingImage] = useState(false);
  const [imageToReplace, setImageToReplace] = useState<Gallery | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [imagesToDelete, setImagesToDelete] = useState<Gallery[]>([]);
  const [zIndexValues, setZIndexValues] = useState<{[key: number]: number}>({});
  const [showZIndexModal, setShowZIndexModal] = useState(false);
  const [currentZIndexImage, setCurrentZIndexImage] = useState<Gallery | null>(null);
  const [zIndexValue, setZIndexValue] = useState(0);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const loadMoreImages = () => {
    setVisibleImages(prev => prev + 12);
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (imageIds: number[]) => {
      return Promise.all(imageIds.map(id => 
        apiRequest("DELETE", `/api/gallery/${id}`)
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      toast({
        title: "Success",
        description: `Deleted ${imagesToDelete.length} image(s)`,
      });
      setImagesToDelete([]);
      setSelectedImages([]);
    },
    onError: (error) => {
      toast({
        title: "Failed to delete images",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Upload replacement image mutation
  const replaceImageMutation = useMutation({
    mutationFn: async (data: { file: File, imageId: number }) => {
      const formData = new FormData();
      formData.append("images", data.file);
      
      // First upload the new image
      const uploadResponse = await fetch("/api/gallery/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        throw new Error("Failed to upload replacement image");
      }
      
      const uploadResult = await uploadResponse.json();
      const newImageId = uploadResult.images[0].id;
      
      // Then delete the old image
      await apiRequest("DELETE", `/api/gallery/${data.imageId}`);
      
      return {
        oldImageId: data.imageId,
        newImageId,
        newImage: uploadResult.images[0]
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      toast({
        title: "Image Replaced",
        description: "The image has been successfully replaced",
      });
      setIsReplacingImage(false);
      setImageToReplace(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to replace image",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Copy image to clipboard
  const copyImage = (image: Gallery) => {
    setClipboardImage(image);
    toast({
      title: "Image Copied",
      description: "The image has been copied to the clipboard",
    });
  };

  // Paste image as a new upload
  const pasteImage = async () => {
    if (!clipboardImage) return;
    
    try {
      // Fetch the image
      const response = await fetch(clipboardImage.image_url);
      const blob = await response.blob();
      
      // Create a file from the blob
      const file = new File([blob], `pasted-image-${Date.now()}.jpg`, { type: blob.type });
      
      // Create form data and upload
      const formData = new FormData();
      formData.append("images", file);
      if (clipboardImage.event_id) {
        formData.append("event_id", clipboardImage.event_id.toString());
      }
      formData.append("alt_text", clipboardImage.alt_text || "Pasted image");
      
      const uploadResponse = await fetch("/api/gallery/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        throw new Error("Failed to paste image");
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      toast({
        title: "Image Pasted",
        description: "The image has been successfully pasted",
      });
    } catch (error) {
      toast({
        title: "Failed to paste image",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // Handle file selection for replacement
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && imageToReplace) {
      const file = e.target.files[0];
      replaceImageMutation.mutate({ file, imageId: imageToReplace.id });
    }
  };

  // Handle replacement trigger
  const handleReplaceImage = (image: Gallery) => {
    setImageToReplace(image);
    setIsReplacingImage(true);
    
    // Trigger file input click
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }, 100);
  };

  // Handle download
  const handleDownloadImage = (image: Gallery) => {
    const link = document.createElement('a');
    link.href = image.image_url;
    link.download = `nursing-rocks-image-${image.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle delete
  const handleDeleteImage = (image: Gallery) => {
    setImagesToDelete([image]);
    setShowDeleteConfirmation(true);
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedImages.length === 0) return;
    
    setImagesToDelete(selectedImages);
    setShowDeleteConfirmation(true);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (imagesToDelete.length === 0) return;
    
    deleteMutation.mutate(imagesToDelete.map(img => img.id));
    setShowDeleteConfirmation(false);
  };

  // Handle image selection
  const toggleImageSelection = (image: Gallery) => {
    setSelectedImages(prev => {
      const isSelected = prev.some(img => img.id === image.id);
      if (isSelected) {
        return prev.filter(img => img.id !== image.id);
      } else {
        return [...prev, image];
      }
    });
  };

  // Handle Z-index change
  const handleZIndexChange = (image: Gallery) => {
    setCurrentZIndexImage(image);
    setZIndexValue(zIndexValues[image.id] || 0);
    setShowZIndexModal(true);
  };

  // Save Z-index
  const saveZIndex = () => {
    if (!currentZIndexImage) return;
    
    setZIndexValues(prev => ({
      ...prev,
      [currentZIndexImage.id]: zIndexValue
    }));
    
    setShowZIndexModal(false);
    
    toast({
      title: "Layer Updated",
      description: `Image layer set to ${zIndexValue}`,
    });
  };

  // Shortcut key handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+C to copy the first selected image
      if (e.ctrlKey && e.key === 'c' && selectedImages.length > 0) {
        copyImage(selectedImages[0]);
      }
      
      // Ctrl+V to paste
      if (e.ctrlKey && e.key === 'v' && clipboardImage) {
        pasteImage();
      }
      
      // Delete key to delete selected images
      if (e.key === 'Delete' && selectedImages.length > 0) {
        handleBulkDelete();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImages, clipboardImage]);

  return (
    <>
      <Helmet>
        <title>Concert Gallery | Nursing Rocks Concert Series</title>
        <meta name="description" content="Explore photos from past Nursing Rocks concerts and events celebrating healthcare heroes" />
      </Helmet>
      
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="font-heading text-4xl font-bold mb-2">Concert Gallery</h1>
              <p className="text-[#333333]/70">Relive the magic from our previous events</p>
            </div>
            
            <div className="flex items-center gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditMode(!isEditMode)}
                      className={isEditMode ? "bg-[#5D3FD3] text-white" : ""}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {isEditMode ? "Exit Edit Mode" : "Edit Mode"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle edit mode to manage gallery images</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Layers className="h-4 w-4 mr-2" />
                    Display
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Display Style</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setDisplayStyle("grid")}>
                    <div className="flex items-center">
                      Grid Layout
                      {displayStyle === "grid" && (
                        <CheckCircle2 className="h-4 w-4 ml-2 text-green-600" />
                      )}
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDisplayStyle("card")}>
                    <div className="flex items-center">
                      Card Layout
                      {displayStyle === "card" && (
                        <CheckCircle2 className="h-4 w-4 ml-2 text-green-600" />
                      )}
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDisplayStyle("box")}>
                    <div className="flex items-center">
                      Box Layout
                      {displayStyle === "box" && (
                        <CheckCircle2 className="h-4 w-4 ml-2 text-green-600" />
                      )}
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {isEditMode && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={pasteImage}
                    disabled={!clipboardImage}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Paste Image
                  </Button>
                  
                  {selectedImages.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected ({selectedImages.length})
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
          
          <Tabs defaultValue="all" className="mb-8">
            <TabsList className="mx-auto flex justify-center">
              <TabsTrigger value="all">All Photos</TabsTrigger>
              <TabsTrigger value="event1">Chicago Event</TabsTrigger>
              <TabsTrigger value="event2">New York Event</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton key={i} className="h-72 w-full rounded-lg" />
                  ))}
                </div>
              ) : (
                <>
                  <RenderGalleryImages 
                    images={images?.slice(0, visibleImages) || []} 
                    isEditMode={isEditMode}
                    selectedImages={selectedImages}
                    toggleImageSelection={toggleImageSelection}
                    copyImage={copyImage}
                    handleDeleteImage={handleDeleteImage}
                    handleDownloadImage={handleDownloadImage}
                    handleReplaceImage={handleReplaceImage}
                    handleZIndexChange={handleZIndexChange}
                    displayStyle={displayStyle}
                    zIndexValues={zIndexValues}
                  />
                  
                  {images && visibleImages < images.length && (
                    <div className="text-center mt-12">
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
            </TabsContent>
            <TabsContent value="event1">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-72 w-full rounded-lg" />
                  ))}
                </div>
              ) : (
                <RenderGalleryImages 
                  images={images?.filter(img => img.event_id === 1) || []} 
                  isEditMode={isEditMode}
                  selectedImages={selectedImages}
                  toggleImageSelection={toggleImageSelection}
                  copyImage={copyImage}
                  handleDeleteImage={handleDeleteImage}
                  handleDownloadImage={handleDownloadImage}
                  handleReplaceImage={handleReplaceImage}
                  handleZIndexChange={handleZIndexChange}
                  displayStyle={displayStyle}
                  zIndexValues={zIndexValues}
                />
              )}
            </TabsContent>
            <TabsContent value="event2">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-72 w-full rounded-lg" />
                  ))}
                </div>
              ) : (
                <RenderGalleryImages 
                  images={images?.filter(img => img.event_id === 2) || []} 
                  isEditMode={isEditMode}
                  selectedImages={selectedImages}
                  toggleImageSelection={toggleImageSelection}
                  copyImage={copyImage}
                  handleDeleteImage={handleDeleteImage}
                  handleDownloadImage={handleDownloadImage}
                  handleReplaceImage={handleReplaceImage}
                  handleZIndexChange={handleZIndexChange}
                  displayStyle={displayStyle}
                  zIndexValues={zIndexValues}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
      
      {/* Hidden file input for image replacement */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={handleFileChange}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {imagesToDelete.length} image(s) from the gallery. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </span>
              ) : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Z-Index Dialog */}
      <Dialog open={showZIndexModal} onOpenChange={setShowZIndexModal}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Change Image Layer</DialogTitle>
          <DialogDescription>
            Adjust the layer position (z-index) of this image. Higher values will display on top of other images.
          </DialogDescription>
          
          <div className="py-4">
            <Label htmlFor="z-index">Layer Position (Z-Index)</Label>
            <div className="flex items-center gap-4 mt-2">
              <Input
                id="z-index"
                type="number"
                value={zIndexValue}
                onChange={(e) => setZIndexValue(parseInt(e.target.value) || 0)}
                min={-10}
                max={10}
              />
              <ChevronsUpDown className="h-4 w-4 text-gray-500" />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowZIndexModal(false)}>
              Cancel
            </Button>
            <Button onClick={saveZIndex}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Component to render gallery images based on display style
const RenderGalleryImages = ({ 
  images,
  isEditMode,
  selectedImages,
  toggleImageSelection,
  copyImage,
  handleDeleteImage,
  handleDownloadImage,
  handleReplaceImage,
  handleZIndexChange,
  displayStyle,
  zIndexValues
}: { 
  images: Gallery[],
  isEditMode: boolean,
  selectedImages: Gallery[],
  toggleImageSelection: (image: Gallery) => void,
  copyImage: (image: Gallery) => void,
  handleDeleteImage: (image: Gallery) => void,
  handleDownloadImage: (image: Gallery) => void,
  handleReplaceImage: (image: Gallery) => void,
  handleZIndexChange: (image: Gallery) => void,
  displayStyle: "grid" | "card" | "box",
  zIndexValues: {[key: number]: number}
}) => {
  if (displayStyle === "grid") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {images.map((image) => (
          <div 
            key={image.id} 
            className="relative"
            style={{ zIndex: zIndexValues[image.id] || 0 }}
          >
            <GalleryImage 
              image={image} 
              isEditMode={isEditMode}
              isSelected={selectedImages.some(img => img.id === image.id)}
              onSelect={() => toggleImageSelection(image)}
              onCopy={() => copyImage(image)}
              onDelete={() => handleDeleteImage(image)}
              onDownload={() => handleDownloadImage(image)}
              onReplace={() => handleReplaceImage(image)}
              onChangeZIndex={() => handleZIndexChange(image)}
            />
          </div>
        ))}
      </div>
    );
  }
  
  if (displayStyle === "card") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {images.map((image) => (
          <Card 
            key={image.id} 
            className="overflow-hidden"
            style={{ zIndex: zIndexValues[image.id] || 0 }}
          >
            <CardContent className="p-0">
              <div className="relative">
                <img 
                  src={image.image_url} 
                  alt={image.alt_text || "Concert moment"} 
                  className="w-full h-64 object-cover" 
                />
                {isEditMode && (
                  <div className="absolute top-2 left-2">
                    <input
                      type="checkbox"
                      checked={selectedImages.some(img => img.id === image.id)}
                      onChange={() => toggleImageSelection(image)}
                      className="h-5 w-5"
                    />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between p-4">
              <p className="text-sm text-gray-500 truncate">
                {image.alt_text || "Concert moment"}
              </p>
              
              {isEditMode && (
                <div className="flex space-x-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost" 
                          size="icon"
                          onClick={() => copyImage(image)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copy Image</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDownloadImage(image)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Download Image</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleReplaceImage(image)}
                        >
                          <Replace className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Replace Image</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleZIndexChange(image)}
                        >
                          <Layers className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Change Layer</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteImage(image)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete Image</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }
  
  // Box layout
  return (
    <div className="flex flex-wrap gap-6">
      {images.map((image) => (
        <div 
          key={image.id} 
          className="w-48 h-48 relative border border-gray-200 rounded-md overflow-hidden shadow-sm"
          style={{ zIndex: zIndexValues[image.id] || 0 }}
        >
          <img 
            src={image.image_url} 
            alt={image.alt_text || "Concert moment"} 
            className="w-full h-full object-cover" 
          />
          
          {isEditMode && (
            <>
              <div className="absolute top-2 left-2">
                <input
                  type="checkbox"
                  checked={selectedImages.some(img => img.id === image.id)}
                  onChange={() => toggleImageSelection(image)}
                  className="h-4 w-4"
                />
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 flex justify-between items-center">
                <Button
                  variant="ghost" 
                  size="icon"
                  className="h-6 w-6 p-0 text-white hover:text-white hover:bg-white/20"
                  onClick={() => copyImage(image)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                
                <Button
                  variant="ghost" 
                  size="icon"
                  className="h-6 w-6 p-0 text-white hover:text-white hover:bg-white/20"
                  onClick={() => handleReplaceImage(image)}
                >
                  <Replace className="h-3 w-3" />
                </Button>
                
                <Button
                  variant="ghost" 
                  size="icon"
                  className="h-6 w-6 p-0 text-white hover:text-white hover:bg-white/20"
                  onClick={() => handleZIndexChange(image)}
                >
                  <Layers className="h-3 w-3" />
                </Button>
                
                <Button
                  variant="ghost" 
                  size="icon"
                  className="h-6 w-6 p-0 text-white hover:text-white hover:bg-white/20"
                  onClick={() => handleDeleteImage(image)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

// Enhanced gallery image component with editing capabilities
const GalleryImage = ({ 
  image, 
  isEditMode = false,
  isSelected = false,
  onSelect = () => {},
  onCopy = () => {},
  onDelete = () => {},
  onDownload = () => {},
  onReplace = () => {},
  onChangeZIndex = () => {}
}: { 
  image: Gallery, 
  isEditMode?: boolean,
  isSelected?: boolean,
  onSelect?: () => void,
  onCopy?: () => void,
  onDelete?: () => void,
  onDownload?: () => void,
  onReplace?: () => void,
  onChangeZIndex?: () => void
}) => {
  // View mode: regular gallery image
  if (!isEditMode) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <div className="relative group overflow-hidden rounded-lg cursor-pointer">
            <img 
              src={image.image_url} 
              alt={image.alt_text || "Concert moment"} 
              className="w-full h-72 object-cover transition-transform duration-500 group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-[#5D3FD3]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="bg-white/90 rounded-full p-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <Search className="text-[#5D3FD3]" size={16} />
              </div>
            </div>
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-none">
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
  }
  
  // Edit mode: add edit controls
  return (
    <div className="relative group overflow-hidden rounded-lg">
      <img 
        src={image.image_url} 
        alt={image.alt_text || "Concert moment"} 
        className={`w-full h-72 object-cover ${isSelected ? 'ring-2 ring-[#5D3FD3]' : ''}`}
      />
      
      {/* Selection checkbox */}
      <div className="absolute top-2 left-2 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="h-5 w-5"
        />
      </div>
      
      {/* Edit controls overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-center items-center gap-4">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onCopy();
            }}
            className="bg-white/90 hover:bg-white text-black"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            className="bg-white/90 hover:bg-white text-black"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onReplace();
            }}
            className="bg-white/90 hover:bg-white text-black"
          >
            <Replace className="h-4 w-4 mr-2" />
            Replace
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onChangeZIndex();
            }}
            className="bg-white/90 hover:bg-white text-black"
          >
            <Layers className="h-4 w-4 mr-2" />
            Layer
          </Button>
        </div>
        
        <Button
          variant="destructive"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  );
};

export default GalleryPage;