import { useState, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Gallery } from "@shared/schema";
import { Loader2, Upload, Trash2, Download, Edit, Save, X, Copy, Replace, Layers, Move } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GalleryManagerProps {
  events?: { id: number; title: string }[];
}

const GalleryManager: React.FC<GalleryManagerProps> = ({ events = [] }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [altText, setAltText] = useState<string>("");
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
      
      // Generate preview URLs
      const urls = files.map(file => URL.createObjectURL(file));
      setPreviewUrls(urls);
    }
  };

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      try {
        const formData = new FormData();
        selectedFiles.forEach((file) => {
          formData.append("images", file);
        });
        
        if (selectedEventId) {
          formData.append("event_id", selectedEventId);
        }
        
        if (altText) {
          formData.append("alt_text", altText);
        }
        
        const response = await fetch("/api/gallery/upload", {
          method: "POST",
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error("Failed to upload images");
        }
        
        return await response.json();
      } finally {
        setUploading(false);
      }
    },
    onSuccess: () => {
      // Clear the selected files and preview URLs
      setSelectedFiles([]);
      setPreviewUrls([]);
      setAltText("");
      setSelectedEventId("");
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      // Invalidate the gallery query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      
      toast({
        title: "Upload Successful",
        description: `Successfully uploaded ${selectedFiles.length} image(s)`,
      });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload images",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (imageId: number) => {
      return apiRequest("DELETE", `/api/gallery/${imageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      toast({
        title: "Image Deleted",
        description: "The image was successfully deleted",
      });
    },
    onError: (error) => {
      toast({
        title: "Deletion Failed",
        description: error instanceof Error ? error.message : "Failed to delete image",
        variant: "destructive",
      });
    },
  });

  const handleUpload = () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select images to upload",
        variant: "destructive",
      });
      return;
    }
    
    uploadMutation.mutate();
  };

  const handleDeleteImage = (imageId: number) => {
    deleteMutation.mutate(imageId);
  };

  // Handle image download
  const handleDownloadImage = (image: Gallery) => {
    const link = document.createElement('a');
    link.href = image.image_url;
    
    // Extract filename from the URL or use a default name
    const filename = image.image_url.split('/').pop() || `nursing-rocks-image-${image.id}.jpg`;
    link.download = filename;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download Started",
      description: "Your image is being downloaded",
    });
  };

  return (
    <Card className="border rounded-lg shadow-sm p-6">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="mb-6 grid grid-cols-2 w-full">
          <TabsTrigger value="upload">Upload Images</TabsTrigger>
          <TabsTrigger value="manage">Manage Images</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="event">Event (Optional)</Label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="alt-text">Alt Text (Optional)</Label>
              <Input
                id="alt-text"
                placeholder="Describe these images"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="images">Select Images</Label>
              <Input
                ref={fileInputRef}
                id="images"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              <p className="text-sm text-gray-500">Upload up to 20 images (max 5MB per image)</p>
            </div>
            
            {previewUrls.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Selected Images ({previewUrls.length})</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="h-40 w-full object-cover rounded-md"
                      />
                      <button
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
                          setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <Button
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" /> Upload Images
                </>
              )}
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="manage">
          <GalleryImageManager
            onDelete={handleDeleteImage}
            onDownload={handleDownloadImage}
            events={events}
            isDeleting={deleteMutation.isPending}
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
};

interface GalleryImageManagerProps {
  onDelete: (imageId: number) => void;
  onDownload: (image: Gallery) => void;
  events?: { id: number; title: string }[];
  isDeleting: boolean;
}

const GalleryImageManager: React.FC<GalleryImageManagerProps> = ({
  onDelete,
  onDownload,
  events = [],
  isDeleting,
}) => {
  const { data: images, isLoading } = useQuery<Gallery[]>({
    queryKey: ["/api/gallery"]
  });
  
  const [selectedImage, setSelectedImage] = useState<Gallery | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editAltText, setEditAltText] = useState("");
  const [editEventId, setEditEventId] = useState<string>("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [clipboardImage, setClipboardImage] = useState<Gallery | null>(null);
  const [showZIndexDialog, setShowZIndexDialog] = useState(false);
  const [zIndexValue, setZIndexValue] = useState(0);
  const [imageZIndexMap, setImageZIndexMap] = useState<Record<number, number>>({});
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: { id: number; alt_text?: string; event_id?: number | null }) => {
      return apiRequest("PATCH", `/api/gallery/${data.id}`, {
        alt_text: data.alt_text,
        event_id: data.event_id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      setEditMode(false);
      toast({
        title: "Image Updated",
        description: "The image details were successfully updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update image",
        variant: "destructive",
      });
    },
  });

  // Replace image mutation
  const replaceImageMutation = useMutation({
    mutationFn: async (data: { file: File, imageId: number }) => {
      const formData = new FormData();
      formData.append("images", data.file);
      
      if (selectedImage?.event_id) {
        formData.append("event_id", selectedImage.event_id.toString());
      }
      
      if (selectedImage?.alt_text) {
        formData.append("alt_text", selectedImage.alt_text);
      }
      
      // Upload the new image
      const uploadResponse = await fetch("/api/gallery/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        throw new Error("Failed to upload replacement image");
      }
      
      const uploadResult = await uploadResponse.json();
      
      // Delete the old image
      await apiRequest("DELETE", `/api/gallery/${data.imageId}`);
      
      return uploadResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      toast({
        title: "Image Replaced",
        description: "The image has been successfully replaced",
      });
    },
    onError: (error) => {
      toast({
        title: "Replacement Failed",
        description: error instanceof Error ? error.message : "Failed to replace image",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (image: Gallery) => {
    setSelectedImage(image);
    setEditAltText(image.alt_text || "");
    setEditEventId(image.event_id ? image.event_id.toString() : "");
    setEditMode(true);
  };

  const handleSaveEdit = () => {
    if (!selectedImage) return;
    
    updateMutation.mutate({
      id: selectedImage.id,
      alt_text: editAltText,
      event_id: editEventId ? parseInt(editEventId) : null,
    });
  };

  const handleDeleteConfirm = (image: Gallery) => {
    setSelectedImage(image);
    setShowDeleteConfirm(true);
  };

  const handleCopyImage = (image: Gallery) => {
    setClipboardImage(image);
    toast({
      title: "Image Copied",
      description: "The image has been copied to clipboard",
    });
  };

  const handlePasteImage = async () => {
    if (!clipboardImage) {
      toast({
        title: "Nothing to Paste",
        description: "Copy an image first before pasting",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Fetch the image as blob
      const response = await fetch(clipboardImage.image_url);
      const blob = await response.blob();
      
      // Create a file object from the blob
      const fileName = `copy-${clipboardImage.id}-${Date.now()}.jpg`;
      const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
      
      // Create form data for upload
      const formData = new FormData();
      formData.append("images", file);
      
      if (clipboardImage.event_id) {
        formData.append("event_id", clipboardImage.event_id.toString());
      }
      
      formData.append("alt_text", clipboardImage.alt_text || "Copied image");
      
      // Upload the image
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
        description: "The image has been pasted successfully",
      });
    } catch (error) {
      toast({
        title: "Paste Failed",
        description: error instanceof Error ? error.message : "Failed to paste image",
        variant: "destructive",
      });
    }
  };

  const handleReplaceImage = (image: Gallery) => {
    setSelectedImage(image);
    // Trigger file input click
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }, 100);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && selectedImage) {
      const file = e.target.files[0];
      replaceImageMutation.mutate({ file, imageId: selectedImage.id });
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleZIndexChange = (image: Gallery) => {
    setSelectedImage(image);
    setZIndexValue(imageZIndexMap[image.id] || 0);
    setShowZIndexDialog(true);
  };

  const saveZIndex = () => {
    if (!selectedImage) return;
    
    setImageZIndexMap(prev => ({
      ...prev,
      [selectedImage.id]: zIndexValue
    }));
    
    setShowZIndexDialog(false);
    
    toast({
      title: "Layer Updated",
      description: `Image z-index set to ${zIndexValue}`,
    });
  };

  const getEventName = (eventId: number | null) => {
    if (!eventId) return "None";
    const event = events.find((e) => e.id === eventId);
    return event ? event.title : "Unknown Event";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!images || images.length === 0) {
    return (
      <div className="text-center p-12">
        <p className="text-muted-foreground">No images found in the gallery</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {clipboardImage && (
        <div className="bg-yellow-50 p-4 rounded-md flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-yellow-100 rounded-md overflow-hidden">
              <img 
                src={clipboardImage.image_url} 
                alt="Copied" 
                className="h-full w-full object-cover" 
              />
            </div>
            <p className="text-sm">Image copied to clipboard</p>
          </div>
          <Button variant="outline" size="sm" onClick={handlePasteImage}>
            <Copy className="h-4 w-4 mr-2" /> Paste
          </Button>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((image) => (
          <Card 
            key={image.id} 
            className="overflow-hidden border"
            style={{ 
              zIndex: imageZIndexMap[image.id] || 'auto',
              position: imageZIndexMap[image.id] ? 'relative' : 'static'
            }}
          >
            <div className="aspect-video relative">
              <img
                src={image.image_url}
                alt={image.alt_text || "Gallery image"}
                className="w-full h-full object-cover"
              />
              {imageZIndexMap[image.id] !== undefined && (
                <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  z-index: {imageZIndexMap[image.id]}
                </div>
              )}
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm font-medium">Alt Text:</p>
                <p className="text-sm text-gray-500 line-clamp-2">
                  {image.alt_text || "No description provided"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Event:</p>
                <p className="text-sm text-gray-500">
                  {image.event_id ? getEventName(image.event_id) : "None"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(image)}
                      >
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Edit image details</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyImage(image)}
                      >
                        <Copy className="h-4 w-4 mr-1" /> Copy
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy image to clipboard</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDownload(image)}
                      >
                        <Download className="h-4 w-4 mr-1" /> Download
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Download image</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReplaceImage(image)}
                      >
                        <Replace className="h-4 w-4 mr-1" /> Replace
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Replace this image with another</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleZIndexChange(image)}
                      >
                        <Layers className="h-4 w-4 mr-1" /> Layer
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Change the z-index/layer position</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteConfirm(image)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete this image</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Hidden file input for image replacement */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* Edit Dialog */}
      <Dialog open={editMode} onOpenChange={(open) => !open && setEditMode(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Image Details</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4">
              <img
                src={selectedImage?.image_url}
                alt={selectedImage?.alt_text || "Gallery image"}
                className="w-full h-40 object-contain rounded-md"
              />
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-alt-text">Alt Text</Label>
                <Input
                  id="edit-alt-text"
                  value={editAltText}
                  onChange={(e) => setEditAltText(e.target.value)}
                  placeholder="Describe this image"
                />
              </div>
              <div>
                <Label htmlFor="edit-event">Event</Label>
                <Select value={editEventId} onValueChange={setEditEventId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an event" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id.toString()}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMode(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit} 
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this image. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            {selectedImage && (
              <img
                src={selectedImage.image_url}
                alt={selectedImage.alt_text || "Gallery image"}
                className="w-full h-40 object-contain rounded-md"
              />
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (selectedImage) {
                  onDelete(selectedImage.id);
                  setShowDeleteConfirm(false);
                }
              }}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Z-Index Dialog */}
      <Dialog open={showZIndexDialog} onOpenChange={setShowZIndexDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Image Layer Position</DialogTitle>
            <DialogDescription>
              Adjust the layer position (z-index) of this image. Higher values bring the image to the front.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4">
              {selectedImage && (
                <img
                  src={selectedImage.image_url}
                  alt={selectedImage.alt_text || "Gallery image"}
                  className="w-full h-40 object-contain rounded-md"
                />
              )}
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="z-index-value">Z-Index Value</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="z-index-value"
                    type="number"
                    value={zIndexValue}
                    onChange={(e) => setZIndexValue(parseInt(e.target.value) || 0)}
                  />
                  <span className="text-xs text-gray-500">
                    (Range: -10 to 10)
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Positive values bring the image forward, negative values push it backward
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowZIndexDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveZIndex}>
              <Save className="mr-2 h-4 w-4" /> Save Layer Position
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GalleryManager;