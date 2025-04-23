import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Gallery } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { 
  ArrowUpDown, CheckSquare, Copy, Trash2, Edit, 
  Filter, Folder, Plus, ImageIcon, CheckCircle2
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
import { Badge } from "@/components/ui/badge";
import { GalleryUploader } from "@/components/gallery-uploader";
import FixedGalleryGrid from "@/components/fixed-gallery-grid";
import { ImageViewer } from "@/components/image-viewer";

export default function GalleryPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { data: images, isLoading } = useQuery<Gallery[]>({
    queryKey: ["/api/gallery"],
  });
  
  const [visibleImages, setVisibleImages] = useState(12);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Gallery[]>([]);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [imagesToDelete, setImagesToDelete] = useState<Gallery[]>([]);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "name">("newest");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  
  // Media states
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [showFolderManager, setShowFolderManager] = useState(false);
  const [showUploaderDialog, setShowUploaderDialog] = useState(false);
  const [viewingAttachedAssets, setViewingAttachedAssets] = useState(false);
  const [selectedImage, setSelectedImage] = useState<Gallery | null>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Check if user is logged in or has admin PIN access
  useEffect(() => {
    const token = localStorage.getItem("token");
    const adminPinVerified = localStorage.getItem("adminPinVerified");
    
    if (token || adminPinVerified === "true") {
      setIsLoggedIn(true);
      
      // If accessing from admin, auto-enable edit mode
      if (adminPinVerified === "true") {
        setIsEditMode(true);
      }
    } else {
      setIsLoggedIn(false);
      setIsEditMode(false);
    }
  }, []);
  
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
  
  // Sort and filter images
  const getSortedAndFilteredImages = (images: Gallery[] | undefined) => {
    if (!images) return [];
    
    let filteredImages = [...images];
    
    // Apply folder filtering
    if (selectedFolderId !== null) {
      filteredImages = filteredImages.filter(img => img.folder_id === selectedFolderId);
    }
    
    // Apply tag filtering
    if (filterTag) {
      filteredImages = filteredImages.filter(img => 
        img.alt_text?.toLowerCase().includes(filterTag.toLowerCase())
      );
    }
    
    // Apply sorting
    return filteredImages.sort((a, b) => {
      switch (sortOrder) {
        case "newest":
          return b.id - a.id;
        case "oldest":
          return a.id - b.id;
        case "name":
          return (a.alt_text || "").localeCompare(b.alt_text || "");
        default:
          return b.id - a.id;
      }
    });
  };
  
  // Select/deselect all images
  const handleSelectAllImages = () => {
    if (images) {
      if (selectedImages.length === images.length) {
        // If all are selected, deselect all
        setSelectedImages([]);
      } else {
        // Otherwise, select all
        setSelectedImages([...images]);
      }
    }
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
              {isLoggedIn ? (
                <>
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
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = "/login"}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Login to Edit
                </Button>
              )}
              
              {/* Sort Options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Sort Images</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortOrder("newest")}>
                    <div className="flex items-center">
                      Newest First
                      {sortOrder === "newest" && (
                        <CheckCircle2 className="h-4 w-4 ml-2 text-green-600" />
                      )}
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOrder("oldest")}>
                    <div className="flex items-center">
                      Oldest First
                      {sortOrder === "oldest" && (
                        <CheckCircle2 className="h-4 w-4 ml-2 text-green-600" />
                      )}
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOrder("name")}>
                    <div className="flex items-center">
                      By Name
                      {sortOrder === "name" && (
                        <CheckCircle2 className="h-4 w-4 ml-2 text-green-600" />
                      )}
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-sm">
                    Filter by tag:
                  </div>
                  <div className="px-2 py-1.5">
                    {filterTag && (
                      <Badge variant="outline" className="bg-[#5D3FD3]/10">
                        <Filter className="h-3 w-3 mr-1" />
                        {filterTag}
                      </Badge>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-8">
            <div className={`flex-1 ${showFolderManager ? 'md:max-w-[calc(100%-17rem)]' : 'w-full'}`}>
              <Tabs defaultValue="all" className="mb-8">
                <TabsList className="mx-auto flex justify-center">
                  <TabsTrigger value="all">All Photos</TabsTrigger>
                  <TabsTrigger value="event1">Chicago Event</TabsTrigger>
                  <TabsTrigger value="event2">New York Event</TabsTrigger>
                </TabsList>
                <TabsContent value="all">
                  {viewingAttachedAssets ? (
                    <div className="mt-4">
                      <h2 className="text-xl font-bold mb-4">Attached Assets</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <div key={i} className="bg-gray-100 p-4 rounded flex items-center justify-center">
                            <ImageIcon className="h-12 w-12 text-gray-400" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <FixedGalleryGrid
                        title=""
                        subtitle=""
                        images={Array.isArray(images) ? getSortedAndFilteredImages(images).slice(0, visibleImages) : []}
                        isLoading={isLoading}
                        isEditMode={isEditMode}
                        onDeleteImage={handleDeleteImage}
                      />
                    
                      {!viewingAttachedAssets && images && visibleImages < (images?.length || 0) && (
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
                  <FixedGalleryGrid
                    title=""
                    subtitle=""
                    images={Array.isArray(images) ? getSortedAndFilteredImages(images)
                      .filter(img => img.event_id === 1)
                      .slice(0, visibleImages) : []}
                    isLoading={isLoading}
                    isEditMode={isEditMode}
                    onDeleteImage={handleDeleteImage}
                  />
                </TabsContent>
                
                <TabsContent value="event2">
                  <FixedGalleryGrid
                    title=""
                    subtitle=""
                    images={Array.isArray(images) ? getSortedAndFilteredImages(images)
                      .filter(img => img.event_id === 2)
                      .slice(0, visibleImages) : []}
                    isLoading={isLoading}
                    isEditMode={isEditMode}
                    onDeleteImage={handleDeleteImage}
                  />
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
            <AlertDialogTitle>Delete Image{imagesToDelete.length > 1 ? 's' : ''}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {imagesToDelete.length} image{imagesToDelete.length > 1 ? 's' : ''}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Media Uploader Dialog */}
      {showUploaderDialog && (
        <Dialog open={showUploaderDialog} onOpenChange={setShowUploaderDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogTitle>Upload Media</DialogTitle>
            <GalleryUploader 
              folderId={selectedFolderId}
              onUploadComplete={() => {
                setShowUploaderDialog(false);
                queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
              }} 
            />
          </DialogContent>
        </Dialog>
      )}
      
      {/* Image Viewer */}
      <ImageViewer
        image={selectedImage}
        isVisible={showImageViewer}
        onClose={() => setShowImageViewer(false)}
        imageList={images || []}
        onNavigate={setSelectedImage}
        allowDownload={isLoggedIn}
      />
    </>
  );
}