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
          <TabsList className="grid w-full grid-cols-2 mb-6 rounded-full overflow-hidden p-1 bg-primary/5 border-primary/20">
            <TabsTrigger value="upload" className="flex items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-white">
              <Upload className="h-4 w-4" />
              Upload Resources
            </TabsTrigger>
            <TabsTrigger value="browse" className="flex items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-white">
              <Image className="h-4 w-4" />
              Resource Library
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
              <div className="grid grid-cols-5 gap-1 rounded-full overflow-hidden border border-primary/20 p-1 w-fit bg-primary/5">
                <Button 
                  variant={selectedFilter === 'all' ? 'default' : 'ghost'} 
                  size="sm"
                  className="text-xs px-2 rounded-full"
                  onClick={() => setSelectedFilter('all')}
                >
                  All Types
                </Button>
                <Button 
                  variant={selectedFilter === 'image' ? 'default' : 'ghost'} 
                  size="sm"
                  className="text-xs px-2 rounded-full"
                  onClick={() => setSelectedFilter('image')}
                >
                  <Image className="h-3 w-3 mr-1" />
                  Images
                </Button>
                <Button 
                  variant={selectedFilter === 'video' ? 'default' : 'ghost'} 
                  size="sm"
                  className="text-xs px-2 rounded-full"
                  onClick={() => setSelectedFilter('video')}
                >
                  <FileVideo className="h-3 w-3 mr-1" />
                  Videos
                </Button>
                <Button 
                  variant={selectedFilter === 'audio' ? 'default' : 'ghost'} 
                  size="sm"
                  className="text-xs px-2 rounded-full"
                  onClick={() => setSelectedFilter('audio')}
                >
                  <FileAudio className="h-3 w-3 mr-1" />
                  Audio
                </Button>
                <Button 
                  variant={selectedFilter === 'document' ? 'default' : 'ghost'} 
                  size="sm"
                  className="text-xs px-2 rounded-full"
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
              className="flex items-center gap-1 rounded-full border-primary/30 text-primary"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh Resources
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
                  <Card key={asset.id} className="medical-card overflow-hidden cursor-pointer hover:shadow-md transition-all" onClick={() => handleMediaSelect(asset)}>
                    {/* Preview based on media type */}
                    <div className="h-40 bg-primary/5 relative">
                      {asset.type === 'image' ? (
                        <>
                          <img 
                            src={asset.path} 
                            alt={asset.alt || 'Image'} 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm">
                            <Image className="h-4 w-4 text-primary" />
                          </div>
                        </>
                      ) : asset.type === 'video' ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="p-3 bg-primary/10 rounded-full">
                            <FileVideo className="h-10 w-10 text-primary" />
                          </div>
                          <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm">
                            <FileVideo className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                      ) : asset.type === 'audio' ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="p-3 bg-primary/10 rounded-full">
                            <FileAudio className="h-10 w-10 text-primary" />
                          </div>
                          <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm">
                            <FileAudio className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="p-3 bg-primary/10 rounded-full">
                            <File className="h-10 w-10 text-primary" />
                          </div>
                          <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm">
                            <File className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 border-t border-primary/10">
                      <h3 className="text-sm font-medium truncate">
                        {asset.title || asset.originalname || asset.filename}
                      </h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {asset.type}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {(asset.filesize ? (asset.filesize / 1024).toFixed(1) : '0')} KB
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-primary/20 rounded-md bg-primary/5">
                <div className="p-3 bg-white rounded-full inline-flex shadow-sm mx-auto mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="font-medium text-primary">No Clinical Resources Found</h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
                  Your medical resource library is currently empty. Upload new resources to begin building your collection.
                </p>
                {!showLibraryOnly && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="mt-4 rounded-full"
                    onClick={() => setActiveTab('upload')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Medical Resources
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