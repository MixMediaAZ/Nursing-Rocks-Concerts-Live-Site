import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SUPPORTED_MEDIA_TYPES, getMediaType } from '@/lib/assetLoader';
import { Upload, Image, FileVideo, FileAudio, FileText, RefreshCw, X, Check } from 'lucide-react';

interface MediaUploadProps {
  onUpload?: (files: File[], metadata: Record<string, any>[]) => void;
  acceptedTypes?: string[];
  multiple?: boolean;
  maxSize?: number; // in bytes
  className?: string;
}

/**
 * A component for uploading media files with preview and metadata editing
 */
export function MediaUpload({
  onUpload,
  acceptedTypes = [...SUPPORTED_MEDIA_TYPES.IMAGE, ...SUPPORTED_MEDIA_TYPES.VIDEO, ...SUPPORTED_MEDIA_TYPES.AUDIO, ...SUPPORTED_MEDIA_TYPES.DOCUMENT],
  multiple = true,
  maxSize = 10 * 1024 * 1024, // 10MB default max size
  className = '',
}: MediaUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<Record<string, any>[]>([]);
  const [activeTab, setActiveTab] = useState('upload');
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    processFiles(selectedFiles);
    
    // Reset the input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle file drop
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (event.dataTransfer.files?.length > 0) {
      const droppedFiles = Array.from(event.dataTransfer.files);
      processFiles(droppedFiles);
    }
  };

  // Prevent default behavior for dragover event
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  // Process selected files
  const processFiles = (selectedFiles: File[]) => {
    // Validate and filter files
    const validFiles: File[] = [];
    const newErrors: string[] = [];
    const newPreviews: string[] = [];
    const newMetadata: Record<string, any>[] = [];
    
    selectedFiles.forEach(file => {
      // Check file type
      const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;
      const isValidType = acceptedTypes.includes(fileExt);
      
      // Check file size
      const isValidSize = file.size <= maxSize;
      
      if (!isValidType) {
        newErrors.push(`"${file.name}" has an unsupported file type.`);
      } else if (!isValidSize) {
        newErrors.push(`"${file.name}" exceeds the maximum file size of ${maxSize / (1024 * 1024)}MB.`);
      } else {
        validFiles.push(file);
        
        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        newPreviews.push(previewUrl);
        
        // Initialize metadata
        newMetadata.push({
          title: file.name.split('.')[0],
          alt: file.name,
          description: '',
          type: getMediaType(file.name),
        });
      }
    });
    
    // Update state with new files
    if (multiple) {
      setFiles(prevFiles => [...prevFiles, ...validFiles]);
      setPreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
      setMetadata(prevMetadata => [...prevMetadata, ...newMetadata]);
    } else {
      setFiles(validFiles.slice(0, 1));
      setPreviews(newPreviews.slice(0, 1));
      setMetadata(newMetadata.slice(0, 1));
    }
    
    // Update errors
    setErrors(newErrors);
    
    // Switch to metadata tab if files were added
    if (validFiles.length > 0) {
      setActiveTab('metadata');
      setActiveFileIndex(multiple ? files.length : 0);
    }
  };

  // Remove a file from the selection
  const removeFile = (index: number) => {
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(previews[index]);
    
    // Update state
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    setPreviews(prevPreviews => prevPreviews.filter((_, i) => i !== index));
    setMetadata(prevMetadata => prevMetadata.filter((_, i) => i !== index));
    
    // Update active file index
    if (activeFileIndex >= index && activeFileIndex > 0) {
      setActiveFileIndex(activeFileIndex - 1);
    }
  };

  // Update metadata for a specific file
  const updateMetadata = (index: number, key: string, value: any) => {
    setMetadata(prevMetadata => {
      const newMetadata = [...prevMetadata];
      newMetadata[index] = { ...newMetadata[index], [key]: value };
      return newMetadata;
    });
  };

  // Handle upload button click
  const handleUpload = () => {
    if (files.length === 0) {
      setErrors(['No files selected for upload.']);
      return;
    }
    
    setIsUploading(true);
    
    // Call the onUpload callback with files and metadata
    if (onUpload) {
      onUpload(files, metadata);
      
      // Reset state after successful upload
      setTimeout(() => {
        setFiles([]);
        setPreviews([]);
        setMetadata([]);
        setActiveTab('upload');
        setActiveFileIndex(0);
        setIsUploading(false);
        setErrors([]);
      }, 1000);
    } else {
      // Just simulate an upload if no callback is provided
      setTimeout(() => {
        setIsUploading(false);
      }, 1000);
    }
  };

  // Get appropriate icon for file type
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="h-5 w-5" />;
      case 'video':
        return <FileVideo className="h-5 w-5" />;
      case 'audio':
        return <FileAudio className="h-5 w-5" />;
      case 'document':
        return <FileText className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle>Media Upload</CardTitle>
        <CardDescription>
          Upload images, videos, audio files, and documents
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mx-4">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="metadata" disabled={files.length === 0}>Metadata</TabsTrigger>
        </TabsList>
        
        <CardContent>
          {/* Upload Tab */}
          <TabsContent value="upload" className="mt-4">
            {/* Drag and Drop Area */}
            <div
              className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">Drag & Drop Files</h3>
              <p className="text-sm text-muted-foreground mb-4">
                or click to select files from your computer
              </p>
              <p className="text-xs text-muted-foreground">
                Supported formats: {acceptedTypes.join(', ')}
              </p>
              <p className="text-xs text-muted-foreground">
                Maximum file size: {maxSize / (1024 * 1024)}MB
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple={multiple}
                accept={acceptedTypes.join(',')}
                onChange={handleFileSelect}
                className="hidden"
                data-testid="file-input"
              />
            </div>
            
            {/* File List */}
            {files.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">Selected Files</h3>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-md bg-muted/40">
                      <div className="flex items-center">
                        {getFileIcon(metadata[index]?.type || 'other')}
                        <span className="text-sm ml-2 truncate">{file.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Error Display */}
            {errors.length > 0 && (
              <div className="mt-4 p-3 bg-destructive/10 rounded-md">
                <h3 className="text-sm font-medium text-destructive mb-1">Errors</h3>
                <ul className="list-disc pl-5 text-xs text-destructive">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>
          
          {/* Metadata Tab */}
          <TabsContent value="metadata" className="mt-4">
            {files.length > 0 ? (
              <>
                {/* File selector tabs */}
                {files.length > 1 && (
                  <div className="mb-4 overflow-x-auto whitespace-nowrap pb-2">
                    <div className="inline-flex gap-2">
                      {files.map((file, index) => (
                        <Button
                          key={index}
                          variant={activeFileIndex === index ? "default" : "outline"}
                          size="sm"
                          onClick={() => setActiveFileIndex(index)}
                          className="flex items-center gap-1"
                        >
                          {getFileIcon(metadata[index]?.type || 'other')}
                          <span className="max-w-[100px] truncate">{file.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* File preview */}
                <div className="mb-4">
                  {metadata[activeFileIndex]?.type === 'image' ? (
                    <div className="border rounded-md overflow-hidden mb-4 bg-muted">
                      <img
                        src={previews[activeFileIndex]}
                        alt={metadata[activeFileIndex]?.alt || 'Preview'}
                        className="max-h-[200px] w-auto mx-auto object-contain"
                      />
                    </div>
                  ) : (
                    <div className="border rounded-md p-6 mb-4 bg-muted flex items-center justify-center">
                      {getFileIcon(metadata[activeFileIndex]?.type || 'other')}
                      <span className="ml-2 font-medium">{files[activeFileIndex]?.name}</span>
                    </div>
                  )}
                </div>
                
                {/* Metadata form */}
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={metadata[activeFileIndex]?.title || ''}
                      onChange={(e) => updateMetadata(activeFileIndex, 'title', e.target.value)}
                      placeholder="Enter a descriptive title"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="alt">Alt Text</Label>
                    <Input
                      id="alt"
                      value={metadata[activeFileIndex]?.alt || ''}
                      onChange={(e) => updateMetadata(activeFileIndex, 'alt', e.target.value)}
                      placeholder="Alternative text for accessibility"
                    />
                    <p className="text-xs text-muted-foreground">
                      Describe the content for users who can't see the image
                    </p>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={metadata[activeFileIndex]?.description || ''}
                      onChange={(e) => updateMetadata(activeFileIndex, 'description', e.target.value)}
                      placeholder="Add a detailed description"
                      rows={3}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No files selected. Go to the Upload tab to add files.
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            setFiles([]);
            setPreviews([]);
            setMetadata([]);
            setActiveTab('upload');
            setErrors([]);
          }}
          disabled={files.length === 0 || isUploading}
        >
          Clear All
        </Button>
        
        <Button
          onClick={handleUpload}
          disabled={files.length === 0 || isUploading}
          className="gap-1"
        >
          {isUploading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              {files.length > 0 ? 'Upload Files' : 'Upload'}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}