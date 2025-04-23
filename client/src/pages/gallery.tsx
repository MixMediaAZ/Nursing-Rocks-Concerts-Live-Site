import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Gallery } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { 
  ArrowUpDown, CheckSquare, Copy, Trash2, Edit, 
  Filter, Folder, Plus, ImageIcon, CheckCircle2,
  Search, Replace, Download, List, Grid, X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import FixedGalleryGrid from "@/components/fixed-gallery-grid";
import { ImageViewer } from "@/components/image-viewer";
import { GalleryUploader } from "@/components/gallery-uploader";
import { SafeImage } from "@/components/safe-image";

export default function GalleryPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["/api/gallery"],
  });
  
  // Handle different API response formats
  const [images, setImages] = useState<Gallery[]>([]);
  
  useEffect(() => {
    if (data) {
      if (Array.isArray(data)) {
        setImages(data);
      } else if (typeof data === 'object' && 'rows' in data) {
        // Handle API response that returns { rows: [] }
        setImages(data.rows as Gallery[]);
      }
    }
  }, [data]);
  
  const [visibleImages, setVisibleImages] = useState(24);
  const [isEditMode, setIsEditMode] = useState(true); // Default to edit mode
  const [selectedImages, setSelectedImages] = useState<Gallery[]>([]);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [imagesToDelete, setImagesToDelete] = useState<Gallery[]>([]);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "name">("newest");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Media states
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [showFolderManager, setShowFolderManager] = useState(false);
  const [showUploaderDialog, setShowUploaderDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState<Gallery | null>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Check if user is logged in or has admin PIN access
  useEffect(() => {
    const token = localStorage.getItem("token");
    const isAdmin = localStorage.getItem("isAdmin");
    const adminPinVerified = localStorage.getItem("adminPinVerified");
    
    if (token || isAdmin === "true" || adminPinVerified === "true") {
      setIsLoggedIn(true);
      setIsEditMode(true);
    } else {
      setIsLoggedIn(false);
      window.location.href = "/admin"; // Redirect non-authenticated users
    }
  }, []);
  
  const loadMoreImages = () => {
    setVisibleImages(prev => prev + 24);
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
        variant: "default",
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
  
  // Sort, filter and search images
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
    
    // Apply search term
    if (searchTerm) {
      filteredImages = filteredImages.filter(img => 
        img.alt_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        img.image_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(img.id).includes(searchTerm)
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
    if (!images) return;
    
    if (selectedImages.length === images.length) {
      // If all are selected, deselect all
      setSelectedImages([]);
    } else {
      // Otherwise, select all
      setSelectedImages([...images]);
    }
  };

  // Delete selected images
  const handleDeleteSelected = () => {
    if (selectedImages.length === 0) return;
    
    setImagesToDelete(selectedImages);
    setShowDeleteConfirmation(true);
  };
  
  // Handle replace image
  const handleReplaceImage = (image: Gallery) => {
    setSelectedImage(image);
    setShowReplaceDialog(true);
  };
  
  const handleBackToAdmin = () => {
    window.location.href = "/admin";
  };
  
  return (
    <div className="bg-white min-h-screen">
      {/* Admin toolbar */}
      <div className="bg-gray-100 border-b p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleBackToAdmin}
            >
              ← Back to Admin
            </Button>
            <h1 className="font-bold text-lg ml-4">Media Manager</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="default"
              size="sm"
              className="bg-[#5D3FD3] text-white hover:bg-[#5D3FD3]/90"
              onClick={() => setShowUploaderDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload Media
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAllImages}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              {selectedImages.length === (images?.length || 0) ? "Deselect All" : "Select All"}
            </Button>
            
            {selectedImages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 border-red-200 hover:bg-red-50"
                onClick={handleDeleteSelected}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Filters and search */}
      <div className="bg-gray-50 border-b p-3">
        <div className="container mx-auto flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="relative max-w-xs">
              <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-500" />
              <Input
                type="search"
                placeholder="Search media..."
                className="pl-9 h-9 w-[200px] lg:w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-700"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
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
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="flex border rounded-md">
              <Button 
                variant={viewMode === "grid" ? "default" : "ghost"} 
                size="sm"
                className={viewMode === "grid" ? "bg-[#5D3FD3] text-white" : ""}
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === "list" ? "default" : "ghost"} 
                size="sm"
                className={viewMode === "list" ? "bg-[#5D3FD3] text-white" : ""}
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {filterTag && (
              <Badge variant="outline" className="bg-[#5D3FD3]/10">
                <Filter className="h-3 w-3 mr-1" />
                {filterTag}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setFilterTag(null)}
                />
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="container mx-auto p-6">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 18 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-md" />
            ))}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {getSortedAndFilteredImages(images)
              .slice(0, visibleImages)
              .map((image) => (
                <div key={image.id} className="group relative border rounded-md overflow-hidden">
                  <div className="aspect-square relative">
                    <div 
                      className="w-full h-full cursor-pointer"
                      onClick={() => {
                        setSelectedImage(image);
                        setShowImageViewer(true);
                      }}
                    >
                      <SafeImage
                        src={image.image_url}
                        alt={image.alt_text || `Image ${image.id}`}
                        className="w-full h-full object-cover"
                        showLoadingIndicator
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          className="h-8 w-8 p-0 bg-white/90"
                          onClick={() => {
                            // Copy to clipboard
                            const copiedImage = {...image};
                            localStorage.setItem('clipboardImage', JSON.stringify(copiedImage));
                            toast({
                              title: "Image Copied",
                              description: "Image copied to clipboard",
                              variant: "default"
                            });
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          className="h-8 w-8 p-0 bg-white/90"
                          onClick={() => handleReplaceImage(image)}
                        >
                          <Replace className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          className="h-8 w-8 p-0 bg-white/90"
                          onClick={() => handleDeleteImage(image)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="p-2 flex justify-between items-center bg-gray-50 border-t">
                    <div className="text-xs text-gray-500 truncate max-w-[85%]">
                      ID: {image.id}
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedImages.some(img => img.id === image.id)}
                      onChange={() => toggleImageSelection(image)}
                      className="h-4 w-4"
                    />
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-12 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedImages.length === (images?.length || 0) && images?.length !== 0}
                      onChange={handleSelectAllImages}
                      className="h-4 w-4"
                    />
                  </th>
                  <th className="w-16 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="w-20 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preview
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getSortedAndFilteredImages(images)
                  .slice(0, visibleImages)
                  .map((image) => (
                    <tr key={image.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedImages.some(img => img.id === image.id)}
                          onChange={() => toggleImageSelection(image)}
                          className="h-4 w-4"
                        />
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className="text-sm text-gray-500">{image.id}</span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div 
                          className="h-10 w-10 rounded overflow-hidden border bg-gray-50 cursor-pointer"
                          onClick={() => {
                            setSelectedImage(image);
                            setShowImageViewer(true);
                          }}
                        >
                          <SafeImage
                            src={image.image_url}
                            alt={image.alt_text || `Image ${image.id}`}
                            className="h-full w-full object-cover"
                            showLoadingIndicator
                          />
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className="text-sm">
                          {image.image_url.split('/').pop() || `image-${image.id}`}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 py-0 px-2"
                            onClick={() => {
                              // Copy to clipboard
                              const copiedImage = {...image};
                              localStorage.setItem('clipboardImage', JSON.stringify(copiedImage));
                              toast({
                                title: "Image Copied",
                                description: "Image copied to clipboard",
                                variant: "default"
                              });
                            }}
                          >
                            <Copy className="h-3.5 w-3.5 mr-1" />
                            Copy
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 py-0 px-2"
                            onClick={() => handleReplaceImage(image)}
                          >
                            <Replace className="h-3.5 w-3.5 mr-1" />
                            Replace
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 py-0 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteImage(image)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Load more button */}
        {images && visibleImages < (images?.length || 0) && (
          <div className="flex justify-center mt-8">
            <Button onClick={loadMoreImages} variant="outline">
              Load More
            </Button>
          </div>
        )}
        
        {/* Empty state */}
        {(!isLoading && (!images || images.length === 0)) && (
          <div className="flex flex-col items-center justify-center h-40">
            <ImageIcon className="h-10 w-10 text-gray-300 mb-2" />
            <p className="text-gray-500">No images found. Upload some media to get started.</p>
            <Button 
              variant="default"
              size="sm"
              className="mt-4 bg-[#5D3FD3] text-white hover:bg-[#5D3FD3]/90"
              onClick={() => setShowUploaderDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload Media
            </Button>
          </div>
        )}
      </div>
      
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
      
      {/* Image Viewer */}
      <ImageViewer
        image={selectedImage}
        isVisible={showImageViewer}
        onClose={() => setShowImageViewer(false)}
        imageList={images || []}
        onNavigate={setSelectedImage}
        allowDownload
      />
    </div>
  );
}