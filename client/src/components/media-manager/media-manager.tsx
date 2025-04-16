import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MediaLibrary } from '@/components/media';
import { MediaUpload } from './media-upload';
import { mediaService } from '@/lib/mediaService';
import { MediaAsset } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Pencil, RefreshCw, ImagePlus, FileVideo, FileAudio, File } from 'lucide-react';

interface MediaManagerProps {
  onSelect?: (asset: MediaAsset) => void;
  showLibraryOnly?: boolean;
  filter?: 'all' | 'image' | 'video' | 'audio' | 'document';
  className?: string;
}

/**
 * A comprehensive component for managing media assets
 * Includes upload, library browsing, and asset management
 */
export function MediaManager({
  onSelect,
  showLibraryOnly = false,
  filter = 'all',
  className = ''
}: MediaManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  // Fetch media assets from the server
  const { data: assets = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/media'],
    queryFn: () => mediaService.getMediaList(),
  });
  
  // Delete media mutation
  const deleteMediaMutation = useMutation({
    mutationFn: (id: string) => mediaService.deleteMedia(id),
    onSuccess: () => {
      toast({
        title: 'Media deleted',
        description: 'The media asset has been successfully deleted.',
      });
      
      // Refetch the media list
      queryClient.invalidateQueries({ queryKey: ['/api/media'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Deletion failed',
        description: error.message || 'Failed to delete media asset.',
      });
    }
  });
  
  // Handle file upload
  const handleUpload = async (files: File[], metadata: Record<string, any>[]) => {
    try {
      const result = await mediaService.uploadFiles(files, metadata);
      
      if (result.success) {
        toast({
          title: 'Upload successful',
          description: `${result.assets.length} files uploaded successfully.`,
        });
        
        // Close the upload modal
        setIsUploadModalOpen(false);
        
        // Refetch the media list
        queryClient.invalidateQueries({ queryKey: ['/api/media'] });
      } else {
        toast({
          variant: 'destructive',
          title: 'Upload failed',
          description: result.errors?.join(', ') || 'Failed to upload files.',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Upload error',
        description: error.message || 'An unexpected error occurred during upload.',
      });
    }
  };
  
  // Handle media selection
  const handleMediaSelect = (asset: MediaAsset) => {
    if (onSelect) {
      onSelect(asset);
    }
  };
  
  // Handle media deletion
  const handleDeleteMedia = (id: string) => {
    if (window.confirm('Are you sure you want to delete this media asset? This action cannot be undone.')) {
      deleteMediaMutation.mutate(id);
    }
  };
  
  // Render library-only mode
  if (showLibraryOnly) {
    return (
      <MediaLibrary 
        onSelect={handleMediaSelect} 
        filter={filter} 
        className={className} 
      />
    );
  }
  
  // Render full media manager
  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Media Manager</CardTitle>
              <CardDescription>
                Manage and organize your media assets
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => refetch()} 
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex items-center gap-1">
                    <ImagePlus className="h-4 w-4" />
                    Upload New
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Upload Media</DialogTitle>
                  </DialogHeader>
                  <MediaUpload onUpload={handleUpload} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="grid">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="grid">Grid View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>
            
            {/* Grid View */}
            <TabsContent value="grid">
              {isLoading ? (
                <div className="text-center py-12">
                  <RefreshCw className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">Loading media assets...</p>
                </div>
              ) : assets.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {assets.map((asset) => (
                    <Card key={asset.id} className="overflow-hidden">
                      {/* Preview based on media type */}
                      <div 
                        className="h-40 bg-muted cursor-pointer"
                        onClick={() => handleMediaSelect(asset)}
                      >
                        {asset.type === 'image' ? (
                          <img 
                            src={asset.path} 
                            alt={asset.alt || 'Image'} 
                            className="w-full h-full object-cover"
                          />
                        ) : asset.type === 'video' ? (
                          <div className="flex items-center justify-center h-full bg-black/10">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-muted-foreground/50" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : asset.type === 'audio' ? (
                          <div className="flex items-center justify-center h-full bg-black/10">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-muted-foreground/50" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full bg-black/10">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-muted-foreground/50" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {/* Asset info */}
                      <div className="p-3">
                        <h3 className="font-medium truncate">{asset.title || asset.path.split('/').pop()}</h3>
                        <p className="text-xs text-muted-foreground">{asset.type}</p>
                        
                        <div className="flex mt-2 gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="flex-1 h-8"
                            onClick={() => handleMediaSelect(asset)}
                          >
                            Select
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="px-2 h-8"
                            onClick={() => handleDeleteMedia(asset.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border rounded-md bg-muted/10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium">No Media Assets</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Upload media by clicking the "Upload New" button.
                  </p>
                  <Button 
                    onClick={() => setIsUploadModalOpen(true)} 
                    className="mt-4"
                  >
                    Upload Media
                  </Button>
                </div>
              )}
            </TabsContent>
            
            {/* List View */}
            <TabsContent value="list">
              {isLoading ? (
                <div className="text-center py-12">
                  <RefreshCw className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">Loading media assets...</p>
                </div>
              ) : assets.length > 0 ? (
                <div className="border rounded-md divide-y">
                  {assets.map((asset) => (
                    <div key={asset.id} className="flex items-center p-3">
                      {/* Thumbnail */}
                      <div className="w-12 h-12 bg-muted rounded-md mr-3 flex-shrink-0 overflow-hidden">
                        {asset.type === 'image' ? (
                          <img 
                            src={asset.path} 
                            alt={asset.alt || 'Image'} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            {asset.type === 'video' ? (
                              <FileVideo className="h-6 w-6 text-muted-foreground/70" />
                            ) : asset.type === 'audio' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-muted-foreground/70" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-muted-foreground/70" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Asset info */}
                      <div className="flex-grow min-w-0">
                        <h3 className="font-medium truncate">{asset.title || asset.path.split('/').pop()}</h3>
                        <p className="text-xs text-muted-foreground">{asset.type}</p>
                      </div>
                      
                      {/* Actions */}
                      <div className="ml-2 flex gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleMediaSelect(asset)}
                        >
                          Select
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="px-2 h-8"
                          onClick={() => handleDeleteMedia(asset.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border rounded-md bg-muted/10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium">No Media Assets</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Upload media by clicking the "Upload New" button.
                  </p>
                  <Button 
                    onClick={() => setIsUploadModalOpen(true)} 
                    className="mt-4"
                  >
                    Upload Media
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}