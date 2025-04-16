import { useState } from 'react';
import { MediaAsset } from '@shared/schema';
import { mediaService } from '@/lib/mediaService';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RefreshCw, Upload, Image, FileVideo, FileAudio, File } from 'lucide-react';
import { MediaUpload } from './media-upload';

interface MediaManagerProps {
  onSelect?: (asset: MediaAsset) => void;
  showLibraryOnly?: boolean;
  filter?: 'all' | 'image' | 'video' | 'audio' | 'document';
  className?: string;
}

/**
 * A component for managing media assets (uploading, selecting, browsing)
 */
export function MediaManager({
  onSelect,
  showLibraryOnly = false,
  filter = 'all',
  className = '',
}: MediaManagerProps) {
  const [activeTab, setActiveTab] = useState<string>(showLibraryOnly ? 'browse' : 'upload');
  const [selectedFilter, setSelectedFilter] = useState<string>(filter);
  
  // Fetch media assets
  const { 
    data: mediaResponse, 
    isLoading, 
    refetch 
  } = useQuery<{ assets: MediaAsset[] }>({
    queryKey: ['/api/media'], 
    staleTime: 60000 // 1 minute
  });
  
  const assets = mediaResponse?.assets || [];
  const filteredAssets = selectedFilter === 'all' 
    ? assets 
    : assets.filter((asset) => asset.type === selectedFilter);

  // Handle media selection
  const handleMediaSelect = (asset: MediaAsset) => {
    if (onSelect) onSelect(asset);
  };

  // Handle successful upload
  const handleUploadSuccess = () => {
    setActiveTab('browse');
    refetch();
  };

  return (
    <div className={`${className}`}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {!showLibraryOnly && (
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="upload" className="flex items-center gap-1">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="browse" className="flex items-center gap-1">
              <Image className="h-4 w-4" />
              Media Library
            </TabsTrigger>
          </TabsList>
        )}
        
        {!showLibraryOnly && (
          <TabsContent value="upload">
            <MediaUpload onSuccess={handleUploadSuccess} />
          </TabsContent>
        )}
        
        <TabsContent value="browse" className={showLibraryOnly ? '' : ''}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="grid grid-cols-5 gap-1 rounded-md overflow-hidden border p-1 w-fit">
                <Button 
                  variant={selectedFilter === 'all' ? 'default' : 'ghost'} 
                  size="sm"
                  className="text-xs px-2"
                  onClick={() => setSelectedFilter('all')}
                >
                  All
                </Button>
                <Button 
                  variant={selectedFilter === 'image' ? 'default' : 'ghost'} 
                  size="sm"
                  className="text-xs px-2"
                  onClick={() => setSelectedFilter('image')}
                >
                  <Image className="h-3 w-3 mr-1" />
                  Images
                </Button>
                <Button 
                  variant={selectedFilter === 'video' ? 'default' : 'ghost'} 
                  size="sm"
                  className="text-xs px-2"
                  onClick={() => setSelectedFilter('video')}
                >
                  <FileVideo className="h-3 w-3 mr-1" />
                  Videos
                </Button>
                <Button 
                  variant={selectedFilter === 'audio' ? 'default' : 'ghost'} 
                  size="sm"
                  className="text-xs px-2"
                  onClick={() => setSelectedFilter('audio')}
                >
                  <FileAudio className="h-3 w-3 mr-1" />
                  Audio
                </Button>
                <Button 
                  variant={selectedFilter === 'document' ? 'default' : 'ghost'} 
                  size="sm"
                  className="text-xs px-2"
                  onClick={() => setSelectedFilter('document')}
                >
                  <File className="h-3 w-3 mr-1" />
                  Docs
                </Button>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </Button>
          </div>
          
          {/* Media grid */}
          <div className="mt-6">
            {isLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">Loading media assets...</p>
              </div>
            ) : filteredAssets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredAssets.map((asset) => (
                  <Card key={asset.id} className="overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all" onClick={() => handleMediaSelect(asset)}>
                    {/* Preview based on media type */}
                    <div className="h-40 bg-muted">
                      {asset.type === 'image' ? (
                        <img 
                          src={asset.path} 
                          alt={asset.alt || 'Image'} 
                          className="w-full h-full object-cover"
                        />
                      ) : asset.type === 'video' ? (
                        <div className="flex items-center justify-center h-full bg-black/10">
                          <FileVideo className="h-12 w-12 text-primary/70" />
                        </div>
                      ) : asset.type === 'audio' ? (
                        <div className="flex items-center justify-center h-full bg-black/10">
                          <FileAudio className="h-12 w-12 text-primary/70" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full bg-black/10">
                          <File className="h-12 w-12 text-primary/70" />
                        </div>
                      )}
                    </div>
                    
                    <div className="p-3">
                      <h3 className="text-sm font-medium truncate">
                        {asset.title || asset.originalname || asset.filename}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(asset.filesize ? (asset.filesize / 1024).toFixed(1) : '0')} KB · {asset.created_at ? new Date(asset.created_at).toLocaleDateString() : 'Unknown date'}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border rounded-md">
                <File className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">No media assets found</p>
                {!showLibraryOnly && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={() => setActiveTab('upload')}
                  >
                    Upload Media
                  </Button>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}