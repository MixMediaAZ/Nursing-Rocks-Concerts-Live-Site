import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { X, Upload, ImageIcon, Video, Music, Presentation, FileIcon } from "lucide-react";

interface GalleryUploaderProps {
  folderId: number | null;
  onUploadComplete?: () => void;
}

export function GalleryUploader({ folderId, onUploadComplete }: GalleryUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [altText, setAltText] = useState("");
  const [mediaType, setMediaType] = useState<string>("image");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };
  
  // Remove a file from the selection
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  // Handle upload
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (files.length === 0) {
        throw new Error("No files selected");
      }
      
      setIsUploading(true);
      setUploadProgress(0);
      
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });
      
      // Add metadata
      formData.append('media_type', mediaType);
      if (altText) formData.append('alt_text', altText);
      if (folderId !== null) formData.append('folder_id', folderId.toString());
      
      const xhr = new XMLHttpRequest();
      
      return new Promise<any>((resolve, reject) => {
        xhr.open('POST', '/api/gallery/upload');
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        });
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };
        
        xhr.onerror = () => {
          reject(new Error('Upload failed due to network error'));
        };
        
        xhr.send(formData);
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Upload complete",
        description: `Successfully uploaded ${files.length} files`,
      });
      setFiles([]);
      setAltText("");
      setUploadProgress(0);
      setIsUploading(false);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/gallery'] });
      if (folderId !== null) {
        queryClient.invalidateQueries({ queryKey: [`/api/gallery/folder/${folderId}`] });
      }
      
      // Call completion callback if provided
      if (onUploadComplete) {
        onUploadComplete();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadProgress(0);
      setIsUploading(false);
    }
  });
  
  // Submit the upload
  const handleUpload = () => {
    uploadMutation.mutate();
  };
  
  // Determine file icon based on type
  const getFileIcon = (file: File) => {
    const type = file.type.split('/')[0];
    switch (type) {
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'audio':
        return <Music className="h-4 w-4" />;
      default:
        return <FileIcon className="h-4 w-4" />;
    }
  };
  
  // Generate preview for image files
  const getFilePreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="media-type">Media Type</Label>
        <Select
          value={mediaType}
          onValueChange={setMediaType}
          disabled={isUploading}
        >
          <SelectTrigger id="media-type">
            <SelectValue placeholder="Select media type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="image">
              <div className="flex items-center">
                <ImageIcon className="mr-2 h-4 w-4" />
                <span>Image</span>
              </div>
            </SelectItem>
            <SelectItem value="video">
              <div className="flex items-center">
                <Video className="mr-2 h-4 w-4" />
                <span>Video</span>
              </div>
            </SelectItem>
            <SelectItem value="audio">
              <div className="flex items-center">
                <Music className="mr-2 h-4 w-4" />
                <span>Audio</span>
              </div>
            </SelectItem>
            <SelectItem value="slideshow">
              <div className="flex items-center">
                <Presentation className="mr-2 h-4 w-4" />
                <span>Slideshow</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="alt-text">Alternative Text</Label>
        <Textarea
          id="alt-text"
          placeholder="Describe the content for accessibility"
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          disabled={isUploading}
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="file-upload">Upload Files</Label>
          <span className="text-xs text-muted-foreground">
            {files.length} file(s) selected
          </span>
        </div>
        
        <div
          className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center cursor-pointer ${
            isUploading ? 'bg-muted' : 'hover:border-primary'
          }`}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-center text-muted-foreground">
            Click to select files or drag and drop files here
          </p>
          <Input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
            accept="image/*,video/*,audio/*"
          />
        </div>
      </div>
      
      {files.length > 0 && (
        <div className="space-y-2">
          <Label>Selected Files</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {files.map((file, index) => {
              const preview = getFilePreview(file);
              return (
                <Card key={index} className="overflow-hidden">
                  <div className="relative">
                    {preview ? (
                      <div className="aspect-square">
                        <img
                          src={preview}
                          alt={file.name}
                          className="object-cover w-full h-full"
                          onLoad={() => URL.revokeObjectURL(preview)}
                        />
                      </div>
                    ) : (
                      <div className="aspect-square bg-muted flex items-center justify-center">
                        {getFileIcon(file)}
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 bg-background/80 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      disabled={isUploading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <CardContent className="p-2">
                    <p className="text-xs truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
      
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}
      
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleUpload}
          disabled={files.length === 0 || isUploading}
        >
          {isUploading ? "Uploading..." : "Upload Files"}
        </Button>
      </div>
    </div>
  );
}