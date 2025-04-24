import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GalleryUploaderProps {
  folderId?: number | null;
  onUploadComplete?: () => void;
}

export function GalleryUploader({ 
  folderId = null,
  onUploadComplete 
}: GalleryUploaderProps) {
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      setUploading(true);
      setProgress(0);
      
      try {
        // Use fetch directly for file uploads
        const response = await fetch(
          `/api/gallery/upload${folderId ? `?folderId=${folderId}` : ''}`, 
          {
            method: 'POST',
            body: formData
          }
        );
        
        return await response.json();
      } finally {
        setUploading(false);
      }
    },
    onSuccess: () => {
      setFiles(null);
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      toast({
        title: "Upload successful",
        description: "Your media has been uploaded",
        variant: "default",
      });
      
      if (onUploadComplete) {
        onUploadComplete();
      }
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(e.target.files);
    }
  };

  const handleUpload = async () => {
    if (!files) return;
    
    const formData = new FormData();
    
    // Log to verify file types before upload
    console.log(`Uploading ${files.length} files`);
    Array.from(files).forEach((file, index) => {
      console.log(`File ${index + 1}: ${file.name}, type: ${file.type}, size: ${file.size}`);
      formData.append("images", file);
    });
    
    // Add folder ID if present
    if (folderId) {
      formData.append("folder_id", folderId.toString());
    }
    
    // For debugging, log FormData contents (not fully possible but can try)
    console.log("FormData created, attempting direct fetch");
    
    try {
      // Use fetch directly for more control
      const response = await fetch(
        `/api/gallery/upload${folderId ? `?folderId=${folderId}` : ''}`, 
        {
          method: 'POST',
          body: formData
        }
      );
      
      const data = await response.json();
      console.log("Upload response:", data);
      
      if (response.ok) {
        setFiles(null);
        queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
        toast({
          title: "Upload successful",
          description: `${data.total} images have been uploaded`,
          variant: "default",
        });
        
        if (onUploadComplete) {
          onUploadComplete();
        }
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          id="gallery-upload"
          className="hidden"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <label
          htmlFor="gallery-upload"
          className="flex flex-col items-center justify-center cursor-pointer"
        >
          <Upload className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 mb-1">
            Drag & drop files or click to browse
          </p>
          <p className="text-xs text-gray-500">
            Supports: JPG, PNG, GIF, SVG
          </p>
        </label>
      </div>

      {files && files.length > 0 && (
        <div className="mt-2">
          <p className="text-sm font-medium mb-2">
            Selected files ({files.length}):
          </p>
          <div className="max-h-32 overflow-y-auto">
            <ul className="space-y-1">
              {Array.from(files).map((file, index) => (
                <li key={index} className="text-sm text-gray-600 truncate">
                  {file.name} ({(file.size / 1024).toFixed(0)} KB)
                </li>
              ))}
            </ul>
          </div>

          {uploading && (
            <div className="mt-3">
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#5D3FD3] rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">
                Uploading: {progress}%
              </p>
            </div>
          )}

          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              className="mr-2"
              onClick={() => setFiles(null)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="bg-[#5D3FD3] hover:bg-[#5D3FD3]/90 text-white"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}