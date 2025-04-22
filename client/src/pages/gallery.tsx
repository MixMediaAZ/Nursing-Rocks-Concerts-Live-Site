import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Gallery, MediaFolder } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Copy, Trash2, Download, Edit, Layers, Folder,
  Plus, ImageIcon, CheckCircle2, ChevronsUpDown, Save
} from "lucide-react";
import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { MediaFolderSelector } from "@/components/media-folder-selector";
import { GalleryUploader } from "@/components/gallery-uploader";

export default function GalleryPage() {
  const { data: images, isLoading } = useQuery<Gallery[]>({
    queryKey: ["/api/gallery"],
  });
  
  const [visibleImages, setVisibleImages] = useState(12);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Gallery[]>([]);
  const [clipboardImage, setClipboardImage] = useState<Gallery | null>(null);
  const [displayStyle, setDisplayStyle] = useState<"grid" | "card" | "box">("grid");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [imagesToDelete, setImagesToDelete] = useState<Gallery[]>([]);
  
  // Media folder states
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [showFolderManager, setShowFolderManager] = useState(false);
  const [showUploaderDialog, setShowUploaderDialog] = useState(false);
  const [viewingAttachedAssets, setViewingAttachedAssets] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
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

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFolderManager(!showFolderManager)}
                      className={showFolderManager ? "bg-[#5D3FD3] text-white" : ""}
                    >
                      <Folder className="h-4 w-4 mr-2" />
                      {showFolderManager ? "Hide Folders" : "Manage Folders"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Organize media into folders</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-[#5D3FD3] text-white hover:bg-[#5D3FD3]/90"
                      onClick={() => setShowUploaderDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Upload Media
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Upload new media to gallery</p>
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
              
              {isEditMode && selectedImages.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected ({selectedImages.length})
                </Button>
              )}
            </div>
          </div>
          
          {/* Layout with folder panel */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Folder sidebar - only shown when showFolderManager is true */}
            {showFolderManager && (
              <div className="md:w-64 flex-shrink-0">
                <div className="sticky top-20">
                  <MediaFolderSelector
                    selectedFolderId={selectedFolderId}
                    onFolderSelect={(folderId) => {
                      setSelectedFolderId(folderId);
                      setViewingAttachedAssets(false);
                    }}
                    className="mb-4"
                  />
                  
                  {/* Special option for attached assets */}
                  <Card className="mb-4">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-medium">Special Folders</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={`w-full justify-start mb-2 ${viewingAttachedAssets ? "bg-[#5D3FD3] text-white" : ""}`}
                        onClick={() => {
                          setViewingAttachedAssets(true);
                          setSelectedFolderId(null);
                          toast({
                            title: "View Attached Assets",
                            description: "Browsing attached assets folder"
                          });
                        }}
                      >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Attached Assets
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
            
            {/* Main content */}
            <div className={`flex-1 ${showFolderManager ? 'md:max-w-[calc(100%-17rem)]' : 'w-full'}`}>
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
                  ) : viewingAttachedAssets ? (
                    // Render attached assets
                    <div className="mt-4">
                      <h2 className="text-xl font-bold mb-4">Attached Assets</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <Card key={i} className="overflow-hidden">
                            <CardContent className="p-0">
                              <div className="relative h-48 bg-gray-100 flex items-center justify-center">
                                <ImageIcon className="h-12 w-12 text-gray-400" />
                              </div>
                            </CardContent>
                            <CardFooter className="p-3">
                              <p className="text-sm font-medium truncate">attached_asset_{i+1}.jpg</p>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    // Render normal gallery
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {images?.slice(0, visibleImages).map((image) => (
                        <Card key={image.id} className="overflow-hidden">
                          <div className="relative">
                            <img 
                              src={image.image_url} 
                              alt={image.alt_text || "Gallery image"} 
                              className="w-full h-48 object-cover" 
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
                          <CardFooter className="flex justify-between p-3">
                            <p className="text-sm truncate">Image #{image.id}</p>
                            {isEditMode && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="p-0 h-8 w-8"
                                onClick={() => handleDeleteImage(image)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                  
                  {!viewingAttachedAssets && images && visibleImages < images.length && (
                    <div className="text-center mt-12">
                      <Button 
                        onClick={loadMoreImages}
                        className="bg-[#5D3FD3] hover:bg-[#5D3FD3]/90 text-white font-accent font-semibold py-3 px-8 rounded-full"
                      >
                        <span>View More Photos</span>
                      </Button>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="event1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {isLoading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-72 w-full rounded-lg" />
                      ))
                    ) : (
                      images?.filter(img => img.event_id === 1).map((image) => (
                        <Card key={image.id} className="overflow-hidden">
                          <div className="relative">
                            <img 
                              src={image.image_url} 
                              alt={image.alt_text || "Gallery image"} 
                              className="w-full h-48 object-cover" 
                            />
                          </div>
                          <CardFooter className="p-3">
                            <p className="text-sm truncate">Chicago Image #{image.id}</p>
                          </CardFooter>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="event2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {isLoading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-72 w-full rounded-lg" />
                      ))
                    ) : (
                      images?.filter(img => img.event_id === 2).map((image) => (
                        <Card key={image.id} className="overflow-hidden">
                          <div className="relative">
                            <img 
                              src={image.image_url} 
                              alt={image.alt_text || "Gallery image"} 
                              className="w-full h-48 object-cover" 
                            />
                          </div>
                          <CardFooter className="p-3">
                            <p className="text-sm truncate">New York Image #{image.id}</p>
                          </CardFooter>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </section>
      
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
      
      {/* Upload Dialog */}
      <Dialog open={showUploaderDialog} onOpenChange={setShowUploaderDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogTitle>Upload Media</DialogTitle>
          <DialogDescription>
            Upload images to the gallery. You can select multiple files at once.
          </DialogDescription>
          
          <GalleryUploader 
            folderId={selectedFolderId}
            onUploadComplete={() => {
              setShowUploaderDialog(false);
              queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
            }} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
}