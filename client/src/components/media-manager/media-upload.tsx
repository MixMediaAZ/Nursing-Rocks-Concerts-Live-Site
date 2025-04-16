import { useState, useRef, useCallback } from 'react';
import { mediaService } from '@/lib/mediaService';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { UploadCloud, X, FileIcon, ImageIcon, Music, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface MediaUploadProps {
  onSuccess?: () => void;
  allowedTypes?: string[];
  maxFileSize?: number; // in MB
}

/**
 * Component for uploading media files with drag and drop support
 */
export function MediaUpload({
  onSuccess,
  allowedTypes = ['image/*', 'video/*', 'audio/*', 'application/pdf', '.doc', '.docx', '.txt'],
  maxFileSize = 5, // 5MB default
}: MediaUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Handle file upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await mediaService.uploadMedia(formData, (progress) => {
        setUploadProgress(progress);
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Upload successful',
        description: 'Your file has been uploaded successfully.',
      });
      resetForm();
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Upload failed',
        description: error.message || 'There was an error uploading your file.',
        variant: 'destructive',
      });
      setUploadProgress(0);
    },
  });

  // Reset the form
  const resetForm = () => {
    setFile(null);
    setTitle('');
    setDescription('');
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop event
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  }, []);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  // Validate file type and size
  const validateAndSetFile = (file: File) => {
    // Check file type
    const fileType = file.type;
    const isValidType = allowedTypes.some(type => {
      if (type.includes('*')) {
        // Handle wildcard types like 'image/*'
        return fileType.startsWith(type.split('/')[0]);
      }
      // Handle exact types or extensions
      return fileType === type || file.name.endsWith(type);
    });
    
    if (!isValidType) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a file of supported format.',
        variant: 'destructive',
      });
      return;
    }
    
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: `File size should not exceed ${maxFileSize}MB.`,
        variant: 'destructive',
      });
      return;
    }
    
    // Set file and default title
    setFile(file);
    if (!title) {
      // Set title to file name without extension
      const fileName = file.name.split('.');
      fileName.pop();
      setTitle(fileName.join('.'));
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to upload.',
        variant: 'destructive',
      });
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title || file.name);
    formData.append('description', description);
    
    // Start upload
    uploadMutation.mutate(formData);
  };

  // Render file preview based on type
  const renderFilePreview = () => {
    if (!file) return null;
    
    const fileType = file.type;
    
    if (fileType.startsWith('image/')) {
      return (
        <div className="relative w-full h-40 bg-muted overflow-hidden rounded-md">
          <img 
            src={URL.createObjectURL(file)} 
            alt="Preview" 
            className="w-full h-full object-contain"
          />
        </div>
      );
    }
    
    if (fileType.startsWith('video/')) {
      return (
        <div className="relative w-full h-40 bg-muted flex items-center justify-center rounded-md">
          <Video className="h-16 w-16 text-primary/70" />
          <span className="absolute bottom-2 left-2 text-xs bg-background/80 px-2 py-1 rounded">
            {file.name}
          </span>
        </div>
      );
    }
    
    if (fileType.startsWith('audio/')) {
      return (
        <div className="relative w-full h-40 bg-muted flex items-center justify-center rounded-md">
          <Music className="h-16 w-16 text-primary/70" />
          <span className="absolute bottom-2 left-2 text-xs bg-background/80 px-2 py-1 rounded">
            {file.name}
          </span>
        </div>
      );
    }
    
    return (
      <div className="relative w-full h-40 bg-muted flex items-center justify-center rounded-md">
        <FileIcon className="h-16 w-16 text-primary/70" />
        <span className="absolute bottom-2 left-2 text-xs bg-background/80 px-2 py-1 rounded">
          {file.name}
        </span>
      </div>
    );
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit}>
          {/* File upload area */}
          {!file ? (
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive 
                  ? 'border-primary bg-primary/10' 
                  : 'border-muted-foreground/20 hover:border-primary/50'
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <UploadCloud className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Drag and drop your files here, or
                <span 
                  className="mx-1 text-primary font-medium cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  browse
                </span>
                to select
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Supported formats: Images, Video, Audio, PDF, DOC, TXT
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Maximum file size: {maxFileSize}MB
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept={allowedTypes.join(',')}
                className="hidden"
              />
            </div>
          ) : (
            <div className="mb-6">
              <div className="relative">
                {renderFilePreview()}
                
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={resetForm}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="mt-1 text-xs text-muted-foreground flex justify-between">
                <span>{file.name}</span>
                <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
            </div>
          )}
          
          {/* Media details */}
          {file && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="media-title">Title</Label>
                <Input
                  id="media-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for this media"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="media-description">Description (optional)</Label>
                <Textarea
                  id="media-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter a description"
                  className="resize-none"
                  rows={3}
                />
              </div>
              
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={uploadMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={!file || uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload File'}
                </Button>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}